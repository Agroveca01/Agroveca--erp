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

const textEncoder = new TextEncoder();

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

interface ActiveShopifyConfig {
  shop_domain: string | null;
  commission_percentage: number | null;
  payment_gateway_fee: number | null;
}

interface WebhookAuditEvent {
  id: string;
}

function normalizeShopDomain(value: string): string {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "").trim().toLowerCase();
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

async function verifyShopifyWebhook(
  payload: string,
  providedHmac: string,
  webhookSecret: string,
): Promise<boolean> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    textEncoder.encode(payload),
  );

  const expectedHmac = toBase64(new Uint8Array(signature));
  return timingSafeEqual(expectedHmac, providedHmac);
}

function scheduleBackgroundTask(task: Promise<unknown>): boolean {
  const runtime = globalThis as typeof globalThis & {
    EdgeRuntime?: {
      waitUntil?: (promise: Promise<unknown>) => void;
    };
  };

  if (!runtime.EdgeRuntime?.waitUntil) {
    return false;
  }

  runtime.EdgeRuntime.waitUntil(task);
  return true;
}

async function createWebhookAuditEvent(
  supabase: ReturnType<typeof createClient>,
  topic: string | null,
  shopDomain: string | null,
  webhookId: string | null,
  payload: string,
): Promise<string | null> {
  const payloadJson = safeParseJson(payload);
  const { data, error } = await supabase
    .from("shopify_webhook_events")
    .insert({
      topic,
      shop_domain: shopDomain,
      shopify_webhook_id: webhookId,
      status: "received",
      payload: payloadJson,
    })
    .select("id")
    .single<WebhookAuditEvent>();

  if (error) {
    console.error("Failed to create webhook audit event:", error);
    return null;
  }

  return data?.id ?? null;
}

async function updateWebhookAuditEvent(
  supabase: ReturnType<typeof createClient>,
  eventId: string | null,
  updates: Record<string, unknown>,
) {
  if (!eventId) {
    return;
  }

  const { error } = await supabase
    .from("shopify_webhook_events")
    .update(updates)
    .eq("id", eventId);

  if (error) {
    console.error("Failed to update webhook audit event:", error);
  }
}

function safeParseJson(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return { raw_payload: payload };
  }
}

async function processOrdersCreateWebhook(
  supabase: ReturnType<typeof createClient>,
  orderData: ShopifyOrder,
  activeConfig: ActiveShopifyConfig,
  webhookEventId: string | null,
) {
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
      commission_pct: activeConfig.commission_percentage || 0,
      gateway_pct: activeConfig.payment_gateway_fee || 0,
    }
  );

  const commissionAmount = commission?.[0]?.commission_amount || 0;
  const netAmount = commission?.[0]?.net_amount || totalAmount;

  const { error: orderError } = await supabase
    .from("shopify_orders")
    .upsert({
      shopify_order_id: orderData.id.toString(),
      order_number: orderData.order_number.toString(),
      customer_id: customerId,
      total_amount: totalAmount,
      commission_amount: commissionAmount,
      net_amount: netAmount,
      order_data: orderData,
    }, {
      onConflict: "shopify_order_id",
      ignoreDuplicates: false,
    });

  if (orderError) {
    await updateWebhookAuditEvent(supabase, webhookEventId, {
      status: "failed",
      http_status: 500,
      error_message: orderError.message,
      processed_at: new Date().toISOString(),
    });
    throw new Error(`Failed to save order: ${orderError.message}`);
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

  await updateWebhookAuditEvent(supabase, webhookEventId, {
    status: "processed",
    http_status: 200,
    error_message: null,
    processed_at: new Date().toISOString(),
  });

  return {
    order_id: orderData.id,
    customer_id: customerId,
    net_amount: netAmount,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const shopifyClientSecret = getRequiredEnv("SHOPIFY_CLIENT_SECRET");
    const shopifyShopDomain = `${getRequiredEnv("SHOPIFY_SHOP")}.myshopify.com`;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const topic = req.headers.get("X-Shopify-Topic");
    const shopDomain = req.headers.get("X-Shopify-Shop-Domain");
    const hmac = req.headers.get("X-Shopify-Hmac-Sha256");
    const webhookId = req.headers.get("X-Shopify-Webhook-Id");

    let webhookEventId: string | null = null;

    if (!topic || !shopDomain || !hmac) {
      return new Response(
        JSON.stringify({ error: "Missing Shopify headers" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rawBody = await req.text();
    webhookEventId = await createWebhookAuditEvent(supabase, topic, shopDomain, webhookId, rawBody);

    const { data: config } = await supabase
      .from("shopify_config")
      .select("shop_domain, commission_percentage, payment_gateway_fee")
      .eq("is_active", true)
      .maybeSingle();

    if (!config) {
      await updateWebhookAuditEvent(supabase, webhookEventId, {
        status: "rejected",
        http_status: 400,
        error_message: "Shopify not configured",
        processed_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: "Shopify not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const normalizedIncomingShopDomain = normalizeShopDomain(shopDomain);
    const normalizedConfigDomain = normalizeShopDomain(config.shop_domain || shopifyShopDomain);
    const normalizedSecretDomain = normalizeShopDomain(shopifyShopDomain);

    if (
      normalizedIncomingShopDomain !== normalizedConfigDomain ||
      normalizedIncomingShopDomain !== normalizedSecretDomain
    ) {
      await updateWebhookAuditEvent(supabase, webhookEventId, {
        status: "rejected",
        http_status: 401,
        error_message: "Shop domain mismatch",
        processed_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: "Shop domain mismatch" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isValidWebhook = await verifyShopifyWebhook(rawBody, hmac, shopifyClientSecret);

    if (!isValidWebhook) {
      await updateWebhookAuditEvent(supabase, webhookEventId, {
        status: "rejected",
        http_status: 401,
        error_message: "Invalid webhook signature",
        processed_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orderData: ShopifyOrder = JSON.parse(rawBody);

    if (topic === "orders/create") {
      await updateWebhookAuditEvent(supabase, webhookEventId, {
        status: "accepted",
        http_status: 200,
      });

      const processingTask = processOrdersCreateWebhook(supabase, orderData, config, webhookEventId);

      if (scheduleBackgroundTask(processingTask.catch((error) => {
        updateWebhookAuditEvent(supabase, webhookEventId, {
          status: "failed",
          http_status: 500,
          error_message: error instanceof Error ? error.message : "Unknown background error",
          processed_at: new Date().toISOString(),
        }).catch((auditError) => {
          console.error("Failed to persist webhook background error:", auditError);
        });
        console.error("Error processing orders/create webhook:", error);
      }))) {
        return new Response(
          JSON.stringify({
            success: true,
            accepted: true,
            topic,
            order_id: orderData.id,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await processingTask;

      return new Response(
        JSON.stringify({
          success: true,
          processed: true,
          topic,
          order_id: result?.order_id ?? orderData.id,
          customer_id: result?.customer_id ?? null,
          net_amount: result?.net_amount ?? null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await updateWebhookAuditEvent(supabase, webhookEventId, {
      status: "processed",
      http_status: 200,
      processed_at: new Date().toISOString(),
    });

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
