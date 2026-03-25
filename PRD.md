# PRD - CTP ERP

## 1. Resumen ejecutivo

CTP ERP es una aplicacion interna para centralizar la operacion de Cuida Tu Planta en torno a inventario, produccion, ventas, clientes, compras, cumplimiento fiscal y coordinacion del equipo. El repositorio muestra un producto funcionalmente ambicioso y con buena cobertura de dominio, pero aun en etapa de consolidacion tecnica.

Este PRD documenta el estado observado en codigo, distingue entre capacidades reales y parciales, y propone un camino de estabilizacion y evolucion para los proximos dos trimestres.

## 2. Objetivo del producto

Permitir que Cuida Tu Planta opere su negocio diario desde un solo sistema, con informacion suficiente para producir, vender, comprar, cobrar, pagar y cumplir obligaciones tributarias con menor dependencia de planillas o coordinacion manual.

## 3. Objetivos de negocio

- Reducir errores operativos en inventario, compras y produccion.
- Mejorar trazabilidad entre insumos, lotes, pedidos y resultados comerciales.
- Dar visibilidad diaria del estado financiero, fiscal y comercial.
- Ordenar la ejecucion por rol dentro del equipo.
- Preparar una base operativa compatible con crecimiento en Shopify y canal mayorista.

## 4. No objetivos actuales

- No asumir contabilidad completa ni cierre contable formal dentro del ERP.
- No asumir una automatizacion omnicanal totalmente madura.
- No asumir que todas las integraciones externas estan listas para uso productivo sin ajustes.
- No asumir que el modelo actual compila sin deuda tecnica o sin brechas de seguridad/consistencia.

## 5. Usuarios y roles

### `admin`

Administra la operacion completa: finanzas, fiscalidad, proveedores, compras, pagos, stock, usuarios, configuracion, CRM, Shopify y supervision general.

### `operario`

Opera inventario, stock critico y hoja de produccion para ejecutar mezcla, validacion de insumos y tareas operativas diarias.

### `vendedor`

Gestiona ventas, clientes, CRM, pedidos, cotizaciones, simulaciones y seguimiento comercial/cobranza.

## 6. Alcance funcional actual

### 6.1 Plataforma y acceso

Capacidades observadas:

- autenticacion con Supabase Auth;
- sesiones persistentes;
- perfiles por rol;
- menu lateral con modulos visibles segun rol;
- manual por rol y acciones rapidas como QR y cierre de sesion.

Fuentes principales:

- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/components/AuthModule.tsx`
- `src/components/UserManual.tsx`

### 6.2 Dashboard y coordinacion operativa

Capacidades observadas:

- dashboard principal por rol;
- KPIs semanales;
- muro de avisos;
- tablero de tareas diarias;
- activity logs y estructura de ranking/medallas.

Fuentes principales:

- `src/components/DashboardModule.tsx`
- `src/components/WeeklyKPIModule.tsx`
- `src/components/AnnouncementWall.tsx`
- `src/components/DailyTasksBoard.tsx`
- `supabase/migrations/20260323015840_add_advanced_user_management_system_v2.sql`

### 6.3 Inventario

Capacidades observadas:

- gestion de materias primas;
- gestion de productos;
- control de stock de materias primas;
- control de stock critico;
- inventario de envases y materiales de empaque;
- trazabilidad parcial de movimientos;
- acceso por QR a materias primas.

Fuentes principales:

- `src/components/InventoryModule.tsx`
- `src/components/StockMonitorModule.tsx`
- `src/components/QRScannerModule.tsx`
- `supabase/migrations/20260319111316_create_ctp_erp_schema.sql`
- `supabase/migrations/20260320124645_add_qr_codes_to_raw_materials.sql`
- `supabase/migrations/20260323012420_add_fiscal_purchases_inventory_system.sql`

### 6.4 Produccion

Capacidades observadas:

- gestion de recetas por producto;
- registro de lotes de produccion;
- calculo de costos por lote;
- hoja de produccion para validacion de insumos y ordenes RTU;
- control de desperdicio y observaciones;
- soporte para recalculo de costos mediante RPC.

Fuentes principales:

- `src/components/ProductionModule.tsx`
- `src/components/ProductionSheetModule.tsx`
- `src/components/CostingModule.tsx`
- `supabase/migrations/20260319111316_create_ctp_erp_schema.sql`
- `supabase/migrations/20260322185103_add_cost_recalculation_functions.sql`
- `supabase/migrations/20260323012420_add_fiscal_purchases_inventory_system.sql`

### 6.5 Ventas, pedidos y distribucion

Capacidades observadas:

- registro de ordenes de venta;
- flujo de preparacion de pedidos;
- simulador comercial;
- cotizacion mayorista con descuento y MOQ;
- base para cuentas por cobrar.

Fuentes principales:

- `src/components/SalesModule.tsx`
- `src/components/OrderPreparationModule.tsx`
- `src/components/PricingSimulatorModule.tsx`
- `src/components/WholesaleDistributionModule.tsx`
- `supabase/migrations/20260323014424_add_suppliers_invoices_accounts_system.sql`

### 6.6 CRM y fidelizacion

Capacidades observadas:

- gestion de clientes;
- programa de loyalty tiers;
- codigos de descuento VIP;
- preview de email VIP;
- piezas imprimibles para experiencia VIP;
- vinculacion conceptual con pedidos y recompensas.

Fuentes principales:

- `src/components/CRMModule.tsx`
- `src/components/VIPEmailPreview.tsx`
- `src/components/VIPOrderLabel.tsx`
- `src/components/ThankYouCard.tsx`
- `supabase/migrations/20260319113954_add_customer_loyalty_crm.sql`
- `supabase/migrations/20260321014859_add_loyalty_tiers_and_vip_rewards.sql`
- `supabase/migrations/20260321015446_add_email_automation_tracking.sql`
- `supabase/functions/send-vip-email/index.ts`

### 6.7 Compras, proveedores y pagos

Capacidades observadas:

- registro simple de compras con IVA credito;
- maestro de proveedores;
- facturas de compra con multiples items;
- cuentas por pagar;
- registro de pagos a proveedores;
- estructura de cuentas por cobrar e historial de pagos de clientes.

Fuentes principales:

- `src/components/PurchasesModule.tsx`
- `src/components/SuppliersModule.tsx`
- `src/components/InvoicesPurchaseModule.tsx`
- `src/components/AccountsPayableModule.tsx`
- `supabase/migrations/20260323012420_add_fiscal_purchases_inventory_system.sql`
- `supabase/migrations/20260323014424_add_suppliers_invoices_accounts_system.sql`

### 6.8 Fiscalidad y salud financiera

Capacidades observadas:

- configuracion fiscal;
- calendario F29;
- estimacion de IVA credito/debito y PPM;
- dashboard de salud financiera/liquidez;
- apoyo a decisiones de reserva fiscal.

Fuentes principales:

- `src/components/FiscalCalendarModule.tsx`
- `src/components/FinancialHealthModule.tsx`
- `src/lib/taxUtils.ts`
- `supabase/migrations/20260323012420_add_fiscal_purchases_inventory_system.sql`

### 6.9 Integracion Shopify

Capacidades observadas:

- configuracion Shopify;
- sincronizacion de stock;
- registro de ordenes Shopify;
- mapeo de clientes Shopify a clientes del ERP;
- calculo de comisiones;
- logs e indicadores de integracion.

Fuentes principales:

- `src/components/ShopifyIntegrationModule.tsx`
- `supabase/migrations/20260320151212_add_shopify_integration.sql`
- `supabase/functions/shopify-sync-stock/index.ts`
- `supabase/functions/shopify-webhook/index.ts`

## 7. Requerimientos funcionales

### RF-01 Acceso y permisos

El sistema debe autenticar usuarios y mostrar modulos segun rol operativo.

### RF-02 Inventario base

El sistema debe permitir crear, editar, consultar y monitorear materias primas, productos y materiales de empaque.

### RF-03 Alertas de stock

El sistema debe resaltar faltantes o proximidad a stock minimo para soportar compra y produccion.

### RF-04 Produccion y lotes

El sistema debe permitir registrar produccion y relacionarla con receta, cantidades y costos.

### RF-05 Hoja operativa de produccion

El sistema debe guiar al operario en la validacion de insumos y ejecucion de ordenes de produccion.

### RF-06 Ventas y pedidos

El sistema debe registrar pedidos/ventas y apoyar su preparacion para despacho.

### RF-07 CRM y fidelizacion

El sistema debe centralizar clientes, puntos/tiers VIP y acciones comerciales asociadas.

### RF-08 Compras y proveedores

El sistema debe registrar compras, facturas e impactos asociados en proveedores, pagos e inventario.

### RF-09 Cuentas por cobrar/pagar

El sistema debe entregar visibilidad sobre montos pendientes, vencimientos y pagos registrados.

### RF-10 Fiscalidad operativa

El sistema debe apoyar la preparacion y seguimiento de obligaciones fiscales periodicas.

### RF-11 Integracion Shopify

El sistema debe sincronizar informacion relevante con Shopify y capturar ordenes del canal ecommerce.

### RF-12 Coordinacion interna

El sistema debe facilitar avisos, tareas y seguimiento de desempeno por rol.

## 8. Requerimientos no funcionales

- interfaz web responsive para desktop y mobile;
- autenticacion y control de acceso basados en Supabase;
- persistencia centralizada en PostgreSQL/Supabase;
- trazabilidad basica de eventos de negocio;
- consistencia de tipos entre frontend y backend como requisito de estabilizacion;
- validaciones de seguridad y firma para integraciones externas antes de endurecer uso productivo.

## 9. Flujos end-to-end clave

### Flujo 1: compra de insumos y actualizacion de inventario

1. Admin registra compra o factura.
2. Sistema calcula neto/IVA cuando aplica.
3. Inventario de empaque o insumo se actualiza total o parcialmente.
4. La informacion queda disponible para stock critico y produccion.

### Flujo 2: planificacion y ejecucion de produccion

1. Operario o admin revisa hoja/orden de produccion.
2. Sistema valida insumos disponibles.
3. Se registra lote, cantidades y costos.
4. El stock disponible soporta venta o despacho posterior.

### Flujo 3: venta y preparacion de pedido

1. Vendedor registra orden o venta.
2. Cliente queda asociado cuando existe contexto CRM.
3. Pedido pasa a preparacion.
4. Se gestionan piezas operativas como etiqueta o tarjeta VIP cuando corresponde.

### Flujo 4: fiscalidad mensual

1. Admin revisa compras, ventas y parametros fiscales.
2. Sistema estima IVA, PPM y recordatorios F29.
3. Admin usa el calendario para preparar obligaciones y reservas.

### Flujo 5: venta Shopify y unificacion de cliente

1. Shopify emite webhook de orden.
2. Edge function intenta mapear o crear cliente.
3. ERP registra orden Shopify, neto y comision.
4. CRM puede aprovechar esa base para loyalty y seguimiento.

## 10. Modelo de datos de alto nivel

Entidades principales observadas:

- configuracion del negocio;
- usuarios y perfiles;
- materias primas;
- materiales de empaque e inventario de packaging;
- productos y recetas;
- lotes y ordenes de produccion;
- movimientos de inventario;
- ventas, clientes y ordenes;
- loyalty tiers, codigos VIP y tracking de email;
- proveedores, facturas de compra, cuentas por pagar y pagos;
- cuentas por cobrar e historial de pagos de clientes;
- calendario/configuracion fiscal;
- configuracion e historial Shopify;
- avisos, tareas, activity logs y KPIs.

## 11. Estado real vs estado esperado

### Implementado y utilizable

- estructura multirol en UI;
- amplio set de modulos ERP visibles;
- esquema Supabase con cobertura fuerte del dominio;
- soporte de operaciones clave del negocio en interfaz.

### Parcial o no consolidado

- varios modulos muestran intencion funcional mayor a su robustez tecnica actual;
- ciertos flujos dependen de supuestos no siempre garantizados por schema/tipos;
- algunas integraciones y automatizaciones no completan el ciclo real de negocio.

### Ejemplos concretos de gaps

- `src/components/InventoryModule.tsx` depende de `isOperator` no expuesto por `src/contexts/AuthContext.tsx`.
- `src/lib/pdfGenerator.ts` usa `product_name` cuando el tipo de producto define `name`.
- `src/components/FinancialHealthModule.tsx` referencia tipos/campos no presentes en `src/lib/supabase.ts`.
- `supabase/functions/send-vip-email/index.ts` responde exito pero no integra un proveedor real de correo.
- `supabase/functions/shopify-webhook/index.ts` lee HMAC pero no valida la firma.
- Historicamente existio duplicidad de cliente Supabase frente a `src/lib/supabase.ts`; ese punto ya fue resuelto y debe mantenerse asi.
- `src/components/PurchasesModule.tsx` no cubre alta de nuevos items de `packaging_inventory` cuando no existen.

## 12. Riesgos

### Riesgos tecnicos

- desalineacion entre frontend, tipos TS y schema SQL;
- deuda de compilacion confirmada por `npm run typecheck`;
- duplicidad de fuentes de verdad en ciertos modelos;
- integraciones externas sin endurecimiento suficiente.

### Riesgos operativos

- que usuarios confien en automatizaciones que hoy son solo parciales;
- que stock, salud financiera o reportes usen datos no completamente alineados;
- que diferencias de rol afecten permisos o visibilidad real.

### Riesgos de seguridad

- webhook Shopify sin validacion efectiva de firma;
- uso discutible de headers/llaves en llamadas desde frontend a funciones edge;
- posible exposicion accidental de comportamiento no endurecido en ambientes productivos.

## 13. Supuestos

- Cuida Tu Planta prioriza operacion diaria por sobre reporting avanzado.
- El ERP seguira usando Supabase como backend principal.
- Shopify seguira siendo un canal relevante de ventas.
- Los roles `admin`, `operario` y `vendedor` seguiran siendo el modelo principal de uso.

## 14. Roadmap recomendado

### MVP estabilizado

- corregir inconsistencias de tipos y nombres de roles;
- unificar cliente y tipos Supabase;
- cerrar flujos base de inventario, compras, produccion y ventas;
- asegurar que dashboards usen entidades/campos reales;
- documentar claramente limites funcionales actuales.

### Trimestre 1

- endurecer integracion Shopify y seguridad de webhooks;
- completar envio real de emails VIP y trazabilidad asociada;
- consolidar cuentas por cobrar/pagar con mejor estado operativo;
- reforzar trazabilidad entre orden, produccion y despacho.

### Trimestre 2

- mejorar analitica comercial y financiera por canal/producto;
- profundizar automatizaciones por rol;
- reducir pasos manuales en compras, abastecimiento y preparacion de pedidos;
- usar KPIs y activity logs como base de gestion continua.

## 15. Criterios de exito del siguiente ciclo

- el ERP compila sin errores de tipado criticos;
- los flujos de inventario, produccion, compras, ventas y fiscalidad reflejan entidades reales del schema;
- la documentacion de producto coincide con el estado del codigo;
- Shopify y VIP dejan de ser capacidades principalmente conceptuales y pasan a flujos confiables;
- cada rol puede operar sus tareas principales sin ambiguedades de permisos o datos.
