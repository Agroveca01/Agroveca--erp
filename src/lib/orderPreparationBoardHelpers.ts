import { FilterablePreparedOrder } from './orderPreparationHelpers';

export interface PreparationBoardOrder extends FilterablePreparedOrder {
  is_vip_milestone: boolean;
}

export interface OrderPreparationSummary<T extends PreparationBoardOrder> {
  pendingOrders: T[];
  vipPendingOrders: T[];
  vipMilestoneOrders: T[];
  readyOrdersCount: number;
  shippedOrDeliveredCount: number;
}

export const getOrderPreparationSummary = <T extends PreparationBoardOrder>(
  orders: T[],
): OrderPreparationSummary<T> => {
  const pendingOrders = orders.filter((order) => order.status === 'pending' || order.status === 'preparing');
  const vipPendingOrders = pendingOrders.filter((order) => order.reward_eligible && !order.reward_included);
  const vipMilestoneOrders = pendingOrders.filter((order) => order.is_vip_milestone && order.status === 'pending');

  return {
    pendingOrders,
    vipPendingOrders,
    vipMilestoneOrders,
    readyOrdersCount: orders.filter((order) => order.status === 'ready').length,
    shippedOrDeliveredCount: orders.filter((order) => order.status === 'shipped' || order.status === 'delivered').length,
  };
};

export const hasVipRewardPending = (order: Pick<PreparationBoardOrder, 'reward_eligible' | 'reward_included'>) => {
  return order.reward_eligible && !order.reward_included;
};
