import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

  if (req.method !== "GET") {
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
    if (!profile?.is_active || (normalizedRole !== "admin" && normalizedRole !== "operario")) {
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

    const apiVersion = config?.api_version || "2026-01";
    const shopDomain = `${getRequiredEnv("SHOPIFY_SHOP")}.myshopify.com`;
    const accessToken = await getShopifyAccessToken();

    const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/locations.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Shopify API error", details: payload }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const locations = (payload.locations || []).map((location: { id: number | string; name?: string; active?: boolean }) => ({
      id: `gid://shopify/Location/${location.id}`,
      legacy_id: String(location.id),
      name: location.name || `Location ${location.id}`,
      active: location.active ?? true,
    }));

    return new Response(JSON.stringify({ locations }), {
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
