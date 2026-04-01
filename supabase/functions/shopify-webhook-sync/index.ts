import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

let shopifyAccessToken: string | undefined;
let shopifyTokenExpiresAt = 0;

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

async function getShopifyAccessToken(): Promise<string> {
  const shop = getRequiredEnv("SHOPIFY_SHOP");
  const clientId = getRequiredEnv("SHOPIFY_CLIENT_ID");
  const clientSecret = getRequiredEnv("SHOPIFY_CLIENT_SECRET");

  if (shopifyAccessToken && Date.now() < shopifyTokenExpiresAt - 60000) {
    return shopifyAccessToken;
  }

  const response = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to obtain Shopify token (${response.status})`);
  }

  const { access_token, expires_in } = await response.json();
  shopifyAccessToken = access_token;
  shopifyTokenExpiresAt = Date.now() + (Number(expires_in) || 86400) * 1000;
  return access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(getRequiredEnv("SUPABASE_URL"), getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"));

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: authResult, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authResult.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, is_active")
      .eq("user_id", authResult.user.id)
      .maybeSingle();

    const normalizedRole = profile?.role?.toLowerCase();
    if (!profile?.is_active || normalizedRole !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: config } = await supabase
      .from("shopify_config")
      .select("api_version")
      .eq("is_active", true)
      .maybeSingle();

    const { expected_address } = await req.json();

    if (!expected_address) {
      return new Response(JSON.stringify({ error: "Missing expected_address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiVersion = config?.api_version || "2026-01";
    const shopDomain = `${getRequiredEnv("SHOPIFY_SHOP")}.myshopify.com`;
    const accessToken = await getShopifyAccessToken();

    const listResponse = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/webhooks.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    });

    const listPayload = await listResponse.json();

    if (!listResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to list webhooks", details: listPayload }), {
        status: listResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingWebhook = (listPayload.webhooks || []).find((webhook: { topic?: string }) => webhook.topic === "orders/create");

    if (existingWebhook?.address === expected_address) {
      return new Response(JSON.stringify({ success: true, action: "noop", webhook: existingWebhook }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existingWebhook) {
      const updateResponse = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/webhooks/${existingWebhook.id}.json`, {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhook: {
            id: existingWebhook.id,
            address: expected_address,
            topic: "orders/create",
            format: "json",
          },
        }),
      });

      const updatePayload = await updateResponse.json();

      if (!updateResponse.ok) {
        return new Response(JSON.stringify({ error: "Failed to update webhook", details: updatePayload }), {
          status: updateResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, action: "updated", webhook: updatePayload.webhook }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const createResponse = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/webhooks.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook: {
          address: expected_address,
          topic: "orders/create",
          format: "json",
        },
      }),
    });

    const createPayload = await createResponse.json();

    if (!createResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to create webhook", details: createPayload }), {
        status: createResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, action: "created", webhook: createPayload.webhook }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
