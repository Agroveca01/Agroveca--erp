import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchShopifyProductsStub, findUnmappedShopifyProducts } from "./lib/shopifyProductDiscovery.ts";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const pubKey = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY")!;
    const supabase = createClient(supabaseUrl, pubKey, {
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

    // Stub: productos de Shopify (ejemplo; cambiar a API real en integración futura)
    const shopifyProducts = await fetchShopifyProductsStub();

    // Detectar productos no mapeados y sugerencias
    const unmapped = findUnmappedShopifyProducts(shopifyProducts, erpProducts);

    return new Response(JSON.stringify({ unmapped }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
