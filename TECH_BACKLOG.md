# Backlog Tecnico Priorizado - CTP ERP

## Objetivo

Traducir los riesgos y gaps detectados en `PRD.md` en un backlog tecnico accionable, ordenado por impacto operativo, riesgo y dependencia.

## Criterios de priorizacion

- `P0`: bloquea confiabilidad del producto, compilacion, seguridad o datos.
- `P1`: mejora exactitud operativa y cierre real de flujos clave.
- `P2`: mejora mantenibilidad, claridad y escalabilidad.

## P0 - Critico

### 1. Recuperar salud de compilacion TypeScript

**Problema**
- `npm run typecheck` falla con errores reales de dominio, tipos desalineados y multiples advertencias por codigo muerto.

**Impacto**
- Reduce confianza en el estado real del producto y dificulta evolucionar modulos sin romper otros.

**Archivos mas afectados**
- `src/components/FinancialHealthModule.tsx`
- `src/components/InventoryModule.tsx`
- `src/components/ProductionSheetModule.tsx`
- `src/lib/pdfGenerator.ts`
- `src/components/ProductionModule.tsx`
- `src/components/CostingModule.tsx`
- `src/contexts/AuthContext.tsx`

**Trabajo sugerido**
- Corregir incompatibilidades de tipos que afectan comportamiento real antes de limpiar warnings menores.
- Separar errores de dominio de warnings por imports o variables sin uso.
- Establecer `typecheck` como criterio minimo de merge.

**Definition of done**
- `npm run typecheck` termina sin errores.
- Los tipos compartidos reflejan el schema real y el uso actual del frontend.

### 2. Normalizar roles y permisos entre UI, auth y base de datos

**Problema**
- El producto usa `admin`, `operario` y `vendedor` en UI, pero hay evidencia de variantes historicas como `operator` y `ADMIN`.

**Impacto**
- Riesgo de permisos inconsistentes, modulos ocultos o flujos rotos segun el origen del usuario.

