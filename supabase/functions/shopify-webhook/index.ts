import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Shopify-Topic, X-Shopify-Hmac-Sha256, X-Shopify-Shop-Domain",
};

interface ShopifyOrder {
  id: number;
  order_number: string;
  email: string;
  total_price: string;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const topic = req.headers.get("X-Shopify-Topic");
    const shopDomain = req.headers.get("X-Shopify-Shop-Domain");
    const hmac = req.headers.get("X-Shopify-Hmac-Sha256");

    if (!topic || !shopDomain) {
      return new Response(
        JSON.stringify({ error: "Missing Shopify headers" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orderData: ShopifyOrder = await req.json();

    if (topic === "orders/create") {
      const { data: config } = await supabase
        .from("shopify_config")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (!config) {
        return new Response(
          JSON.stringify({ error: "Shopify not configured" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      let customerId = null;

      if (orderData.customer && orderData.customer.email) {
        const { data: mapping } = await supabase
          .from("shopify_customer_mapping")
          .select("customer_id")
          .eq("shopify_customer_id", orderData.customer.id.toString())
          .maybeSingle();

        if (mapping) {
          customerId = mapping.customer_id;
        } else {
          const { data: existingCustomer } = await supabase
            .from("customers")
            .select("id")
            .eq("email", orderData.customer.email)
            .maybeSingle();

          if (existingCustomer) {
            customerId = existingCustomer.id;
          } else {
            const { data: newCustomer, error: customerError } = await supabase
              .from("customers")
              .insert({
                name: `${orderData.customer.first_name} ${orderData.customer.last_name}`.trim(),
                email: orderData.customer.email,
                phone: orderData.customer.phone || null,
                loyalty_points: 0,
              })
              .select()
              .single();

            if (!customerError && newCustomer) {
              customerId = newCustomer.id;
            }
          }

          if (customerId) {
            await supabase.from("shopify_customer_mapping").insert({
              shopify_customer_id: orderData.customer.id.toString(),
              customer_id: customerId,
              email: orderData.customer.email,
            });
          }
        }
      }

      const totalAmount = parseFloat(orderData.total_price);
      const { data: commission } = await supabase.rpc(
        "calculate_shopify_commission",
        {
          total_amount: totalAmount,
          commission_pct: config.commission_percentage,
          gateway_pct: config.payment_gateway_fee,
        }
      );

      const commissionAmount = commission?.[0]?.commission_amount || 0;
      const netAmount = commission?.[0]?.net_amount || totalAmount;

      const { error: orderError } = await supabase
        .from("shopify_orders")
        .insert({
          shopify_order_id: orderData.id.toString(),
          order_number: orderData.order_number.toString(),
          customer_id: customerId,
          total_amount: totalAmount,
          commission_amount: commissionAmount,
          net_amount: netAmount,
          order_data: orderData,
        });

      if (orderError) {
        console.error("Error inserting order:", orderError);
        return new Response(
          JSON.stringify({ error: "Failed to save order" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (customerId) {
        const loyaltyPoints = Math.floor(totalAmount / 1000);
        if (loyaltyPoints > 0) {
          await supabase.rpc("increment", {
            table_name: "customers",
            row_id: customerId,
            column_name: "loyalty_points",
            amount: loyaltyPoints,
          }).catch(() => {
            console.log("Loyalty points update skipped");
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          order_id: orderData.id,
          customer_id: customerId,
          net_amount: netAmount,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook received" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
