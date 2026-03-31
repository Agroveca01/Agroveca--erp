# Validación y Configuración de Integración Shopify–ERP

## 1. Checklist de Validación Funcional (Para Negocio y Técnicos)

### A. Estado General de la Integración
- [ ] Existe registro/configuración de la tienda Shopify en el ERP (dominio, versión API, webhook y parámetros operativos). La autenticación se obtiene desde secrets server-side.
- [ ] El usuario administrador visualiza una sección dedicada a Shopify en el ERP.
- [ ] Se muestra el estado de la integración (activa/desactivada/con errores).
- [ ] Hay visibilidad de logs/métricas de integración recientes (sincronización y pedidos).

### B. Sincronización de Stock
- [ ] Es posible iniciar una sincronización manual de inventario de productos desde el ERP.
- [ ] El mapeo (vinculación) entre productos del ERP y Shopify es MANUAL: cada producto debe tener el ID de producto y variante de Shopify correctamente registrado en el ERP antes de sincronizar.
- [ ] Sólo los productos correctamente mapeados entre ERP y Shopify se sincronizan.
- [ ] Si hay productos no vinculados (sin mapeo), NO se sincronizarán; el usuario debe completar esta vinculación previamente.
- [ ] El sistema alerta si hay productos desmapeados o inconsistencias de inventario.
- [ ] Los cambios exitosos y errores se registran con fecha/hora y detalles legibles.
- [ ] El proceso está protegido con roles/permisos apropiados.

### C. Recepción y Manejo de Pedidos Shopify
- [ ] El endpoint/webhook para recepción de pedidos Shopify está configurado y accesible.
- [ ] Nuevos pedidos en Shopify son recibidos y reflejados en el ERP automáticamente (flujo de prueba real).
- [ ] Clientes nuevos se mapean o crean según reglas acordadas.
- [ ] Comisiones y puntos de lealtad se calculan correctamente al recibir el pedido.
- [ ] El flujo contempla y registra errores de mapping/fallas de integración con trazabilidad.

### D. Interfaz y Experiencia de Usuario
- [ ] El ERP provee instrucciones simples y visibles para conectar Shopify (dominio, webhook, pasos, links relevantes y nota de credenciales server-side).
- [ ] Hay avisos/claves visuales si falta información crítica (secrets/configuración, URLs, productos sin linkear, etc).
- [ ] Existe ayuda contextual o acceso a soporte/documentación.
- [ ] Logs/errores tienen mensajes legibles para usuarios no técnicos, sugiriendo pasos de solución.

### E. Seguridad y Control
- [ ] Sólo usuarios administradores pueden administrar la integración.
- [ ] Los secrets y credenciales nunca se muestran en texto plano ni se capturan desde la UI.
- [ ] Hay registro de auditoría básico: quién inicia sync/config cambios, cuándo.
- [ ] Hay gestión de renovaciones de token o vencimientos mediante obtención programática server-side.
- [ ] La validación HMAC de webhooks usa el client secret server-side del app, no un secreto manual distinto cargado en UI.


## 2. Requisitos y Necesidades para la Integración (Previo a Implementación)

### A. Accesos y Credenciales Necesarios
- Acceso de administrador a tienda Shopify.
- Client ID y Client Secret del app de Shopify con scopes mínimos requeridos (inventario, pedidos, productos, etc).
- Webhook URL generado desde el ERP (debe configurarse en Shopify para órdenes nuevas).
- Acceso de administrador en ERP para registrar la tienda y configurar integración.

### B. Datos y Parámetros Requeridos
- Relación clara de productos entre ERP y Shopify (IDs locales vs. IDs Shopify).
    - IMPORTANTE: Actualmente, este mapeo es 100% manual, se realiza desde el módulo de Productos en el ERP agregando los IDs de producto y variante de Shopify por cada producto requerido.
- Email de contacto/responsable operativo para alertas o incidencias.
- Definición de reglas de mapping de clientes (nombre, email, id externo, etc).
- Aclarar si el flujo requiere sincronización unidireccional o bidireccional (hoy sólo uni: ERP→Shopify).
- Validar timezone y formatos de fecha/hora usados en ambos sistemas.


## 3. Recomendaciones y Acciones de Mejora

- Incluir "prueba de conexión" (health check) para validar conectividad, secrets server-side y acceso a Shopify desde la UI.
- Mostrar dashboard de salud de integración (último sync, errores recientes, pedidos sin procesar).
- Mejorar claridad de logs/errores en la interfaz para usuarios de negocio.
- Documentar mejor el proceso para mapear productos y configurar webhooks (instrucciones paso a paso).
- Automatizar validación de scopes y estado de autenticación server-side, alertando proactivamente si hay problema.
- Actualmente, NO existe sincronización automática de catálogo/productos; esta tarea (crear, actualizar o mapear productos de Shopify en el ERP) debe realizarse manualmente.
- Planificar la extensión para sincronizar catálogo completo (productos/estados), devoluciones y actualizaciones de pedidos.
- Definir sección de "contacto soporte" y FAQ en la interfaz.


## 4. Hoja de Ruta para Futuras Mejoras

1. Validar integración actual con checklist y ajustar donde falten requisitos fundamentales.
2. Implementar dashboard de salud y panel de alertas para usuarios no técnicos.
3. Automatizar mapping y validaciones de productos entre ERP y Shopify (evitar errores manuales).
4. Extender integración a:
    - Sincronización automática de catálogo y estados de productos
    - Manejo de devoluciones y cambios de estado de pedido
    - Sincronización bidireccional (ERP <→ Shopify) según necesidades de negocio
5. Optimizar experiencia de usuarios admin y soporte: mejores logs, soporte en línea, y documentación interactiva.
6. Revisión y actualización periódica de credenciales y permisos (seguridad continua).

---

_Nota importante:_
- El ERP es el maestro del inventario; la integración está diseñada para que el stock se sincronice únicamente desde ERP hacia Shopify.
- El mapeo entre productos debe hacerse manualmente antes de cualquier sincronización de stock.
- El desarrollo de sincronización automática de catálogo/productos, devoluciones y sincronización bidireccional se sugiere como hoja de ruta futura.

_Este documento sirve tanto para evaluación como para preparación de pruebas/revisión conjunta con el negocio. Se recomienda que los usuarios de ambas áreas—negocio y tecnología—lo validen en cada paso, y definan un flujo claro de responsables y contacto para dudas/incidentes._

