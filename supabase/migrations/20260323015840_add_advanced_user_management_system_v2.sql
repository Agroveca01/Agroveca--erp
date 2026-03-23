/*
  # Sistema Avanzado de Gestión de Usuarios, Avisos y Tareas

  1. Nuevas Tablas
    - `system_announcements`
      - Muro de avisos con mensajería interna
      - Filtrado por rol y urgencia
    - `announcement_reads`
      - Confirmación de lectura de avisos
    - `daily_tasks`
      - Tablero de pendientes diarios por rol
      - Reset automático con persistencia de críticos
    - `task_completions`
      - Registro de quién completó cada tarea
    - `activity_logs`
      - Log de actividad de usuarios
    - `weekly_kpis`
      - Métricas de rendimiento semanal

  2. Security
    - RLS en todas las tablas
*/

-- Asegurar que user_profiles tiene todos los campos necesarios
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Muro de Avisos
CREATE TABLE IF NOT EXISTS system_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  urgency text DEFAULT 'informative',
  target_role text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true
);

ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view announcements for their role"
  ON system_announcements FOR SELECT
  TO authenticated
  USING (
    target_role IS NULL OR 
    target_role = (SELECT role FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage announcements"
  ON system_announcements FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin');

-- Confirmación de Lectura
CREATE TABLE IF NOT EXISTS announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES system_announcements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  read_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reads"
  ON announcement_reads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark announcements as read"
  ON announcement_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Tareas Diarias
CREATE TABLE IF NOT EXISTS daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name text NOT NULL,
  description text,
  assigned_role text NOT NULL,
  priority text DEFAULT 'normal',
  is_critical boolean DEFAULT false,
  is_recurring boolean DEFAULT true,
  task_date date DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks for their role"
  ON daily_tasks FOR SELECT
  TO authenticated
  USING (
    assigned_role = (SELECT role FROM user_profiles WHERE user_id = auth.uid()) OR
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can manage tasks"
  ON daily_tasks FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin');

-- Completar Tareas
CREATE TABLE IF NOT EXISTS task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES daily_tasks(id) ON DELETE CASCADE,
  completed_by uuid REFERENCES auth.users(id),
  completed_at timestamptz DEFAULT now(),
  completion_date date DEFAULT CURRENT_DATE,
  notes text
);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task completions"
  ON task_completions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can complete their role tasks"
  ON task_completions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_tasks
      WHERE id = task_id
      AND assigned_role = (SELECT role FROM user_profiles WHERE user_id = auth.uid())
    ) OR
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
  );

-- Log de Actividad
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  activity_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "System can create activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- KPIs Semanales
CREATE TABLE IF NOT EXISTS weekly_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  week_start date NOT NULL,
  week_end date NOT NULL,
  role text NOT NULL,
  tasks_assigned integer DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  completion_rate numeric DEFAULT 0,
  units_produced integer DEFAULT 0,
  units_target integer DEFAULT 0,
  collections_amount numeric DEFAULT 0,
  invoices_processed integer DEFAULT 0,
  ranking_score numeric DEFAULT 0,
  medal text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE weekly_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KPIs"
  ON weekly_kpis FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "System can create KPIs"
  ON weekly_kpis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Función para generar tareas automáticas diarias
CREATE OR REPLACE FUNCTION generate_daily_tasks()
RETURNS void AS $$
BEGIN
  INSERT INTO daily_tasks (task_name, description, assigned_role, is_recurring, task_date)
  SELECT 
    'Verificar stock de insumos críticos',
    'Revisar niveles de envases, tapas y etiquetas',
    'operario',
    true,
    CURRENT_DATE
  WHERE NOT EXISTS (
    SELECT 1 FROM daily_tasks 
    WHERE task_name = 'Verificar stock de insumos críticos' 
    AND assigned_role = 'operario'
    AND task_date = CURRENT_DATE
  );

  INSERT INTO daily_tasks (task_name, description, assigned_role, is_recurring, task_date)
  SELECT 
    'Registrar limpieza de filtros',
    'Completar checklist de mantenimiento diario',
    'operario',
    true,
    CURRENT_DATE
  WHERE NOT EXISTS (
    SELECT 1 FROM daily_tasks 
    WHERE task_name = 'Registrar limpieza de filtros'
    AND assigned_role = 'operario'
    AND task_date = CURRENT_DATE
  );

  INSERT INTO daily_tasks (task_name, description, assigned_role, is_recurring, task_date)
  SELECT 
    'Revisar facturas con +5 días de atraso',
    'Contactar distribuidores con pagos pendientes',
    'vendedor',
    true,
    CURRENT_DATE
  WHERE NOT EXISTS (
    SELECT 1 FROM daily_tasks 
    WHERE task_name = 'Revisar facturas con +5 días de atraso'
    AND assigned_role = 'vendedor'
    AND task_date = CURRENT_DATE
  );

  INSERT INTO daily_tasks (task_name, description, assigned_role, is_recurring, task_date)
  SELECT 
    'Contactar Top 5 Distribuidores',
    'Mantener relación con clientes principales',
    'vendedor',
    true,
    CURRENT_DATE
  WHERE NOT EXISTS (
    SELECT 1 FROM daily_tasks 
    WHERE task_name = 'Contactar Top 5 Distribuidores'
    AND assigned_role = 'vendedor'
    AND task_date = CURRENT_DATE
  );

  INSERT INTO daily_tasks (task_name, description, assigned_role, is_recurring, task_date)
  SELECT 
    'Revisar Cuentas por Pagar de la semana',
    'Verificar pagos pendientes a proveedores',
    'admin',
    true,
    CURRENT_DATE
  WHERE NOT EXISTS (
    SELECT 1 FROM daily_tasks 
    WHERE task_name = 'Revisar Cuentas por Pagar de la semana'
    AND assigned_role = 'admin'
    AND task_date = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql;

-- Función para resetear tareas diarias
CREATE OR REPLACE FUNCTION reset_daily_tasks()
RETURNS void AS $$
BEGIN
  DELETE FROM daily_tasks
  WHERE is_recurring = true
  AND is_critical = false
  AND task_date < CURRENT_DATE;

  UPDATE daily_tasks
  SET priority = 'urgent',
      task_date = CURRENT_DATE
  WHERE is_critical = true
  AND task_date < CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM task_completions
    WHERE task_completions.task_id = daily_tasks.id
  );

  PERFORM generate_daily_tasks();
END;
$$ LANGUAGE plpgsql;

-- Índices
CREATE INDEX IF NOT EXISTS idx_announcements_target_role ON system_announcements(target_role);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON system_announcements(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_role_date ON daily_tasks(assigned_role, task_date);
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(completed_by, completed_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_weekly_kpis_user_week ON weekly_kpis(user_id, week_start);