**Archivos mas afectados**
- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/components/UserManual.tsx`
- `supabase/migrations/20260320124633_add_user_profiles_and_roles.sql`

**Trabajo sugerido**
- Definir un catalogo unico de roles.
- Migrar datos historicos a esa nomenclatura.
- Centralizar helpers de permisos y validacion de rol.

**Definition of done**
- Existe una unica nomenclatura de roles usada por UI, tipos y DB.
- Un usuario con cada rol ve exactamente los modulos esperados.

### 3. Unificar cliente Supabase y tipos de dominio

**Problema**
- Hay duplicidad de cliente Supabase y los tipos compartidos no siempre coinciden con el uso real de los modulos.

**Impacto**
- Duplica puntos de mantenimiento y favorece que cada modulo opere con supuestos distintos.

**Archivos mas afectados**
- `src/lib/supabase.ts`
- `src/utils/supabase.ts`
- modulos que importan tipos desde `src/lib/supabase.ts`

**Trabajo sugerido**
- Dejar una sola entrada para cliente y tipos.
- Revisar exports faltantes o incorrectos como `Customer`.
- Separar tipos manuales temporales de tipos derivados del schema si hace falta.

**Definition of done**
- Solo existe un cliente Supabase en uso.
- Los modulos importan tipos desde una fuente de verdad comun.

### 4. Alinear modelo de dominio de productos, ventas y finanzas con el schema real

**Problema**
- Hay referencias a campos inexistentes o con distinto nombre, como `product_name`, `sales_channel`, `customer_id` y `total_items`.

**Impacto**
- Riesgo directo de dashboards incorrectos, PDFs rotos y decisiones operativas basadas en datos mal interpretados.

**Archivos mas afectados**
- `src/lib/pdfGenerator.ts`
- `src/components/FinancialHealthModule.tsx`
- `src/components/ProductionSheetModule.tsx`
- `src/lib/supabase.ts`

**Trabajo sugerido**
- Revisar naming final del dominio en `products`, `sales_orders`, `customers` y tablas relacionadas.
- Corregir campos usados por dashboards, reportes y documentos imprimibles.
- Documentar relaciones que el frontend puede asumir de forma segura.

**Definition of done**
- Los nombres de campos del frontend coinciden con el schema y tipos compartidos.
- Los calculos financieros y documentos imprimibles usan datos reales.

### 5. Endurecer seguridad de integracion Shopify

**Problema**
- El webhook lee el HMAC pero no valida efectivamente la firma; ademas el modelo de invocacion del sync de stock merece revisarse.

**Impacto**
- Riesgo de aceptar eventos no confiables o exponer integraciones con una postura de seguridad debil.

**Archivos mas afectados**
- `supabase/functions/shopify-webhook/index.ts`
- `supabase/functions/shopify-sync-stock/index.ts`
- `src/components/ShopifyIntegrationModule.tsx`

**Trabajo sugerido**
- Implementar validacion real de HMAC para webhooks.
- Revisar secreto, autorizacion y origen permitido de invocaciones.
- Definir claramente que llamadas pueden salir desde frontend y cuales deben quedar server-side.

**Definition of done**
- El webhook rechaza requests con firma invalida.
- El flujo de sync usa credenciales y permisos acordes al riesgo.

## P1 - Alto

### 6. Cerrar correctamente el flujo compra -> inventario de empaque

**Problema**
- `PurchasesModule` actualiza `packaging_inventory` solo si el item ya existe y no cubre bien altas nuevas.

**Impacto**
- Compras registradas pueden no reflejar inventario real.

**Archivos mas afectados**
- `src/components/PurchasesModule.tsx`
- `supabase/migrations/20260323012420_add_fiscal_purchases_inventory_system.sql`

**Trabajo sugerido**
- Soportar alta automatica o flujo asistido cuando el item comprado no exista.
- Registrar tambien el movimiento de inventario asociado.

**Definition of done**
- Toda compra relevante actualiza o crea correctamente su item de inventario.
- El stock posterior coincide con la compra registrada.

### 7. Consolidar el modelo de produccion entre modulos

**Problema**
- `ProductionModule` y `ProductionSheetModule` parecen modelar produccion/lotes con supuestos distintos.

**Impacto**
- Puede haber doble fuente de verdad para lotes, ordenes o consumo de insumos.

**Archivos mas afectados**
- `src/components/ProductionModule.tsx`
- `src/components/ProductionSheetModule.tsx`
- `supabase/migrations/20260319111316_create_ctp_erp_schema.sql`
- `supabase/migrations/20260323012420_add_fiscal_purchases_inventory_system.sql`

**Trabajo sugerido**
- Decidir si el flujo principal gira en torno a `production_batches`, `production_orders` o ambos con relacion explicita.
- Unificar lenguaje, estados y datos minimos requeridos.

**Definition of done**
- Existe un modelo documentado y consistente para ordenes, lotes y consumo.
- Ambos modulos operan sobre el mismo flujo de negocio.

### 8. Volver real o marcar explicitamente como parcial el flujo VIP por email

**Problema**
- La edge function de email VIP devuelve exito mock sin evidencia de envio real.

**Impacto**
- Puede generar una falsa sensacion de automatizacion completa en CRM.

**Archivos mas afectados**
- `supabase/functions/send-vip-email/index.ts`
- `src/components/CRMModule.tsx`
- `src/components/VIPEmailPreview.tsx`

**Trabajo sugerido**
- Integrar proveedor real de email o marcar la funcionalidad como preview/simulacion.
- Registrar estado real del envio y errores.

**Definition of done**
- El sistema envia correo real con trazabilidad o comunica claramente que solo genera preview.

### 9. Rehacer la capa de salud financiera sobre datos confiables

**Problema**
- `FinancialHealthModule` depende de tipos y campos no alineados con la fuente real.

**Impacto**
- Riesgo alto de mostrar indicadores incorrectos a administracion y ventas.

**Archivos mas afectados**
- `src/components/FinancialHealthModule.tsx`
- `src/lib/supabase.ts`
- tablas de ventas, clientes y cuentas por cobrar

**Trabajo sugerido**
- Redefinir exactamente que metricas se pueden calcular hoy.
- Ajustar queries y tipos a tablas existentes.
- Si faltan datos, degradar el modulo antes que inventar campos.

**Definition of done**
- El dashboard solo muestra metricas sustentadas por el modelo actual.
- No hay referencias a tipos o campos inexistentes.

## P2 - Medio

### 10. Limpiar codigo muerto, imports sin uso y variables no utilizadas

**Problema**
- El typecheck muestra una capa grande de ruido por elementos no usados.

**Impacto**
- Hace mas lenta la lectura del proyecto y oculta errores realmente relevantes.

**Archivos mas afectados**
- multiples componentes en `src/components/*`

**Trabajo sugerido**
- Limpiar imports, helpers y variables sin uso luego de corregir los errores de dominio.

**Definition of done**
- Los modulos activos no contienen ruido innecesario.
- Las advertencias restantes son excepciones justificadas.

### 11. Incorporar validaciones minimas para flujos criticos

**Problema**
- El repo no muestra una red minima de verificaciones automatizadas sobre auth, inventario, produccion y Shopify.

**Impacto**
- Cada cambio futuro puede reabrir bugs ya conocidos.

**Trabajo sugerido**
- Empezar por checks pequenos: smoke tests, validaciones de funciones puras o scripts de integridad.
- Priorizar auth/roles, inventario y parsing de payloads Shopify.

**Definition of done**
- Existen verificaciones automatizadas sobre los flujos mas sensibles.

### 12. Mantener documentacion tecnica alineada con el estado real

**Problema**
- El repositorio ya mostro deriva entre lo que parece ofrecer y lo que realmente ejecuta.

**Impacto**
- La deuda documental acelera malas decisiones de producto y desarrollo.

**Archivos mas afectados**
- `PRD.md`
- `Vision.md`
- `DEPLOYMENT.md`
- `README.md`

**Trabajo sugerido**
- Actualizar documentacion cada vez que una capacidad pase de parcial a operativa.
- Señalar explicitamente limitaciones temporales en integraciones y automatizaciones.

**Definition of done**
- La documentacion describe con claridad el estado actual de cada flujo clave.

## Orden recomendado de ejecucion

1. P0.1 Salud de compilacion TypeScript
2. P0.2 Normalizacion de roles
3. P0.3 Cliente y tipos Supabase unificados
4. P0.4 Alineacion de dominio productos/ventas/finanzas
5. P0.5 Seguridad Shopify
6. P1.6 Flujo compra -> inventario
7. P1.7 Consolidacion de produccion
8. P1.8 Flujo VIP real o explicitamente parcial
9. P1.9 Salud financiera confiable
10. P2.10 Limpieza de ruido tecnico
11. P2.11 Validaciones automatizadas minimas
12. P2.12 Alineacion continua de documentacion

## Resultado esperado

Si se ejecuta este backlog en orden, CTP ERP deberia pasar de un sistema funcionalmente amplio pero fragil a una base operativa mas confiable, auditable y segura para seguir creciendo.
