import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchShopifyProducts, findUnmappedShopifyProducts } from "./lib/shopifyProductDiscovery.ts";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Error desconocido";
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Falta variable de entorno requerida: ${name}`);
  }

  return value;
}

function getErrorStatus(message: string): number {
  if (/faltan variables|falta configuracion de entorno/i.test(message)) {
    return 500;
  }

  if (/token shopify|shopify api error|shopify graphql errors/i.test(message)) {
    return 502;
  }

  return 500;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  try {
    // --- JWT Extraction and Validation ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No autorizado: token faltante" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const jwt = authHeader.substring("Bearer ".length);

    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: `Bearer ${jwt}` },
      },
    });

    // Validate the JWT with Supabase
    const { data: user, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "JWT inválido o expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obtener todos los productos ERP
    const { data: erpProducts, error: erpError } = await supabase
      .from("products")
      .select("*");
    if (erpError || !Array.isArray(erpProducts)) {
      return new Response(
        JSON.stringify({ error: "No se pudo obtener productos ERP", details: erpError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shopifyProducts = await fetchShopifyProducts();

    // Detectar productos no mapeados y sugerencias
    const unmapped = findUnmappedShopifyProducts(shopifyProducts, erpProducts);

    return new Response(JSON.stringify({ unmapped }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    return new Response(JSON.stringify({ error: message }), {
      status: getErrorStatus(message),
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
