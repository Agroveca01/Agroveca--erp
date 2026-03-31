# Agroveca--erp

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/Agroveca01/Agroveca--erp)

## Estado actual del repo

- Frontend ERP en React + Vite + TypeScript sobre Supabase.
- Roles operativos vigentes: `admin`, `operario`, `vendedor`.
- Integracion Shopify endurecida con validacion de webhook y sync de stock autenticado.
- Flujo VIP documentado como simulacion explicita; no envia correos reales desde esta accion.
- Red de validaciones automatizadas extendida con `vitest` sobre helpers fiscales, auth recovery, permisos por rol, payloads Shopify y slices operativos de compras, inventario, produccion, ventas, despacho y finanzas.
- `FinancialHealthModule` ya permite una accion minima para marcar cobros en `accounts_receivable`.
- `OrderPreparationModule` y `ProductionSheetModule` ya exponen cola operativa y backlog de produccion con helpers compartidos.

## Estado funcional del MVP

- El backlog tecnico base (`P0`, `P1`, `P2-01`, `P2-02`, `P2-03`) se considera cerrado en el repo.
- El MVP esta muy cerca de un estado "estabilizado": los flujos base de compras, inventario, produccion, ventas, preparacion/despacho y salud financiera ya fueron endurecidos incrementalmente.
- El principal gap funcional explicitamente pendiente sigue siendo VIP email real; hoy se mantiene como simulacion documentada.
- La documentacion del producto debe seguir distinguiendo entre lo ya operativo, lo operativo pero en consolidacion y lo aun parcial o pendiente.

## Verificacion recomendada

```bash
npm install
npm test
npm run typecheck
npm run build
```

## Configuración de Ambientes: Desarrollo & Producción

Este proyecto soporta dos ambientes completamente separados: **Desarrollo** y **Producción**. 

### Archivos de variables de entorno

- **.env.local** → Para desarrollo local. No debe subirse al repo (protegido por .gitignore).
- **.env.production** → Para producción (build final). No debe subirse al repo (protegido por .gitignore).
- Ejemplos con estructura esperada: `.env.local.example` y `.env.production.example`.

### ¿Qué debes hacer al iniciar?
1. Clona el repositorio.
2. Copia el archivo `.env.local.example` como `.env.local` (para desarrollo) y
   el archivo `.env.production.example` como `.env.production` (para builds de producción si lo necesitas localmente).
3. Solicita a tu líder técnico o revisa tu dashboard de Supabase para obtener las URL y keys correctas para cada ambiente.

```
# .env.local (solo para DESARROLLO local)
VITE_SUPABASE_URL=https://<TU-PROYECTO-DEV>.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<PUBLISHABLE-KEY-DEV>

# .env.production (solo para PRODUCCIÓN/final)
VITE_SUPABASE_URL=https://<TU-PROYECTO-PROD>.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<PUBLISHABLE-KEY-PROD>
```

### Variables de entorno en Vercel
- Configura las mismas variables en tu proyecto Vercel, asignando los valores correctos a cada ambiente:
  - **Production:** variables del proyecto Supabase de producción
  - **Preview:** variables del proyecto Supabase de desarrollo

### Variables adicionales para funciones Shopify

Las funciones edge relacionadas con Shopify requieren secrets del lado servidor. En particular, `shopify-discovery` usa:

```env
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-de-supabase>
SHOPIFY_SHOP=<nombre-de-tienda-sin-myshopify-com>
SHOPIFY_CLIENT_ID=<client-id-de-shopify>
SHOPIFY_CLIENT_SECRET=<client-secret-de-shopify>
```

Estas variables no deben exponerse al frontend ni vivir en archivos `VITE_*`.

### Seguridad
- **Jamás** subas archivos .env ni claves privadas al repositorio.
- Todas las variables sensibles deben ir solo en archivos ignorados o configuradas desde el dashboard de Vercel.

### Notas adicionales
- Si creas un nuevo entorno Supabase para desarrollo, debes migrar los schemas y reglas según los requerimientos de tu feature/pr.
- El frontend nunca debe usar claves service_role, sólo las ANON/public.
- Para dudas, consulta esta sección antes de hacer despliegues o cambios de ambiente.
- El cliente del frontend usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` desde `src/lib/supabase.ts`.

---

## Cómo comprobar que tu ambiente está bien configurado

1. Inicia el frontend en modo desarrollo (`npm run dev` o similar) con tu `.env.local` apuntando a Supabase Dev.
2. Realiza un cambio en la base de datos de desarrollo (ejemplo: crea un nuevo usuario/test record en Supabase Dev).
3. Refresca el frontend: el nuevo dato debe aparecer. Si miras el proyecto Prod (panel Supabase Prod) verás que no se modificó.
4. Haz lo mismo en producción para verificar el aislamiento.
5. Si ves datos cruzados, revisa tus variables, despliegue y configuración de Vercel.

## Verificación específica de Shopify discovery

1. Configura los secrets de Supabase Functions para `SHOPIFY_SHOP`, `SHOPIFY_CLIENT_ID` y `SHOPIFY_CLIENT_SECRET`.
2. Inicia sesión en la app para obtener un JWT válido.
3. Ejecuta localmente `supabase functions serve`.
4. Invoca `GET /functions/v1/shopify-discovery` con el header `Authorization: Bearer <jwt>`.
5. Espera una respuesta con `unmapped`; si Shopify falla, el endpoint responderá con error `502`.

## Regla de unicidad para variantes Shopify

- Cada `shopify_variant_id` solo puede pertenecer a un producto ERP.
- La app ya lo valida en UI y además existe una migración para reforzarlo en base de datos.
- Si la migración falla, primero debes corregir manualmente cualquier variante Shopify duplicada en `products`.

## Configuración operativa de stock sync

- `SHOPIFY_SHOP` es la fuente de verdad server-side para la tienda Shopify.
- `shopify_config.shop_domain` debe coincidir con ese valor (ejemplo: `mi-tienda.myshopify.com`).
- `shopify_config.shopify_location_id` define la ubicación exacta donde se sincroniza el stock. Si no se configura, la función intentará usar la primera location devuelta por Shopify.

### Cómo obtener y probar la location correcta

1. Abre `Integración Shopify > Configurar`.
2. Espera a que cargue la lista `Locations disponibles en Shopify`.
3. Haz clic en `Usar esta` sobre la ubicación que debe reflejar el stock del ERP.
4. Guarda la configuración.
5. Ejecuta una sincronización manual con un producto ya mapeado y revisa `Últimas Sincronizaciones`.

## Checklist para el equipo

- [ ] Asegúrate de no tener claves reales en `.env` ni en otros archivos del repo.
- [ ] Reemplaza tu `.env.local` copiando el nuevo `.env.local.example` y coloca las claves correctas.
- [ ] Si haces un deploy en Vercel, valida que el entorno (Production vs Preview) tenga las variables del ambiente correcto.
- [ ] Antes de mergear a `main`, revisa que nada de desarrollo (ni datos ni keys) pase a producción.
- [ ] Ante cualquier duda, consulta a tu líder técnico.
