import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { supabase, BusinessConfig } from '../lib/supabase';

export default function ConfigModule() {
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    currency: 'CLP',
    shopify_commission_pct: 5.0,
    meta_ads_budget: 500000,
    target_monthly_sales: 300,
    shipping_cost: 750,
    default_margin_target: 0.70,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data);
        setFormData({
          company_name: data.company_name,
          currency: data.currency,
          shopify_commission_pct: data.shopify_commission_pct,
          meta_ads_budget: data.meta_ads_budget,
          target_monthly_sales: data.target_monthly_sales,
          shipping_cost: data.shipping_cost,
          default_margin_target: data.default_margin_target,
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_config')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (error) throw error;

      alert('Configuración actualizada exitosamente');
      loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#10b981]"></div>
        <p className="text-slate-600 mt-4">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuración</h2>
          <p className="text-slate-600 mt-1">Gestión de parámetros del negocio</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Parámetros del Negocio</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Moneda
              </label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-md font-semibold text-slate-900 mb-4">Comisiones y Costos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Comisión Shopify (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.shopify_commission_pct}
                  onChange={(e) => setFormData({ ...formData, shopify_commission_pct: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Comisión actual: {formData.shopify_commission_pct}%
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Costo de Envío por Orden
                </label>
                <input
                  type="number"
                  value={formData.shipping_cost}
                  onChange={(e) => setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Costo actual: {formatCurrency(formData.shipping_cost)}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-md font-semibold text-slate-900 mb-4">Marketing y Objetivos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Presupuesto Mensual Meta Ads
                </label>
                <input
                  type="number"
                  value={formData.meta_ads_budget}
                  onChange={(e) => setFormData({ ...formData, meta_ads_budget: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Presupuesto: {formatCurrency(formData.meta_ads_budget)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta de Ventas Mensuales (unidades)
                </label>
                <input
                  type="number"
                  value={formData.target_monthly_sales}
                  onChange={(e) => setFormData({ ...formData, target_monthly_sales: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Meta: {formData.target_monthly_sales} unidades/mes
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-md font-semibold text-slate-900 mb-4">Rentabilidad</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Margen Objetivo (decimal)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.default_margin_target}
                  onChange={(e) => setFormData({ ...formData, default_margin_target: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Margen objetivo: {(formData.default_margin_target * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Guardar Configuración</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-emerald-900 mb-2">Resumen de Configuración Actual</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-emerald-700 font-medium">Comisiones</p>
            <p className="text-emerald-900">Shopify: {formData.shopify_commission_pct}%</p>
            <p className="text-emerald-900">Envío: {formatCurrency(formData.shipping_cost)}</p>
          </div>
          <div>
            <p className="text-emerald-700 font-medium">Marketing</p>
            <p className="text-emerald-900">Meta Ads: {formatCurrency(formData.meta_ads_budget)}/mes</p>
          </div>
          <div>
            <p className="text-emerald-700 font-medium">Objetivos</p>
            <p className="text-emerald-900">Ventas: {formData.target_monthly_sales} unidades/mes</p>
            <p className="text-emerald-900">Margen: {(formData.default_margin_target * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
