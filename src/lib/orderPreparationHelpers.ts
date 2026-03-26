import { CustomerOrderItem } from './supabase';

export interface FilterablePreparedOrder {
  id: string;
  order_number: string;
  status: string;
  reward_eligible: boolean;
  reward_included: boolean;
  customer?: {
    name: string;
    email: string;
  };
}

export const sanitizeOrderItems = (items: CustomerOrderItem[] | null | undefined) => {
  return (items || []).map((item) => ({
    name: item.name || 'Producto sin nombre',
    quantity: item.quantity || 0,
    sku: item.sku,
  }));
};

export const filterPreparedOrders = <T extends FilterablePreparedOrder>(
  orders: T[],
  searchTerm: string,
  statusFilter: string,
): T[] => {
  let filtered = orders;

  if (statusFilter !== 'all') {
    filtered = filtered.filter((order) => order.status === statusFilter);
  }

  if (searchTerm) {
    const normalizedSearch = searchTerm.toLowerCase();
    filtered = filtered.filter((order) => {
      return (
        order.order_number.toLowerCase().includes(normalizedSearch) ||
        order.customer?.name?.toLowerCase().includes(normalizedSearch) ||
        order.customer?.email?.toLowerCase().includes(normalizedSearch)
      );
    });
  }

  const vipOrders = filtered.filter((order) => order.reward_eligible && !order.reward_included);
  const regularOrders = filtered.filter((order) => !order.reward_eligible || order.reward_included);

  return [...vipOrders, ...regularOrders];
};
