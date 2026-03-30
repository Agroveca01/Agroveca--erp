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
  units_per_batch?: number | null;
}
