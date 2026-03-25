import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SyncRequest {
  product_id: string;
  quantity: number;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: authResult, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authResult.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, is_active")
      .eq("user_id", authResult.user.id)
      .maybeSingle();

    const normalizedRole = profile?.role?.toLowerCase();

    if (!profile?.is_active || (normalizedRole !== "admin" && normalizedRole !== "operario")) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: config, error: configError } = await supabase
      .from("shopify_config")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "Shopify not configured or not active" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!config.access_token || !config.shop_domain) {
      return new Response(
        JSON.stringify({ error: "Missing Shopify credentials" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { product_id, quantity }: SyncRequest = await req.json();

    if (!product_id) {
      return new Response(
        JSON.stringify({ error: "product_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", product_id)
      .maybeSingle();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!product.shopify_product_id || !product.shopify_variant_id) {
      return new Response(
        JSON.stringify({
          error: "Product not linked to Shopify. Please configure shopify_product_id and shopify_variant_id first.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const shopifyUrl = `https://${config.shop_domain}/admin/api/${config.api_version}/inventory_levels/set.json`;

    const { data: inventoryData, error: inventoryError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", product_id)
      .maybeSingle();

    const stockQuantity = quantity !== undefined ? quantity : (inventoryData?.stock_quantity || 0);

    const locationId = await getShopifyLocationId(
      config.shop_domain,
      config.api_version,
      config.access_token
    );

    if (!locationId) {
      await supabase.from("stock_sync_log").insert({
        product_id: product_id,
        shopify_product_id: product.shopify_product_id,
        shopify_variant_id: product.shopify_variant_id,
        quantity_synced: stockQuantity,
        status: "failed",
        error_message: "Could not get Shopify location ID",
      });

      return new Response(
        JSON.stringify({ error: "Could not get Shopify location ID" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const inventoryItemId = await getInventoryItemId(
      config.shop_domain,
      config.api_version,
      config.access_token,
      product.shopify_variant_id
    );

    if (!inventoryItemId) {
      await supabase.from("stock_sync_log").insert({
        product_id: product_id,
        shopify_product_id: product.shopify_product_id,
        shopify_variant_id: product.shopify_variant_id,
        quantity_synced: stockQuantity,
        status: "failed",
        error_message: "Could not get inventory item ID",
      });

      return new Response(
        JSON.stringify({ error: "Could not get inventory item ID" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(shopifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": config.access_token,
      },
      body: JSON.stringify({
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: Math.floor(stockQuantity),
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      await supabase.from("stock_sync_log").insert({
        product_id: product_id,
        shopify_product_id: product.shopify_product_id,
        shopify_variant_id: product.shopify_variant_id,
        quantity_synced: stockQuantity,
        status: "failed",
        error_message: JSON.stringify(responseData),
      });

      return new Response(
        JSON.stringify({ error: "Shopify API error", details: responseData }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabase.from("stock_sync_log").insert({
      product_id: product_id,
      shopify_product_id: product.shopify_product_id,
      shopify_variant_id: product.shopify_variant_id,
      quantity_synced: stockQuantity,
      status: "success",
    });

    await supabase
      .from("shopify_config")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", config.id);

    return new Response(
      JSON.stringify({
        success: true,
        product_id: product_id,
        quantity_synced: stockQuantity,
        shopify_response: responseData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error syncing stock:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function getShopifyLocationId(
  shopDomain: string,
  apiVersion: string,
  accessToken: string
): Promise<string | null> {
  try {
    const url = `https://${shopDomain}/admin/api/${apiVersion}/locations.json`;
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    });

    const data = await response.json();
    return data.locations?.[0]?.id || null;
  } catch (error) {
    console.error("Error getting location ID:", error);
    return null;
  }
}

async function getInventoryItemId(
  shopDomain: string,
  apiVersion: string,
  accessToken: string,
  variantId: string
): Promise<string | null> {
  try {
    const url = `https://${shopDomain}/admin/api/${apiVersion}/variants/${variantId}.json`;
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    });

    const data = await response.json();
    return data.variant?.inventory_item_id || null;
  } catch (error) {
    console.error("Error getting inventory item ID:", error);
    return null;
  }
}
