# Tech Backlog - Issues Ejecutables

## Objetivo

Convertir `TECH_BACKLOG.md` en tareas concretas, ejecutables y faciles de asignar, con foco en archivos, entregables y criterio de cierre.

## Convencion

- `ID`: identificador corto para seguimiento.
- `Prioridad`: `P0`, `P1` o `P2`.
- `Tipo`: bug, refactor, seguridad, alineacion de datos, documentacion o validacion.
- `Bloquea`: que otras tareas dependen de esta.

## P0

### ISSUE P0-01 - Corregir contratos de tipos en auth e inventario

- `Tipo`: bug / alineacion de tipos
- `Bloquea`: `P0-02`, `P0-03`, `P1-09`
- `Archivos`:
  - `src/contexts/AuthContext.tsx`
  - `src/components/InventoryModule.tsx`
  - `src/App.tsx`
- `Problema concreto`:
  - `InventoryModule` usa `isOperator` pero `AuthContext` no lo expone.
  - Existen desalineaciones entre enums/strings de categorias, tipos de producto y roles.
- `Tareas`:
  - Definir el contrato final de `AuthContextType`.
  - Resolver si `isOperator` debe existir o si el modulo debe usar una verificacion distinta.
  - Tipar correctamente categorias de materias primas y tipos de producto usados en formularios.
  - Alinear el chequeo de permisos de `App.tsx` con el contrato final.
- `Cierre esperado`:
  - Inventario compila sin castings inconsistentes.
  - El auth contract soporta correctamente los roles visibles del producto.

### ISSUE P0-02 - Unificar nomenclatura de roles en frontend y schema

- `Tipo`: alineacion de dominio
- `Bloquea`: permisos, tareas por rol, avisos, KPIs
- `Archivos`:
  - `src/App.tsx`
  - `src/contexts/AuthContext.tsx`
  - `src/components/UserManual.tsx`
  - `supabase/migrations/20260320124633_add_user_profiles_and_roles.sql`
  - cualquier helper o tipo de rol en `src/lib/supabase.ts`
- `Problema concreto`:
  - Conviven `admin`, `operario`, `vendedor`, `operator` y potencialmente variantes legacy.
- `Tareas`:
  - Definir un set oficial de roles.
  - Detectar valores legacy permitidos solo para migracion.
  - Documentar mapping legacy -> canonical.
  - Revisar politicas y consultas que dependan del valor textual del rol.
- `Cierre esperado`:
  - Toda la app opera con una nomenclatura unica de roles.

### ISSUE P0-03 - Consolidar cliente Supabase y exports tipados

- `Estado`: parcialmente resuelto; el cliente duplicado ya fue eliminado y queda pendiente mantener la fuente unica de tipos/export surface.

- `Tipo`: refactor / arquitectura
- `Bloquea`: `P0-04`, `P1-09`, `P2-11`
- `Archivos`:
  - `src/lib/supabase.ts`
  - modulos que importan cliente o tipos Supabase
- `Problema concreto`:
  - La duplicidad de cliente ya se resolvio, pero los tipos compartidos todavia requieren consolidacion continua para evitar colisiones o vacios.
- `Tareas`:
  - Mantener `src/lib/supabase.ts` como ubicacion canonica del cliente y tipos.
  - Revisar tipos exportados, incluyendo entidades faltantes o mal nombradas.
  - Dejar una sola fuente de verdad para contratos de datos.
- `Cierre esperado`:
  - No quedan imports activos desde una ruta duplicada.
  - Los tipos base del dominio salen de una fuente comun.

### ISSUE P0-04 - Corregir desalineacion de campos de producto, ventas y cliente

- `Tipo`: bug / alineacion de datos
- `Bloquea`: `P1-09`, reportes, PDFs
- `Archivos`:
  - `src/lib/pdfGenerator.ts`
  - `src/components/FinancialHealthModule.tsx`
  - `src/components/ProductionSheetModule.tsx`
  - `src/lib/supabase.ts`
- `Problema concreto`:
  - El frontend usa campos como `product_name`, `sales_channel`, `customer_id` y `total_items` que no coinciden con el contrato observado.
- `Tareas`:
  - Verificar nombres reales del schema para productos y ventas.
  - Reescribir acceso a campos incorrectos.
  - Ajustar tipos de `Product`, `SalesOrder` y entidades relacionadas.
  - Validar que PDF, hoja de produccion y salud financiera lean datos consistentes.
