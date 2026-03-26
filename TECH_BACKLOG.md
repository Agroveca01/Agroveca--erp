# Backlog Tecnico Priorizado - CTP ERP

## Objetivo

Traducir los riesgos y gaps detectados en `PRD.md` en un backlog tecnico accionable, ordenado por impacto operativo, riesgo y dependencia.

## Criterios de priorizacion

- `P0`: bloquea confiabilidad del producto, compilacion, seguridad o datos.
- `P1`: mejora exactitud operativa y cierre real de flujos clave.
- `P2`: mejora mantenibilidad, claridad y escalabilidad.

## P0 - Critico

### 1. Recuperar salud de compilacion TypeScript

**Estado**
- Resuelto: `npm run typecheck` es criterio de merge y hoy corre en verde.

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

**Estado**
- Resuelto en baseline: la app opera con `admin`, `operario` y `vendedor`, y los aliases legacy quedaron absorbidos por helpers de normalizacion.

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

**Estado**
- Resuelto en cliente: `src/utils/supabase.ts` fue eliminado y `src/lib/supabase.ts` queda como entrada canonica.
- Pendiente parcial: seguir consolidando los tipos/export surface compartidos segun evolucione el dominio.

**Problema**
- Los tipos compartidos no siempre coinciden con el uso real de los modulos y antes existia duplicidad de cliente Supabase ya resuelta.

**Impacto**
- Duplica puntos de mantenimiento y favorece que cada modulo opere con supuestos distintos.

**Archivos mas afectados**
- `src/lib/supabase.ts`
- modulos que importan tipos desde `src/lib/supabase.ts`

**Trabajo sugerido**
- Dejar una sola entrada para cliente y tipos.
- Revisar exports faltantes o incorrectos como `Customer`.
- Separar tipos manuales temporales de tipos derivados del schema si hace falta.

**Definition of done**
- Solo existe un cliente Supabase en uso.
- Los modulos importan tipos desde una fuente de verdad comun.

### 4. Alinear modelo de dominio de productos, ventas y finanzas con el schema real

**Estado**
- Resuelto en baseline: se corrigieron desalineaciones clave de contratos y tipos para que dashboards y modulos usen campos reales.
- Pendiente parcial: seguir ajustando contratos compartidos a medida que crezcan nuevos flujos o reportes.

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

**Estado**
- Resuelto en baseline: webhook con validacion real de HMAC, `shop_domain` validado y stock sync con auth/rol real.

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

**Estado**
- Resuelto en baseline: compras e invoices ya crean/actualizan `packaging_inventory` y registran movimientos asociados.

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

**Estado**
- Resuelto en baseline: `ProductionSheetModule` y los lifecycle fields quedaron alineados con batches y orders.
- Pendiente parcial: seguir vigilando que nuevas iteraciones no reabran divergencias entre modulos.

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

**Estado**
- Resuelto en baseline: el flujo quedo explicitamente comunicado como preview/simulacion, no como envio real.
- Pendiente funcional: integrar proveedor real solo si el roadmap vuelve a priorizar email operativo.

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

**Estado**
- Resuelto en baseline: el dashboard fue degradado/replanteado para usar solo metricas soportadas por datos reales.

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

**Estado**
- Resuelto: `npm run lint`, `npm run typecheck` y `npm test` quedan en verde tras cerrar la limpieza incremental de imports, helpers, callbacks y exports ruidosos.
- Resuelto con cobertura: cada slice final de limpieza se cerro con tests de regresion sobre el comportamiento tocado.

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

**Estado**
- Resuelto en baseline: el repo ya cuenta con `vitest`, script `npm test` y validaciones reproducibles sobre helpers fiscales y normalizacion de roles.
- Resuelto en cobertura adicional: se sumaron checks sobre recovery auth, permisos por rol y seleccion de payloads Shopify en flujos de stock sync.
- Pendiente parcial: crecer gradualmente hacia inventario o produccion si aparecen cambios de mayor riesgo.

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

**Estado**
- Resuelto en baseline: `README.md`, `DEPLOYMENT.md`, `Vision.md` y `PRD.md` fueron actualizados para reflejar el estado real del sistema.
- Trabajo continuo: seguir actualizando la documentacion cuando se cierre un nuevo bloque funcional o tecnico.

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

**Estado del backlog hoy**
- P0: cerrado en baseline.
- P1: cerrado en baseline para MVP operativo.
- P2-01: resuelto.
- P2-02: resuelto en baseline.
- P2-03: resuelto en baseline.
- Siguiente foco recomendado: ampliar cobertura automatizada mas alla del baseline en inventario/produccion y mantener backlog/documentacion sincronizados.

1. P0.1 Salud de compilacion TypeScript
2. P0.2 Normalizacion de roles
3. P0.3 Cliente y tipos Supabase unificados
4. P0.4 Alineacion de dominio productos/ventas/finanzas
5. P0.5 Seguridad Shopify
6. P1.6 Flujo compra -> inventario
7. P1.7 Consolidacion de produccion
8. P1.8 Flujo VIP real o explicitamente parcial
9. P1.9 Salud financiera confiable
10. P2.11 Validaciones automatizadas minimas
11. P2.12 Alineacion continua de documentacion
12. Nuevo bloque funcional o de trazabilidad segun roadmap vigente

## Resultado esperado

Si se ejecuta este backlog en orden, CTP ERP deberia pasar de un sistema funcionalmente amplio pero fragil a una base operativa mas confiable, auditable y segura para seguir creciendo.
