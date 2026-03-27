import { PackagingInventory } from './supabase';
import { findPackagingInventoryMatch, normalizeInventoryFormat } from './purchasesHelpers';
import { calculateGrossFromNet } from './taxUtils';

export interface InvoiceLineItem {
  item_type: string;
  item_name: string;
  format: string;
  quantity: number;
  unit_price_net: number;
  line_total_net: number;
  packaging_inventory_id: string | null;
}

export type InvoiceLineItemValue = InvoiceLineItem[keyof InvoiceLineItem];

export interface InvoiceTotals {
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
}

export interface ResolvedInvoiceInventoryPlan {
  normalizedFormat: string;
  packagingInventoryId: string | null;
  shouldInsertInventory: boolean;
  inventoryInsertPayload: {
    item_type: string;
    item_name: string;
    format: string;
    current_stock: number;
    unit_cost_net: number;
  } | null;
  inventoryUpdatePayload: {
    id: string;
    current_stock: number;
    unit_cost_net: number;
  } | null;
  movementPayload: {
    movement_type: 'entrada';
    quantity: number;
    reference_type: 'purchase_invoice';
    notes: string;
  };
}

export const EMPTY_LINE_ITEM: InvoiceLineItem = {
  item_type: 'envase',
  item_name: '',
  format: '',
  quantity: 0,
  unit_price_net: 0,
  line_total_net: 0,
  packaging_inventory_id: null,
};

export const updateInvoiceLineItem = (
  lineItems: InvoiceLineItem[],
  index: number,
  field: keyof InvoiceLineItem,
  value: InvoiceLineItemValue,
  inventory: PackagingInventory[],
): InvoiceLineItem[] => {
  const newLineItems = [...lineItems];
  newLineItems[index] = { ...newLineItems[index], [field]: value };

  if (field === 'quantity' || field === 'unit_price_net') {
    newLineItems[index].line_total_net = newLineItems[index].quantity * newLineItems[index].unit_price_net;
  }

  if (field === 'item_type' || field === 'item_name' || field === 'format') {
    const matchingInventory = findPackagingInventoryMatch(
      inventory,
      newLineItems[index].item_type,
      newLineItems[index].item_name,
      newLineItems[index].format,
    );
    newLineItems[index].packaging_inventory_id = matchingInventory?.id || null;
  }

  return newLineItems;
};

export const calculateInvoiceTotals = (lineItems: InvoiceLineItem[]): InvoiceTotals => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total_net, 0);
  const grossBreakdown = calculateGrossFromNet(subtotal);

  return {
    subtotal,
    vatAmount: grossBreakdown.vat,
    totalAmount: grossBreakdown.gross,
  };
};

export const hasInvoiceItemsToSubmit = (lineItems: InvoiceLineItem[]): boolean => {
  return lineItems.some((item) => item.quantity > 0);
};

export const getCreditDueDate = (invoiceDate: string, creditDays: number): string => {
  return new Date(new Date(invoiceDate).getTime() + creditDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
};

export const normalizeInvoiceItemsForInsert = (invoiceId: string, lineItems: InvoiceLineItem[]) => {
  return lineItems
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      invoice_id: invoiceId,
      item_type: item.item_type,
      item_name: item.item_name,
      format: normalizeInventoryFormat(item.format),
      quantity: item.quantity,
      unit_price_net: item.unit_price_net,
      line_total_net: item.line_total_net,
      packaging_inventory_id: item.packaging_inventory_id,
    }));
};

export const buildInvoiceInventoryResolutionPlan = (
  item: InvoiceLineItem,
  invoiceNumber: string,
  inventory: PackagingInventory[],
): ResolvedInvoiceInventoryPlan => {
  const normalizedFormat = normalizeInventoryFormat(item.format) || '';
  const existingItem = item.packaging_inventory_id
    ? inventory.find((inventoryItem) => inventoryItem.id === item.packaging_inventory_id)
    : findPackagingInventoryMatch(inventory, item.item_type, item.item_name, normalizedFormat);

  return {
    normalizedFormat,
    packagingInventoryId: existingItem?.id || item.packaging_inventory_id,
    shouldInsertInventory: !existingItem,
    inventoryInsertPayload: existingItem
      ? null
      : {
          item_type: item.item_type,
          item_name: item.item_name,
          format: normalizedFormat,
          current_stock: item.quantity,
          unit_cost_net: item.unit_price_net,
        },
    inventoryUpdatePayload: existingItem
      ? {
          id: existingItem.id,
          current_stock: existingItem.current_stock + item.quantity,
          unit_cost_net: item.unit_price_net,
        }
      : null,
    movementPayload: {
      movement_type: 'entrada',
      quantity: item.quantity,
      reference_type: 'purchase_invoice',
      notes: `Factura ${invoiceNumber}`,
    },
  };
};