- `Cierre esperado`:
  - No quedan referencias a campos inexistentes en esos modulos.

### ISSUE P0-05 - Reparar errores de dominio en produccion y costing

- `Tipo`: bug
- `Bloquea`: cierre de `typecheck`
- `Archivos`:
  - `src/components/ProductionModule.tsx`
  - `src/components/CostingModule.tsx`
- `Problema concreto`:
  - Hay comparaciones de tipos incompatibles y uso incorrecto de builders Supabase como si fueran promesas resueltas.
- `Tareas`:
  - Revisar comparaciones string vs number en produccion.
  - Corregir llamadas asincronas en costing para que esperen la ejecucion real de queries.
  - Verificar que los updates a `products`, `format_costs` y `fixed_costs_config` devuelvan el contrato esperado.
- `Cierre esperado`:
  - Produccion y costing compilan y mantienen comportamiento esperado.

### ISSUE P0-06 - Endurecer validacion del webhook de Shopify

- `Tipo`: seguridad
- `Bloquea`: rollout serio de integracion Shopify
- `Archivos`:
  - `supabase/functions/shopify-webhook/index.ts`
  - `supabase/functions/shopify-sync-stock/index.ts`
  - `src/components/ShopifyIntegrationModule.tsx`
- `Problema concreto`:
  - El webhook recibe HMAC pero no verifica la firma; el modelo de autorizacion del sync debe revisarse.
- `Tareas`:
  - Implementar validacion criptografica de HMAC.
  - Revisar origen/autorizacion del sync de stock.
  - Asegurar que secretos y permisos no dependan de uso laxo desde frontend.
- `Cierre esperado`:
  - Requests invalidos son rechazados.
  - El flujo de sync tiene una postura de seguridad definida.

### ISSUE P0-07 - Cerrar `typecheck` limpiando errores prioritarios y luego ruido tecnico

- `Tipo`: calidad / estabilizacion
- `Bloquea`: cualquier trabajo seguro sobre el frontend
- `Archivos`:
  - `src/components/*`
  - `src/lib/*`
  - `src/contexts/*`
- `Problema concreto`:
  - El repo mezcla errores estructurales con warnings por imports/variables no usadas.
- `Tareas`:
  - Resolver primero `P0-01` a `P0-06`.
  - Despues limpiar variables/imports no usados en componentes restantes.
  - Confirmar `npm run typecheck` limpio.
- `Cierre esperado`:
  - `npm run typecheck` en verde.

## P1

### ISSUE P1-01 - Completar flujo compra -> alta/actualizacion de packaging inventory

- `Tipo`: bug operativo
- `Bloquea`: stock confiable de materiales de empaque
- `Archivos`:
  - `src/components/PurchasesModule.tsx`
  - `supabase/migrations/20260323012420_add_fiscal_purchases_inventory_system.sql`
- `Problema concreto`:
  - Las compras no siempre crean el item de inventario si no existia previamente.
- `Tareas`:
  - Soportar alta automatica o seleccion asistida del item.
  - Registrar `inventory_movements` cuando aplique.
  - Validar coherencia entre compra, stock y costo neto.
- `Cierre esperado`:
  - Una compra nueva deja inventario consistente incluso para items no precargados.

### ISSUE P1-02 - Definir modelo unico para ordenes y lotes de produccion

- `Tipo`: arquitectura / alineacion de dominio
- `Bloquea`: trazabilidad de produccion y costos
- `Archivos`:
  - `src/components/ProductionModule.tsx`
  - `src/components/ProductionSheetModule.tsx`
  - `supabase/migrations/20260319111316_create_ctp_erp_schema.sql`
  - `supabase/migrations/20260323012420_add_fiscal_purchases_inventory_system.sql`
- `Problema concreto`:
  - Coexisten `production_batches` y `production_orders` con responsabilidades no del todo claras.
- `Tareas`:
  - Definir entidad principal y relacion entre ambas.
  - Alinear nombres, estados y campos minimos.
  - Ajustar ambos modulos al flujo elegido.
- `Cierre esperado`:
  - El equipo puede explicar con una sola narrativa como se produce y registra un lote.

### ISSUE P1-03 - Hacer real o explicitar como simulacion el envio de email VIP

- `Tipo`: integracion / producto
- `Bloquea`: confiabilidad del CRM VIP
- `Archivos`:
  - `supabase/functions/send-vip-email/index.ts`
  - `src/components/CRMModule.tsx`
  - `src/components/VIPEmailPreview.tsx`
