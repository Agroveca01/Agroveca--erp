import { useState, useEffect } from 'react';
import { ShoppingBag, Settings, RefreshCw, CheckCircle, XCircle, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ShopifyConfig {
  id: string;
  shop_domain: string;
  access_token: string;
  api_version: string;
  webhook_secret: string;
  commission_percentage: number;
  payment_gateway_fee: number;
  is_active: boolean;
  last_sync_at: string;
  created_at: string;
}

interface SyncLog {
  id: string;
  product_id: string;
  shopify_product_id: string;
  quantity_synced: number;
  status: string;
  error_message: string;
  created_at: string;
}

interface ShopifyOrder {
  id: string;
  order_number: string;
  total_amount: number;
  commission_amount: number;
  net_amount: number;
  created_at: string;
}

export default function ShopifyIntegrationModule() {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<ShopifyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [shopifyOrders, setShopifyOrders] = useState<ShopifyOrder[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    shop_domain: '',
    access_token: '',
    api_version: '2024-01',
    webhook_secret: '',
    commission_percentage: 2.0,
    payment_gateway_fee: 2.5,
  });

  useEffect(() => {
    loadConfig();
    loadSyncLogs();
    loadShopifyOrders();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopify_config')
        .select('*')
        .maybeSingle();



      if (error) throw error;

      if (data) {
        setConfig(data);
        setConfigForm({
          shop_domain: data.shop_domain,
          access_token: data.access_token || '',
          api_version: data.api_version,
          webhook_secret: data.webhook_secret || '',
          commission_percentage: data.commission_percentage,
          payment_gateway_fee: data.payment_gateway_fee,
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncLogs = async () => {
    const { data, error } = await supabase
      .from('stock_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setSyncLogs(data);
    }
  };

  const loadShopifyOrders = async () => {
    const { data, error } = await supabase
      .from('shopify_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setShopifyOrders(data);
    }
  };

  const saveConfig = async () => {
    try {
      if (config) {
        const { error } = await supabase
          .from('shopify_config')
          .update(configForm)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shopify_config')
          .insert([configForm]);

        if (error) throw error;
      }

      alert('Configuración guardada correctamente');
      setShowConfig(false);
      loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar configuración');
    }
  };

  const toggleActive = async () => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from('shopify_config')
        .update({ is_active: !config.is_active })
        .eq('id', config.id);

      if (error) throw error;
      loadConfig();
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  const syncAllProducts = async () => {
    if (!confirm('¿Sincronizar stock de todos los productos con Shopify?')) return;

    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, stock_quantity, shopify_product_id, shopify_variant_id')
        .not('shopify_product_id', 'is', null);

      if (!products || products.length === 0) {
        alert('No hay productos vinculados a Shopify');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const product of products) {
        try {
          // const response = await fetch(
          //   `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-sync-stock`,
          //   {
          //     method: 'POST',
          //     headers: {
          //       'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          //       'Content-Type': 'application/json',
          //     },
          //     body: JSON.stringify({
          //       product_id: product.id,
          //       quantity: product.stock_quantity,
          //     }),
          //   }
          // );

          const response = await supabase.functions.invoke('shopify-sync-stock', {
            body: {
              product_id: product.id,
              quantity: product.stock_quantity,
            },
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}`,
              'Content-Type': 'application/json',
            }
          });

          if (response.data && response.data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      alert(`Sincronización completada:\n✓ Exitosos: ${successCount}\n✗ Errores: ${errorCount}`);
      loadSyncLogs();
      loadConfig();
    } catch (error) {
      console.error('Error syncing products:', error);
      alert('Error al sincronizar productos');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h3>
          <p className="text-gray-600">Solo los administradores pueden acceder a esta sección</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const totalOrders = shopifyOrders.length;
  const totalRevenue = shopifyOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalCommissions = shopifyOrders.reduce((sum, order) => sum + order.commission_amount, 0);
  const totalNet = shopifyOrders.reduce((sum, order) => sum + order.net_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Integración Shopify</h2>
            <p className="text-sm text-gray-600">Configuración y sincronización con tu tienda</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {config && (
            <button
              onClick={toggleActive}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${config.is_active
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {config.is_active ? 'Activo' : 'Inactivo'}
            </button>
          )}
          <button
            onClick={() => setShowConfig(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </button>
        </div>
      </div>

      {config && config.is_active && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Integración Activa</h3>
          </div>
          <p className="text-sm text-green-800">
            Tienda: <strong>{config.shop_domain}</strong>
          </p>
          {config.last_sync_at && (
            <p className="text-sm text-green-800">
              Última sincronización: {new Date(config.last_sync_at).toLocaleString('es-CL')}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Órdenes Shopify</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Comisiones</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalCommissions)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Utilidad Neta</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalNet)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sincronización de Stock</h3>
          <button
            onClick={syncAllProducts}
            disabled={!config || !config.is_active}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar Todo
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Instrucciones de Sincronización</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Vincula tus productos con Shopify agregando el ID de producto y variante en el módulo de Productos</li>
              <li>El ERP es el maestro de inventario: cuando produzcas, actualiza el stock aquí</li>
              <li>Haz clic en "Sincronizar Todo" para enviar el stock actualizado a Shopify</li>
              <li>Los webhooks actualizan automáticamente el CRM cuando hay ventas en Shopify</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Últimas Sincronizaciones</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {syncLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{log.shopify_product_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{log.quantity_synced}</td>
                      <td className="px-4 py-3">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Exitoso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            <XCircle className="w-3 h-3" />
                            Error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(log.created_at).toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                  {syncLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No hay registros de sincronización
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Webhooks</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>URL del Webhook:</strong>
          </p>
          <code className="block bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-mono">
            {import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-webhook
          </code>
          <p className="text-xs text-gray-600 mt-2">
            Configura este webhook en tu panel de Shopify para el evento <strong>orders/create</strong>
          </p>
        </div>
      </div>

      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Configuración de Shopify</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dominio de la Tienda
                </label>
                <input
                  type="text"
                  value={configForm.shop_domain}
                  onChange={(e) => setConfigForm({ ...configForm, shop_domain: e.target.value })}
                  placeholder="tu-tienda.myshopify.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token
                </label>
                <input
                  type="password"
                  value={configForm.access_token}
                  onChange={(e) => setConfigForm({ ...configForm, access_token: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Versión de API
                </label>
                <input
                  type="text"
                  value={configForm.api_version}
                  onChange={(e) => setConfigForm({ ...configForm, api_version: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comisión Shopify (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={configForm.commission_percentage}
                  onChange={(e) => setConfigForm({ ...configForm, commission_percentage: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comisión Pasarela de Pago (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={configForm.payment_gateway_fee}
                  onChange={(e) => setConfigForm({ ...configForm, payment_gateway_fee: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfig(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveConfig}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
