export interface ShopifyConfigFormValues {
  shop_domain: string;
  access_token: string;
  api_version: string;
  webhook_secret: string;
  commission_percentage: number;
  payment_gateway_fee: number;
}

export interface ShopifyConfigRecord extends ShopifyConfigFormValues {
  id: string;
  is_active: boolean;
  last_sync_at: string;
  created_at: string;
}

export interface ShopifyOrderSummaryInput {
  total_amount: number;
  commission_amount: number;
  net_amount: number;
}

export interface ShopifyOrderSummary {
  totalOrders: number;
  totalRevenue: number;
  totalCommissions: number;
  totalNet: number;
}

export const DEFAULT_SHOPIFY_CONFIG_FORM: ShopifyConfigFormValues = {
  shop_domain: '',
  access_token: '',
  api_version: '2024-01',
  webhook_secret: '',
  commission_percentage: 2,
  payment_gateway_fee: 2.5,
};

export const mapShopifyConfigToForm = (config: ShopifyConfigRecord): ShopifyConfigFormValues => {
  return {
    shop_domain: config.shop_domain,
    access_token: config.access_token || '',
    api_version: config.api_version,
    webhook_secret: config.webhook_secret || '',
    commission_percentage: config.commission_percentage,
    payment_gateway_fee: config.payment_gateway_fee,
  };
};

export const getShopifyOrdersSummary = (orders: ShopifyOrderSummaryInput[]): ShopifyOrderSummary => {
  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
    totalCommissions: orders.reduce((sum, order) => sum + order.commission_amount, 0),
    totalNet: orders.reduce((sum, order) => sum + order.net_amount, 0),
  };
};
