import { Product, RawMaterial } from './supabase';

export const isLowStockMaterial = (material: RawMaterial): boolean => {
  return material.stock_quantity <= material.min_stock_alert;
};

export const filterRawMaterials = (
  rawMaterials: RawMaterial[],
  searchTerm: string,
): RawMaterial[] => {
  if (!searchTerm) return rawMaterials;

  const searchLower = searchTerm.toLowerCase();

  return rawMaterials.filter((material) => {
    return (
      material.name.toLowerCase().includes(searchLower) ||
      material.category.toLowerCase().includes(searchLower) ||
      material.unit.toLowerCase().includes(searchLower)
    );
  });
};

export const filterProducts = (products: Product[], searchTerm: string): Product[] => {
  if (!searchTerm) return products;

  const searchLower = searchTerm.toLowerCase();

  return products.filter((product) => {
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.product_id.toLowerCase().includes(searchLower) ||
      product.product_type.toLowerCase().includes(searchLower) ||
      product.format.toLowerCase().includes(searchLower)
    );
  });
};
