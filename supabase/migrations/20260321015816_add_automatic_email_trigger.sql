/*
  # Trigger Automático para Envío de Emails VIP

  1. Función de Trigger
    - `send_vip_email_notification`: Se ejecuta cuando se inserta un nuevo código VIP
    - Envía una notificación para que el sistema externo dispare el email
    - Registra el evento en la tabla de logs

  2. Trigger
    - `trigger_send_vip_email`: Trigger AFTER INSERT en vip_discount_codes
    - Se ejecuta automáticamente cuando un cliente alcanza su pedido #10

  3. Notas
    - Este trigger prepara los datos para el envío
    - El envío real se hace a través del Edge Function
    - En producción, esto debe conectarse con un servicio de email real
*/

-- Función que se ejecuta cuando se genera un código VIP nuevo
CREATE OR REPLACE FUNCTION send_vip_email_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_data record;
  email_log_id uuid;
BEGIN
  -- Obtener datos del cliente
  SELECT 
    id, 
    name, 
    email
  INTO customer_data
  FROM customers
  WHERE id = NEW.customer_id;

  -- Registrar en logs que se debe enviar el email
  INSERT INTO email_logs (
    customer_id,
    discount_code_id,
    email_type,
    recipient_email,
    subject,
    delivered,
    error_message
  ) VALUES (
    NEW.customer_id,
    NEW.id,
    'vip_milestone',
    customer_data.email,
    '🌿 ¡Llegaste a tu décima cosecha! Tu regalo VIP te espera',
    false,
    'Pendiente de envío automático'
  ) RETURNING id INTO email_log_id;

  -- Notificar para procesamiento asíncrono (opcional)
  PERFORM pg_notify(
    'vip_email_queue',
    json_build_object(
      'customer_id', NEW.customer_id,
      'customer_name', customer_data.name,
      'customer_email', customer_data.email,
      'discount_code', NEW.discount_code,
      'discount_code_id', NEW.id,
      'email_log_id', email_log_id
    )::text
  );

  RAISE NOTICE 'Email VIP encolado para cliente: % (%) con código: %', 
    customer_data.name, 
    customer_data.email, 
    NEW.discount_code;

  RETURN NEW;
END;
$$;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS trigger_send_vip_email ON vip_discount_codes;

CREATE TRIGGER trigger_send_vip_email
  AFTER INSERT ON vip_discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION send_vip_email_notification();

-- Comentarios para documentación
COMMENT ON FUNCTION send_vip_email_notification() IS 
'Función trigger que se ejecuta automáticamente cuando se genera un nuevo código de descuento VIP. Registra el evento y notifica al sistema de emails.';

COMMENT ON TRIGGER trigger_send_vip_email ON vip_discount_codes IS 
'Trigger que envía notificaciones de email automáticamente cuando un cliente alcanza su pedido #10 y se genera su código VIP de 20% de descuento.';
