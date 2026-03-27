import { Product, ProductType, RawMaterial, RawMaterialCategory } from './supabase';

import { isLowStockMaterial } from './inventoryHelpers';

export interface RawMaterialFormValues {
  name: string;
  category: RawMaterialCategory;
  unit: string;
  stock_quantity: number;
  min_stock_alert: number;
  current_cost: number;
}

export interface ProductFormValues {
  product_id: string;
  name: string;
  product_type: ProductType;
  format: string;
  color: string;
  base_price: number;
}

export type InventoryView = 'raw' | 'finished';

export interface InventorySummary {
  totalRawMaterialValue: number;
  inventoryItemCount: number;
  lowStockCount: number;
}

export interface InventorySearchSummary {
  count: number;
  message: string;
}

export const DEFAULT_RAW_MATERIAL_FORM: RawMaterialFormValues = {
  name: '',
  category: 'chemical',
  unit: 'kg',
  stock_quantity: 0,
  min_stock_alert: 0,
  current_cost: 0,
};

export const DEFAULT_PRODUCT_FORM: ProductFormValues = {
  product_id: '',
  name: '',
  product_type: 'concentrado',
  format: '',
  color: '#94a3b8',
  base_price: 0,
};

export const mapRawMaterialToForm = (material: RawMaterial): RawMaterialFormValues => {
  return {
    name: material.name,
    category: material.category,
    unit: material.unit,
    stock_quantity: material.stock_quantity,
    min_stock_alert: material.min_stock_alert,
    current_cost: material.current_cost,
  };
};

export const mapProductToForm = (product: Product): ProductFormValues => {
  return {
    product_id: product.product_id,
    name: product.name,
    product_type: product.product_type,
    format: product.format || '',
    color: product.color || '#94a3b8',
    base_price: product.base_price,
  };
};

export const getInventorySummary = (
  rawMaterials: RawMaterial[],
  products: Product[],
  view: InventoryView,
): InventorySummary => {
  return {
    totalRawMaterialValue: rawMaterials.reduce(
      (total, material) => total + material.current_cost * material.stock_quantity,
      0,
    ),
    inventoryItemCount: view === 'raw' ? rawMaterials.length : products.length,
    lowStockCount: rawMaterials.filter(isLowStockMaterial).length,
  };
};

export const getInventorySearchSummary = (
  view: InventoryView,
  rawMaterialCount: number,
  productCount: number,
): InventorySearchSummary => {
  const count = view === 'raw' ? rawMaterialCount : productCount;

  if (view === 'raw') {
    return {
      count,
      message: `${count} ${count === 1 ? 'materia prima encontrada' : 'materias primas encontradas'}`,
    };
  }

  return {
    count,
    message: `${count} ${count === 1 ? 'producto encontrado' : 'productos encontrados'}`,
  };
};
