import { CustomerOrderItem } from './supabase';

export type PreparedOrderStatus = 'pending' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';

export interface PreparedOrderStatusOption {
  value: PreparedOrderStatus;
  label: string;
}

export interface PreparedOrderStatusMeta extends PreparedOrderStatusOption {
  color: string;
}

export const PREPARED_ORDER_STATUS_META: Record<PreparedOrderStatus, PreparedOrderStatusMeta> = {
  pending: { value: 'pending', label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  preparing: { value: 'preparing', label: 'Preparando', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ready: { value: 'ready', label: 'Listo', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  shipped: { value: 'shipped', label: 'Enviado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  delivered: { value: 'delivered', label: 'Entregado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  cancelled: { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const PREPARED_ORDER_STATUS_TRANSITIONS: Record<PreparedOrderStatus, PreparedOrderStatus[]> = {
  pending: ['pending', 'preparing', 'cancelled'],
  preparing: ['preparing', 'ready', 'cancelled'],
  ready: ['ready', 'shipped', 'cancelled'],
  shipped: ['shipped', 'delivered'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
};

export interface FilterablePreparedOrder {
  id: string;
  order_number: string;
  status: PreparedOrderStatus | string;
  reward_eligible: boolean;
  reward_included: boolean;
  customer?: {
    name: string;
    email: string;
  };
}

export const getPreparedOrderStatusOptions = (): PreparedOrderStatusOption[] => {
  return Object.values(PREPARED_ORDER_STATUS_META).map(({ value, label }) => ({ value, label }));
};

export const isPreparedOrderStatus = (value: string): value is PreparedOrderStatus => {
  return value in PREPARED_ORDER_STATUS_META;
};

export const getPreparedOrderStatusMeta = (status: string): PreparedOrderStatusMeta => {
  if (!isPreparedOrderStatus(status)) {
    return PREPARED_ORDER_STATUS_META.pending;
  }

  return PREPARED_ORDER_STATUS_META[status];
};

export const getAllowedPreparedOrderStatuses = (status: string): PreparedOrderStatusOption[] => {
  if (!isPreparedOrderStatus(status)) {
    return getPreparedOrderStatusOptions();
  }

  return PREPARED_ORDER_STATUS_TRANSITIONS[status].map((value) => ({
    value,
    label: PREPARED_ORDER_STATUS_META[value].label,
  }));
};

export const canTransitionPreparedOrderStatus = (currentStatus: string, nextStatus: string): boolean => {
  if (!isPreparedOrderStatus(currentStatus) || !isPreparedOrderStatus(nextStatus)) {
    return false;
  }

  return PREPARED_ORDER_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
};

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