- `Problema concreto`:
  - La funcion responde exito aunque no haya envio real.
- `Tareas`:
  - Integrar proveedor real o cambiar UX/textos/estado para dejar claro que es preview.
  - Registrar logs y resultado verdadero del intento de envio.
- `Cierre esperado`:
  - El usuario del ERP sabe si el correo salio realmente o no.

### ISSUE P1-04 - Replantear `FinancialHealthModule` con metricas soportadas por datos reales

- `Tipo`: bug / analitica
- `Bloquea`: uso confiable del dashboard financiero
- `Archivos`:
  - `src/components/FinancialHealthModule.tsx`
  - `src/lib/supabase.ts`
  - tablas relacionadas a ventas, clientes y cuentas por cobrar
- `Problema concreto`:
  - El modulo asume campos y tipos que hoy no existen o no estan garantizados.
- `Tareas`:
  - Identificar metricas realmente calculables hoy.
  - Remover o degradar lo que no tenga soporte en schema.
  - Alinear queries, joins y tipos a la realidad del modelo.
- `Cierre esperado`:
  - El dashboard no inventa estructura de datos que el sistema no posee.

## P2

### ISSUE P2-01 - Limpiar imports, variables y helpers sin uso

- `Tipo`: refactor
- `Bloquea`: legibilidad y mantenimiento
- `Archivos`:
  - `src/components/AccountsPayableModule.tsx`
  - `src/components/AnnouncementWall.tsx`
  - `src/components/CRMModule.tsx`
  - `src/components/DailyTasksBoard.tsx`
  - `src/components/DashboardModule.tsx`
  - `src/components/FiscalCalendarModule.tsx`
  - `src/components/InvoicesPurchaseModule.tsx`
  - `src/components/PricingSimulatorModule.tsx`
  - `src/components/ShopifyIntegrationModule.tsx`
  - `src/components/UserManual.tsx`
  - `src/components/WeeklyKPIModule.tsx`
  - `src/components/WholesaleDistributionModule.tsx`
  - y otros marcados por `typecheck`
- `Problema concreto`:
  - Hay mucho ruido por imports y variables no usadas.
- `Tareas`:
  - Remover codigo muerto luego del cierre de errores estructurales.
  - Separar lo que es placeholder legitimo de lo que ya no se usa.
- `Cierre esperado`:
  - El codigo queda mas legible y el ruido del typecheck desaparece.

### ISSUE P2-02 - Agregar red minima de validaciones automatizadas

- `Tipo`: validacion
- `Bloquea`: estabilidad futura
- `Archivos sugeridos`:
  - `src/lib/taxUtils.ts`
  - `src/contexts/AuthContext.tsx`
  - utilidades o scripts para payloads Shopify y reglas de roles
- `Problema concreto`:
  - No hay una malla minima que proteja auth, reglas fiscales, inventario o integraciones.
- `Tareas`:
  - Empezar por funciones puras y validaciones de parsing.
  - Agregar checks minimos para roles y payloads Shopify.
  - Definir un comando simple de verificacion continua.
- `Cierre esperado`:
  - Existen pruebas o validaciones reproducibles sobre flujos sensibles.

### ISSUE P2-03 - Alinear documentacion tecnica con el backlog ejecutado

- `Tipo`: documentacion
- `Bloquea`: claridad de producto y onboarding tecnico
- `Archivos`:
  - `TECH_BACKLOG.md`
  - `TECH_BACKLOG_ISSUES.md`
  - `PRD.md`
  - `Vision.md`
  - `DEPLOYMENT.md`
  - `README.md`
- `Problema concreto`:
  - La documentacion puede volver a quedar atras del estado real.
- `Tareas`:
  - Actualizar docs cuando cada issue cambie el estado de un flujo.
  - Marcar funcionalidades parciales de forma explicita.
- `Cierre esperado`:
  - Documentacion y producto evolucionan sincronizados.

## Siguiente corte recomendado

Si hay que convertir esto en trabajo inmediato, el siguiente sprint deberia incluir:

1. `P0-01` Corregir contratos de tipos en auth e inventario.
2. `P0-02` Unificar nomenclatura de roles.
3. `P0-03` Consolidar cliente Supabase y exports tipados.
4. `P0-04` Corregir desalineacion de campos de producto, ventas y cliente.
5. `P0-06` Endurecer validacion del webhook de Shopify.
6. `P0-07` Cerrar `typecheck`.
