import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RawMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_cost: number;
  stock_quantity: number;
  min_stock_alert: number;
  qr_code?: string;
  location?: string;
}

export interface PackagingMaterial {
  id: string;
  name: string;
  cost: number;
  stock_quantity: number;
  min_stock_alert: number;
}

export interface Product {
  id: string;
  name: string;
  product_id: string;
  format: string;
  product_type: string;
  color: string | null;
  aroma: string | null;
  ph_target: number | null;
  production_unit_liters: number;
  base_price: number;
}

export interface ProductRecipe {
  id: string;
  product_id: string;
  raw_material_id: string;
  quantity_per_100l: number;
  raw_materials?: RawMaterial;
}

export interface ProductionBatch {
  id: string;
  product_id: string;
  batch_number: string;
  batch_date: string;
  quantity_liters: number;
  units_produced: number;
  raw_material_cost: number;
  packaging_cost: number;
  total_cost: number;
  cost_per_unit: number;
  notes: string | null;
  products?: Product;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  commission: number;
  shipping_cost: number;
  total_amount: number;
  channel: string;
  order_date: string;
  status: string;
  notes: string | null;
  products?: Product;
}

export interface BusinessConfig {
  id: string;
  company_name: string;
  currency: string;
  shopify_commission_pct: number;
  meta_ads_budget: number;
  target_monthly_sales: number;
  shipping_cost: number;
  default_margin_target: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role?: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FixedCostsConfig {
  id: string;
  container_cost: number;
  packaging_cost: number;
  label_cost: number;
  shipping_cost: number;
  updated_at: string;
  updated_by: string | null;
}

export interface FormatCost {
  id: string;
  format_name: string;
  container_cost: number;
  label_cost: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingConfig {
  id: string;
  min_units: number;
  shipping_cost: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface FiscalConfig {
  id: string;
  ppm_percentage: number;
  estimated_vat_credit_monthly: number;
  payment_day_reminder: number;
  closure_day_reminder: number;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  purchase_date: string;
  supplier_name: string;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price_gross: number;
  total_gross: number;
  total_net: number;
  vat_credit: number;
  invoice_number: string | null;
  notes: string | null;
  inventory_updated: boolean;
  created_at: string;
}

export interface PackagingInventory {
  id: string;
  item_type: string;
  item_name: string;
  format: string | null;
  current_stock: number;
  min_stock_alert: number;
  optimal_stock: number;
  unit_cost_net: number;
  location: string | null;
  last_updated: string;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  packaging_inventory_id: string;
  movement_type: string;
  quantity: number;
  reference_id: string | null;
  reference_type: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProductionOrder {
  id: string;
  order_number: string;
  product_id: string | null;
  target_units: number;
  concentrate_required_liters: number;
  water_required_liters: number;
  status: string;
  validation_passed: boolean;
  validation_errors: any;
  started_at: string | null;
  completed_at: string | null;
  waste_units: number;
  waste_liters: number;
  notes: string | null;
  created_at: string;
  products?: Product;
}

export interface FiscalCalendar {
  id: string;
  reminder_date: string;
  reminder_type: string;
  title: string;
  description: string | null;
  amount_estimated: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  rut: string;
  business_name: string;
  trade_name: string | null;
  business_activity: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  payment_terms_days: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseInvoice {
  id: string;
  supplier_id: string;
  invoice_number: string;
  invoice_date: string;
  payment_condition: string;
  credit_days: number;
  due_date: string | null;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: Supplier;
}

export interface PurchaseInvoiceItem {
  id: string;
  invoice_id: string;
  item_type: string;
  item_name: string;
  format: string | null;
  quantity: number;
  unit_price_net: number;
  line_total_net: number;
  packaging_inventory_id: string | null;
  created_at: string;
}

export interface AccountsPayable {
  id: string;
  invoice_id: string;
  supplier_id: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  status: string;
  aging_category: string | null;
  created_at: string;
  updated_at: string;
  purchase_invoices?: PurchaseInvoice;
  suppliers?: Supplier;
}

export interface AccountsReceivable {
  id: string;
  sales_order_id: string | null;
  customer_id: string | null;
  customer_name: string;
  invoice_number: string | null;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  status: string;
  days_overdue: number;
  payment_score: string;
  created_at: string;
  updated_at: string;
  customers?: Customer;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  urgency: string;
  target_role: string | null;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface AnnouncementRead {
  id: string;
  announcement_id: string;
  user_id: string;
  read_at: string;
}

export interface DailyTask {
  id: string;
  task_name: string;
  description: string | null;
  assigned_role: string;
  priority: string;
  is_critical: boolean;
  is_recurring: boolean;
  task_date: string;
  created_by: string | null;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  completed_by: string;
  completed_at: string;
  completion_date: string;
  notes: string | null;
  user_profiles?: UserProfile;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  created_at: string;
  user_profiles?: UserProfile;
}

export interface WeeklyKPI {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  role: string;
  tasks_assigned: number;
  tasks_completed: number;
  completion_rate: number;
  units_produced: number;
  units_target: number;
  collections_amount: number;
  invoices_processed: number;
  ranking_score: number;
  medal: string | null;
  created_at: string;
  user_profiles?: UserProfile;
}
