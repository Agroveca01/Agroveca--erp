import { BusinessConfig } from './supabase';

export interface BusinessConfigFormValues {
  company_name: string;
  currency: string;
  shopify_commission_pct: number;
  meta_ads_budget: number;
  target_monthly_sales: number;
  shipping_cost: number;
  default_margin_target: number;
}

export interface ConfigSummary {
  shopifyCommissionLabel: string;
  shippingCostLabel: string;
  metaAdsBudgetLabel: string;
  targetMonthlySalesLabel: string;
  marginLabel: string;
}

export const DEFAULT_BUSINESS_CONFIG_FORM: BusinessConfigFormValues = {
  company_name: '',
  currency: 'CLP',
  shopify_commission_pct: 5,
  meta_ads_budget: 500000,
  target_monthly_sales: 300,
  shipping_cost: 750,
  default_margin_target: 0.7,
};

export const mapBusinessConfigToForm = (config: BusinessConfig): BusinessConfigFormValues => {
  return {
    company_name: config.company_name,
    currency: config.currency,
    shopify_commission_pct: config.shopify_commission_pct,
    meta_ads_budget: config.meta_ads_budget,
    target_monthly_sales: config.target_monthly_sales,
    shipping_cost: config.shipping_cost,
    default_margin_target: config.default_margin_target,
  };
};

export const getConfigSummary = (
  formData: BusinessConfigFormValues,
  formatCurrency: (amount: number) => string,
): ConfigSummary => {
  return {
    shopifyCommissionLabel: `Shopify: ${formData.shopify_commission_pct}%`,
    shippingCostLabel: `Envío: ${formatCurrency(formData.shipping_cost)}`,
    metaAdsBudgetLabel: `Meta Ads: ${formatCurrency(formData.meta_ads_budget)}/mes`,
    targetMonthlySalesLabel: `Ventas: ${formData.target_monthly_sales} unidades/mes`,
    marginLabel: `Margen: ${(formData.default_margin_target * 100).toFixed(0)}%`,
  };
};
