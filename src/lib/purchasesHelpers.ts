import { PackagingInventory, Purchase } from './supabase';

export const normalizeInventoryFormat = (format: string | null | undefined) => {
  return format?.trim() || null;
};

export const findPackagingInventoryMatch = (
  inventory: PackagingInventory[],
  itemType: string,
  itemName: string,
  format: string | null | undefined,
): PackagingInventory | undefined => {
  const normalizedFormat = normalizeInventoryFormat(format);

  return inventory.find(
    (item) =>
      item.item_type === itemType &&
      item.item_name === itemName &&
      normalizeInventoryFormat(item.format) === normalizedFormat,
  );
};

export interface PurchaseMonthSummary {
  monthlyPurchases: Purchase[];
  totalVatCredit: number;
  totalSpent: number;
}

export const getPurchaseMonthSummary = (
  purchases: Purchase[],
  referenceDate = new Date(),
): PurchaseMonthSummary => {
  const referenceMonth = referenceDate.getMonth();
  const referenceYear = referenceDate.getFullYear();

  const monthlyPurchases = purchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.purchase_date);
    return purchaseDate.getMonth() === referenceMonth && purchaseDate.getFullYear() === referenceYear;
  });

  return {
    monthlyPurchases,
    totalVatCredit: monthlyPurchases.reduce((sum, purchase) => sum + purchase.vat_credit, 0),
    totalSpent: monthlyPurchases.reduce((sum, purchase) => sum + purchase.total_gross, 0),
  };
};
