import { BusinessConfig, CustomerOrderItem, Product, SalesOrder } from './supabase';

export type SalesChannel = 'shopify' | 'direct' | 'wholesale' | 'other';

export interface SalesDashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCommissions: number;
  monthlyOrders: SalesOrder[];
  monthlyRevenue: number;
}

export interface SalesSimulationInput {
  avgOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
  vipDiscountRate: number;
}

export interface SalesSimulationSummary {
  newRevenue: number;
  returningRevenue: number;
  vipDiscountImpact: number;
  netReturningRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  avgDiscount: number;
}

export interface SalesOrderCreationInput {
  product: Product;
  businessConfig: BusinessConfig;
  quantity: number;
  channel: SalesChannel;
  notes: string;
  orderNumber: string;
  orderDate: string;
}

export interface SalesOrderCreationPayloads {
  customerOrder: {
    order_number: string;
    order_date: string;
    total_amount: number;
    items: CustomerOrderItem[];
    status: 'pending';
  };
  salesOrder: Omit<SalesOrder, 'id'>;
}

export const isSalesChannel = (value: string): value is SalesChannel => {
  return ['shopify', 'direct', 'wholesale', 'other'].includes(value);
};

export const getChannelColor = (channel: string) => {
  const colors: Record<string, string> = {
    shopify: 'bg-green-100 text-green-700',
    direct: 'bg-blue-100 text-blue-700',
    wholesale: 'bg-purple-100 text-purple-700',
    other: 'bg-slate-100 text-slate-700',
  };
  return colors[channel] || 'bg-slate-100 text-slate-700';
};

export const getSalesDashboardSummary = (
  orders: SalesOrder[],
  referenceDate = new Date(),
): SalesDashboardSummary => {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCommissions = orders.reduce((sum, order) => sum + order.commission, 0);
  const referenceMonth = referenceDate.getMonth();
  const referenceYear = referenceDate.getFullYear();
  const monthlyOrders = orders.filter((order) => {
    const orderDate = new Date(order.order_date);
    return orderDate.getMonth() === referenceMonth && orderDate.getFullYear() === referenceYear;
  });
  const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total_amount, 0);

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    totalCommissions,
    monthlyOrders,
    monthlyRevenue,
  };
};

export const calculateSalesSimulation = (
  simulatorData: SalesSimulationInput,
): SalesSimulationSummary => {
  const newRevenue = simulatorData.avgOrderValue * simulatorData.newCustomers;
  const returningRevenue = simulatorData.avgOrderValue * simulatorData.returningCustomers;
  const vipDiscountImpact = returningRevenue * simulatorData.vipDiscountRate * 0.2;
  const netReturningRevenue = returningRevenue - vipDiscountImpact;
  const totalRevenue = newRevenue + netReturningRevenue;
  const totalOrders = simulatorData.newCustomers + simulatorData.returningCustomers;
  const avgDiscount = totalRevenue > 0 ? (vipDiscountImpact / totalRevenue) * 100 : 0;

  return {
    newRevenue,
    returningRevenue,
    vipDiscountImpact,
    netReturningRevenue,
    totalRevenue,
    totalOrders,
    avgDiscount,
  };
};

export const buildSalesOrderCreationPayloads = (
  input: SalesOrderCreationInput,
): SalesOrderCreationPayloads => {
  const unitPrice = input.product.base_price;
  const subtotal = unitPrice * input.quantity;
  const commission = input.channel === 'shopify'
    ? (subtotal * input.businessConfig.shopify_commission_pct / 100)
    : 0;
  const shippingCost = input.businessConfig.shipping_cost;
  const totalAmount = subtotal + shippingCost;

  return {
    customerOrder: {
      order_number: input.orderNumber,
      order_date: input.orderDate,
      total_amount: totalAmount,
      items: [
        {
          product_id: input.product.id,
          name: input.product.name,
          quantity: input.quantity,
          unit_price: unitPrice,
          sku: input.product.product_id,
        },
      ],
      status: 'pending',
    },
    salesOrder: {
      order_number: input.orderNumber,
      product_id: input.product.id,
      quantity: input.quantity,
      unit_price: unitPrice,
      subtotal,
      commission,
      shipping_cost: shippingCost,
      total_amount: totalAmount,
      channel: input.channel,
      order_date: input.orderDate,
      status: 'completed',
      notes: input.notes,
    },
  };
};
