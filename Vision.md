# Vision de Producto - CTP ERP

## 1. Contexto

CTP ERP es el sistema interno de gestion de Cuida Tu Planta para operar el negocio de punta a punta desde una sola aplicacion. El codigo actual muestra un producto orientado a coordinar inventario, produccion, ventas, relacion con clientes, compras, obligaciones fiscales e integracion con Shopify sobre una base comun en Supabase.

Hoy el sistema ya concentra una parte importante de la operacion, pero todavia conviven modulos maduros con implementaciones parciales y algunas inconsistencias entre frontend, tipos y esquema de base de datos. Por eso la vision no debe asumir un ERP terminado, sino una plataforma operativa en consolidacion.

## 2. Problema que resuelve

Cuida Tu Planta necesita controlar una operacion donde se cruzan procesos productivos, stock de insumos y envases, ventas directas y mayoristas, seguimiento comercial, cuentas por pagar/cobrar y cumplimiento tributario. Sin un sistema unificado, esa operacion se fragmenta en planillas, mensajes y decisiones manuales, con impacto en:

- quiebres de stock y errores de abastecimiento;
- menor trazabilidad entre produccion, inventario y venta;
- retrasos en cobranza, pagos y obligaciones fiscales;
- baja visibilidad del estado real del negocio;
- dificultad para coordinar equipos con distintos roles.

## 3. Vision

Convertir CTP ERP en el sistema operativo de Cuida Tu Planta: una plataforma simple para el equipo, trazable para la administracion y suficientemente robusta para sostener crecimiento comercial, disciplina financiera y ejecucion diaria sin depender de procesos manuales dispersos.

## 4. Propuesta de valor

- Unificar en una sola herramienta los procesos clave del negocio.
- Dar visibilidad diaria del estado operativo, comercial y financiero.
- Reducir decisiones intuitivas con datos de inventario, costos, ventas y fiscalidad.
- Alinear trabajo por rol: administracion, operacion y ventas.
- Conectar operacion interna con canales externos como Shopify.

## 5. Usuarios objetivo

### Administrador

Necesita control integral del negocio: compras, pagos, proveedores, costos, fiscalidad, usuarios, KPIs y configuracion general.

### Operario

Necesita ejecutar produccion, revisar stock critico, validar insumos y registrar movimientos o estados operativos sin complejidad innecesaria.

### Vendedor

Necesita cotizar, vender, dar seguimiento a clientes, operar CRM/VIP, preparar pedidos y monitorear cuentas por cobrar.

## 6. Capacidades de producto que la vision prioriza

1. Planificar y ejecutar produccion con trazabilidad entre receta, lote, insumos y producto final.
2. Mantener inventario confiable de materias primas, envases y productos terminados.
3. Registrar ventas y pedidos con contexto comercial y operacional.
4. Gestionar clientes, lealtad y acciones VIP desde el ERP.
5. Controlar compras, facturas, proveedores y pagos pendientes.
6. Dar visibilidad financiera y fiscal para decisiones semanales y mensuales.
7. Integrar el canal Shopify para sincronizar stock y capturar demanda.
8. Coordinar equipos por rol mediante tableros, avisos, tareas y KPIs.

## 7. Principios de producto

- Operacion antes que sofisticacion: primero resolver tareas reales del dia a dia.
- Un solo dato, varios usos: el mismo registro debe servir para operacion, control y analitica.
- Visibilidad por rol: cada usuario ve lo necesario para actuar rapido.
- Trazabilidad de punta a punta: compra -> inventario -> produccion -> venta -> cobranza/pago.
- Crecimiento modular: nuevas capacidades deben apoyarse en el modelo operativo existente, no duplicarlo.

## 8. Estado actual observado

### Capacidades ya visibles en el producto

- autenticacion multiusuario con perfiles y roles;
- menu por rol para `admin`, `operario` y `vendedor`;
- modulos de inventario, produccion, ventas, CRM, Shopify, compras, proveedores, cuentas por pagar y fiscalidad;
- herramientas operativas complementarias como QR, avisos, tareas y KPIs;
- base Supabase con tablas, triggers, RLS y edge functions que soportan gran parte del dominio;
- baseline de validaciones automatizadas sobre helpers fiscales, recovery auth, permisos y payloads Shopify;
- endurecimiento incremental de compras, inventario, produccion, ventas, preparacion/despacho y salud financiera mediante helpers probados;
- accion minima de cobranzas en `accounts_receivable` desde el dashboard financiero;
- visibilidad helper-driven de cola operativa de despacho y backlog de produccion.

### Capacidades parcialmente implementadas o con deuda

- email VIP modelado como simulacion explicita, pero sin proveedor real de correo;
- crecimiento de cobertura automatizada aun parcial si se abren nuevos flujos complejos en inventario o produccion;
- coexistencia de mas de un modelo para produccion/lotes, aunque el flujo base ya esta mucho mas alineado que en baseline;
- documentacion operativa que debe seguir alineandose cuando cambian los flujos.

### Riesgos del estado actual

- necesidad de sostener una unica fuente de verdad para el cliente y los tipos compartidos de Supabase;
- riesgo de que la documentacion vuelva a quedar atras del estado ejecutado del backlog;
- diferencia entre lo que la UI promete y lo que ciertas funciones realmente ejecutan.

## 9. North Star y metricas estrategicas

### North Star

Operar el negocio completo de Cuida Tu Planta desde CTP ERP con datos confiables para decidir, producir, vender y cumplir.

### Metricas sugeridas

- porcentaje de procesos operativos ejecutados dentro del ERP;
- exactitud de stock de materias primas y envases;
- tiempo desde pedido hasta preparacion/despacho;
- dias promedio de cuentas por cobrar y por pagar;
- porcentaje de obligaciones fiscales preparadas a tiempo;
- porcentaje de ventas trazables a cliente, canal y margen estimado;
- adopcion por rol: admins, operarios y vendedores activos semanalmente.

## 10. Horizonte recomendado

### MVP estabilizado

Consolidar el ERP actual como herramienta operativa confiable, corrigiendo desalineaciones de tipos, roles y flujos base para inventario, produccion, ventas, compras y fiscalidad. Tras los ultimos sprints de endurecimiento, este objetivo esta muy avanzado; el gap principal pendiente sigue siendo cerrar VIP real o mantenerlo explicitamente fuera de alcance del MVP estabilizado.

### Proximo horizonte

Profundizar automatizacion comercial y operacional: mejor integracion con Shopify, mayor trazabilidad de pedidos y una experiencia VIP realmente conectada con canales externos. Las cobranzas y la trazabilidad base ya tienen una primera capa operativa incorporada, por lo que el siguiente salto pasa a ser mas funcional que correctivo.

### Horizonte posterior

Convertir la capa de datos del ERP en una base de decisiones para crecimiento, rentabilidad por linea/canal y planificacion mas predictiva.

## 11. Decision de enfoque para la documentacion

La documentacion de producto debe describir CTP ERP como un ERP operativo en expansion, no como un sistema completamente consolidado. Todo documento posterior debe distinguir con claridad:

- lo implementado hoy;
- lo implementado de forma parcial;
- lo aspiracional o pendiente.
