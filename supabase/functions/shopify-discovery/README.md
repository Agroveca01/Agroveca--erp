# API: Descubrimiento de Productos Shopify No Mapeados en ERP

Esta función expone un endpoint `GET` para listar productos y variantes de Shopify que aún no están vinculados en el ERP, junto con sugerencias automáticas de match según `SKU` y `product_id`.

La implementación actual usa la API GraphQL Admin de Shopify con autenticación por credenciales de cliente y pagina automáticamente todo el catálogo.

**Ruta:**
```
/supabase/functions/shopify-discovery
```

---

## Ejemplo de request

```http
GET /supabase/functions/shopify-discovery
Authorization: Bearer <supabase-jwt>
```

Requiere un JWT válido de Supabase en el header `Authorization`.

Variables de entorno requeridas en la función:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SHOPIFY_SHOP=
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
```

---

## Ejemplo de respuesta

```json
{
  "unmapped": [
    {
      "shopifyProduct": {
        "id": "gid://shopify/Product/1001",
        "title": "Fertilizante Universal 1L",
        "variants": [
          {
            "id": "gid://shopify/ProductVariant/2001",
            "title": "1L",
            "sku": "FERT-001-1L"
          }
        ]
      },
      "variant": {
        "id": "gid://shopify/ProductVariant/2001",
        "sku": "FERT-001-1L"
      },
      "suggestedMatch": null // O un objeto Product si hay match sugerido
    },
    // ...otros productos/variantes sin mapear
  ]
}
```

Si hay coincidencia entre la SKU del producto en Shopify y el `product_id` del ERP, `suggestedMatch` contendrá el objeto `Product` correspondiente.

## Errores esperados

- `401`: JWT faltante, inválido o expirado.
- `500`: falta configuración local o no se pudieron obtener productos ERP.
- `502`: Shopify rechazó la autenticación o devolvió un error en GraphQL.

---

## Prueba local recomendada

1. Configura los secrets de la función con `supabase secrets set` o desde el dashboard de Supabase.
2. Levanta las funciones localmente con `supabase functions serve`.
3. Obtén un JWT válido iniciando sesión en la app.
4. Invoca la función:

```bash
curl -i \
  -H "Authorization: Bearer <supabase-jwt>" \
  http://127.0.0.1:54321/functions/v1/shopify-discovery
```

## Uso y siguientes pasos
- El endpoint puede poblar el panel de salud de integración, alertar al usuario o guiar el mapeo manual.
- El contrato de respuesta exitoso se mantiene estable aunque falle la consulta a Shopify.

---

**TODO:**
- Enriquecer la lógica de sugerencia de matches considerando otros campos como nombre o formato.
- Extender el modelo `Product` en el ERP para soportar `shopify_product_id` y `shopify_variant_id` persistidos.
