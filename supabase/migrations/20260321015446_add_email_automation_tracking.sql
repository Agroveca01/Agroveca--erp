/*
  # Sistema de Automatización de Email para Fidelización

  1. Cambios en Tablas Existentes
    - `vip_discount_codes`: 
      - Agregar `email_sent` (boolean) - Marca si el email fue enviado
      - Agregar `email_sent_at` (timestamp) - Fecha de envío del email
      - Agregar `email_opened` (boolean) - Si el cliente abrió el email
      - Agregar `email_clicked` (boolean) - Si el cliente hizo clic en el CTA

  2. Nueva Tabla
    - `email_logs`: Registro de todos los emails enviados
      - `id` (uuid, primary key)
      - `customer_id` (uuid) - Referencia al cliente
      - `discount_code_id` (uuid) - Referencia al código de descuento
      - `email_type` (text) - Tipo de email (vip_milestone, etc)
      - `sent_at` (timestamp) - Cuándo se envió
      - `delivered` (boolean) - Si fue entregado
      - `opened` (boolean) - Si fue abierto
      - `clicked` (boolean) - Si hizo clic

  3. Security
    - Enable RLS on email_logs
    - Policies allow all authenticated users full access

  4. Funciones
    - Trigger para enviar webhook cuando se genera código VIP
*/

-- Agregar columnas de tracking de email a vip_discount_codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vip_discount_codes' AND column_name = 'email_sent'
  ) THEN
    ALTER TABLE vip_discount_codes ADD COLUMN email_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vip_discount_codes' AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE vip_discount_codes ADD COLUMN email_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vip_discount_codes' AND column_name = 'email_opened'
  ) THEN
    ALTER TABLE vip_discount_codes ADD COLUMN email_opened boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vip_discount_codes' AND column_name = 'email_clicked'
  ) THEN
    ALTER TABLE vip_discount_codes ADD COLUMN email_clicked boolean DEFAULT false;
  END IF;
END $$;

-- Crear tabla de logs de emails
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  discount_code_id uuid REFERENCES vip_discount_codes(id) ON DELETE SET NULL,
  email_type text NOT NULL DEFAULT 'vip_milestone',
  recipient_email text NOT NULL,
  subject text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  delivered boolean DEFAULT false,
  opened boolean DEFAULT false,
  clicked boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para email_logs
CREATE POLICY "All authenticated users full access to email_logs"
  ON email_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Función para marcar email como enviado
CREATE OR REPLACE FUNCTION mark_vip_email_sent(code_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE vip_discount_codes
  SET 
    email_sent = true,
    email_sent_at = now()
  WHERE id = code_id;
END;
$$;

-- Función para registrar evento de email
CREATE OR REPLACE FUNCTION log_email_event(
  p_customer_id uuid,
  p_discount_code_id uuid,
  p_email_type text,
  p_recipient_email text,
  p_subject text,
  p_delivered boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO email_logs (
    customer_id,
    discount_code_id,
    email_type,
    recipient_email,
    subject,
    delivered,
    error_message
  ) VALUES (
    p_customer_id,
    p_discount_code_id,
    p_email_type,
    p_recipient_email,
    p_subject,
    p_delivered,
    p_error_message
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id ON email_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_discount_code_id ON email_logs(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_vip_codes_email_sent ON vip_discount_codes(email_sent);
