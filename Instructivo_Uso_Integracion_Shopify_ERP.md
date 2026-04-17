# Instructivo de Uso: Integración Shopify - ERP Agroveca

## 1. ¿Para qué sirve esta integración?

La integración entre Shopify y el ERP permite conectar la operación de la tienda online con la gestión interna del negocio.

Su propósito principal es:
- mantener mejor control del inventario
- recibir pedidos de Shopify dentro del ERP
- facilitar la revisión del estado de la integración
- ayudar a detectar errores o pendientes operativos

En esta integración, el **ERP es el sistema maestro del stock**. Eso significa que el inventario se administra desde el ERP y luego se refleja en Shopify.

---

## 2. ¿Qué hace hoy la integración?

Actualmente la integración permite:

### A. Sincronizar stock desde el ERP hacia Shopify
- El usuario puede enviar el stock actualizado del ERP a Shopify.
- Antes de sincronizar, el sistema muestra una previsualización de los productos afectados.
- En esa previsualización se puede ver:
  - producto ERP
  - variante Shopify asociada
  - cantidad ERP
  - stock actual en Shopify
  - diferencia entre ambos

### B. Recibir pedidos desde Shopify hacia el ERP
- Cuando entra una venta en Shopify, el ERP puede registrar ese pedido.
- El sistema puede reflejar el pedido dentro del ERP, asociarlo al cliente y actualizar inventario según el flujo definido.

### C. Mostrar el estado de la integración
- El panel de Shopify en el ERP permite revisar:
  - si la integración está activa
  - el estado del webhook
  - eventos recientes del webhook
  - pedidos con observaciones
  - productos Shopify sin mapear

---

## 3. Conceptos importantes para usar bien la integración

### 1. El ERP manda sobre el stock
Si existe una diferencia entre el stock del ERP y el stock de Shopify, el sistema considera correcto el valor del ERP.

### 2. Cada producto debe estar correctamente vinculado
Para que un producto se sincronice bien, debe tener correctamente asociado su identificador de Shopify dentro del ERP.

### 3. Los productos no mapeados no deben ignorarse
Si hay productos o variantes Shopify sin vincular, esos casos deben revisarse, porque pueden afectar el control correcto de inventario o pedidos.

### 4. El estado del webhook es clave
El webhook es el mecanismo que permite que Shopify informe pedidos al ERP. Si el webhook no está bien configurado, los pedidos pueden no entrar correctamente.

---

## 4. Cómo entrar a la integración

1. Ingresar al ERP con un usuario con permisos de administración.
2. Ir al módulo o sección de **Integración Shopify**.
3. Desde ahí se puede:
   - revisar la configuración
   - sincronizar stock
   - ver estado del webhook
   - revisar productos sin mapear
   - revisar eventos y observaciones

---

## 5. Cómo revisar si la integración está operativa

Al entrar al módulo de Shopify, revisar primero:

### A. Integración activa
Debe mostrarse como activa.

### B. Tienda y location
Verificar que la tienda configurada y la location Shopify correspondan a la operación real.

### C. Estado del Webhook
Debe indicar que el webhook `orders/create` está correctamente configurado.

Si no está correcto:
- usar el botón **Registrar webhook** o **Reparar webhook**

### D. Eventos recientes del Webhook
Aquí se puede revisar si Shopify está enviando eventos correctamente y si fueron procesados.

### E. Pedidos Shopify con observaciones
Si aparece información en esta sección, significa que hubo pedidos recibidos que requieren revisión.

---

## 6. Cómo vincular productos Shopify con productos del ERP

La integración necesita que cada producto/variante Shopify esté correctamente asociado a un producto del ERP.

### Para revisar esto:
1. Entrar al panel de Shopify.
2. Ir a la sección de salud de integración / productos sin mapear.
3. Revisar si existen productos o variantes pendientes.
4. Si el sistema sugiere una coincidencia, usar el botón **Vincular**.
5. Si no existe sugerencia, completar la vinculación manualmente desde el módulo correspondiente de inventario/productos.

### Recomendación
No ejecutar sincronización masiva si todavía hay productos importantes sin mapear correctamente.

---

## 7. Cómo sincronizar stock con Shopify

### Paso a paso
1. Entrar al módulo de **Integración Shopify**.
2. Hacer clic en **Sincronizar Todo**.
3. Revisar la previsualización que muestra:
   - productos que serán afectados
   - cantidad ERP
   - cantidad actual en Shopify
   - diferencia a aplicar
   - productos omitidos si tienen datos incompletos
4. Si todo está correcto, hacer clic en **Confirmar sincronización**.
5. Revisar el resumen final de resultados.

### Cuándo usar esta opción
- después de ajustes de inventario
- después de producción o ingreso de stock
- cuando se detecten diferencias entre ERP y Shopify
- como validación operativa antes de campañas o períodos de alta venta

---

## 8. Cómo revisar pedidos que llegan desde Shopify

Cuando se realiza una venta en Shopify:

1. Revisar la sección **Eventos recientes del Webhook**.
2. Confirmar que el evento aparezca como procesado.
3. Revisar pedidos Shopify dentro del ERP.
4. Si existe algún problema, revisar **Pedidos Shopify con observaciones**.

### Qué debería ocurrir normalmente
- el pedido llega al ERP
- el stock se ajusta según la venta
- queda trazabilidad del evento recibido

---

## 9. Qué hacer si algo no funciona

### Caso 1. El webhook no está correcto
- revisar el bloque **Estado del Webhook**
- usar **Registrar webhook** o **Reparar webhook**

### Caso 2. Shopify vendió pero no ves el pedido correctamente
- revisar **Eventos recientes del Webhook**
- revisar **Pedidos Shopify con observaciones**

### Caso 3. El producto no se sincroniza
- verificar que esté vinculado a Shopify
- revisar si tiene `shopify_variant_id`
- revisar si aparece como omitido en la previsualización

### Caso 4. El stock entre ERP y Shopify no coincide
- revisar la previsualización de sincronización
- confirmar qué cantidad tiene ERP y cuál tiene Shopify
- ejecutar sincronización si el ERP tiene el valor correcto

### Caso 5. Hay errores en pedidos o inventario
- revisar mensajes del panel
- revisar eventos recientes
- revisar pedidos con observaciones

---

## 10. Buenas prácticas de uso

- Mantener actualizados los mapeos entre ERP y Shopify.
- Revisar con frecuencia el panel de salud de integración.
- Antes de sincronizar todo, revisar siempre la previsualización.
- Confirmar que la integración esté activa antes de operaciones relevantes.
- Revisar pedidos con observaciones antes de asumir que todo quedó procesado correctamente.
- Usar la integración como apoyo operativo, no como reemplazo de revisión cuando haya cambios importantes de catálogo o stock.

---

## 11. Recomendación operativa para el equipo

Rutina sugerida de uso:

### Diario
- revisar pedidos Shopify recibidos
- revisar eventos recientes del webhook
- revisar si hay observaciones pendientes

### Después de cambios de stock importantes
- ejecutar previsualización de sincronización
- confirmar sincronización si corresponde

### Periódicamente
- revisar productos sin mapear
- validar que el webhook siga correcto
- revisar si hubo errores recientes en la integración

---

## 12. Resumen simple para usuarios

En pocas palabras:

- el ERP controla el stock
- Shopify informa ventas al ERP
- el usuario puede revisar el estado de la integración desde un panel
- antes de sincronizar stock, el sistema muestra una previsualización
- si hay problemas, el mismo panel ayuda a detectarlos más rápido

Este instructivo busca facilitar el uso diario de la integración y reducir errores operativos.
