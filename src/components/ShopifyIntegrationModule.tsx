import { useState, useEffect } from 'react';
import { ShoppingBag, Settings, RefreshCw, CheckCircle, XCircle, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  DEFAULT_SHOPIFY_CONFIG_FORM,
  getShopifyOrdersSummary,
  mapShopifyConfigToForm,
  SHOPIFY_API_VERSION_OPTIONS,
} from '../lib/shopifyIntegrationHelpers';
import { getShopifyStockSyncPayloads } from '../lib/shopifySync';
import { useAuth } from '../contexts/useAuth';
import { ShopifyDiscoveryResponse } from '../types/shopify';

interface ShopifyConfig {
  id: string;
  shop_domain: string;
  shopify_location_id?: string | null;
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

interface ShopifyLocation {
  id: string;
  legacy_id: string;
  name: string;
  active: boolean;
}

interface ShopifyWebhookSubscription {
  id: string;
  topic: string;
  address: string;
  api_version: string;
}

export default function ShopifyIntegrationModule() {

  const [shopifyDiscovery, setShopifyDiscovery] = useState<ShopifyDiscoveryResponse | null>(null);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [linkingVariantId, setLinkingVariantId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { session } = useAuth();


  useEffect(() => {
    loadShopifyDiscovery().catch((err) => {
      setDiscoveryError(err?.message || 'Error desconocido');
      setDiscoveryLoading(false);
    });
  }, [session]);

  const loadShopifyDiscovery = async () => {
    if (!session) {
      setShopifyDiscovery(null);
      setDiscoveryError('Debes iniciar sesión para consultar salud de integración Shopify');
      setDiscoveryLoading(false);
      return;
    }

    setDiscoveryLoading(true);
    setDiscoveryError(null);

    try {
      const { data, error } = await supabase.functions.invoke('shopify-discovery', {
        method: 'GET',
      });

      if (error) {
        if (
          error.status === 401 ||
          /jwt/i.test(error.message) ||
          /No autorizado/i.test(error.message) ||
          /JWT inválido|expired|unauthorized|401/i.test(error.message)
        ) {
          throw new Error('Debes iniciar sesión para consultar salud de integración Shopify');
        }

        throw new Error('Error al consultar descubrimiento Shopify: ' + error.message);
      }

      setShopifyDiscovery(data as ShopifyDiscoveryResponse);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const linkSuggestedProduct = async (item: ShopifyDiscoveryResponse['unmapped'][number]) => {
    if (!item.suggestedMatch) {
      return;
    }

    setLinkingVariantId(item.variant.id);

    try {
      const { data: existingLink, error: existingLinkError } = await supabase
        .from('products')
        .select('id, name, product_id')
        .eq('shopify_variant_id', item.variant.id)
        .maybeSingle();

      if (existingLinkError) {
        throw existingLinkError;
      }

      if (existingLink && existingLink.id !== item.suggestedMatch.id) {
        throw new Error(`La variante Shopify ya está vinculada al producto ERP ${existingLink.name} (${existingLink.product_id}).`);
      }

      const { error } = await supabase
        .from('products')
        .update({
          shopify_product_id: item.shopifyProduct.id,
          shopify_variant_id: item.variant.id,
        })
        .eq('id', item.suggestedMatch.id);

      if (error) {
        throw error;
      }

      await loadShopifyDiscovery();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      alert(`No se pudo vincular la variante Shopify: ${message}`);
    } finally {
      setLinkingVariantId(null);
    }
  };

  const copyToClipboard = async (value: string, fieldKey: string) => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Tu navegador no soporta copiado automático.');
      }

      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      window.setTimeout(() => {
        setCopiedField((current) => (current === fieldKey ? null : current));
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      alert(`No se pudo copiar el ID: ${message}`);
    }
  };

  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<ShopifyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [shopifyOrders, setShopifyOrders] = useState<ShopifyOrder[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState(DEFAULT_SHOPIFY_CONFIG_FORM);
  const [locations, setLocations] = useState<ShopifyLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<ShopifyWebhookSubscription[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);
  const [webhooksError, setWebhooksError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
    loadSyncLogs();
    loadShopifyOrders();
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    setWebhooksLoading(true);
    setWebhooksError(null);

    supabase.functions.invoke('shopify-webhooks', {
      method: 'GET',
    }).then(({ data, error }) => {
      if (error) {
        throw new Error(error.message);
      }

      setWebhooks((data?.webhooks || []) as ShopifyWebhookSubscription[]);
    }).catch((error) => {
      setWebhooksError(error instanceof Error ? error.message : 'Error desconocido');
      setWebhooks([]);
    }).finally(() => {
      setWebhooksLoading(false);
    });
  }, [session]);

  useEffect(() => {
    if (!showConfig || !session) {
      return;
    }

    setLocationsLoading(true);
    setLocationsError(null);

    supabase.functions.invoke('shopify-locations', {
      method: 'GET',
    }).then(({ data, error }) => {
      if (error) {
        throw new Error(error.message);
      }

      setLocations((data?.locations || []) as ShopifyLocation[]);
    }).catch((error) => {
      setLocationsError(error instanceof Error ? error.message : 'Error desconocido');
      setLocations([]);
    }).finally(() => {
      setLocationsLoading(false);
    });
  }, [showConfig, session]);

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
        setConfigForm(mapShopifyConfigToForm(data));
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
        .select('id, shopify_product_id, shopify_variant_id, finished_inventory(quantity)')
        .not('shopify_product_id', 'is', null);

      if (!products || products.length === 0) {
        alert('No hay productos vinculados a Shopify');
        return;
      }

      const syncPayloads = getShopifyStockSyncPayloads(products);

      if (syncPayloads.length === 0) {
        alert('No hay productos con datos completos para sincronizar con Shopify');
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const skippedCount = products.length - syncPayloads.length;

      for (const payload of syncPayloads) {
        try {
          const response = await supabase.functions.invoke('shopify-sync-stock', {
            body: payload
          });

          if (response.data && response.data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      alert(`Sincronización completada:\n✓ Exitosos: ${successCount}\n✗ Errores: ${errorCount}\n- Omitidos: ${skippedCount}`);
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

  const { totalOrders, totalRevenue, totalCommissions, totalNet } = getShopifyOrdersSummary(shopifyOrders);
  const expectedWebhookAddress = `${window.location.origin.replace(/\/$/, '')}/functions/v1/shopify-webhook`;
  const ordersCreateWebhook = webhooks.find((webhook) => webhook.topic === 'orders/create');
  const hasOrdersCreateWebhook = Boolean(ordersCreateWebhook);
  const ordersCreateWebhookMatchesAddress = ordersCreateWebhook?.address === expectedWebhookAddress;

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
          <p className="text-sm text-green-800">
            Location Shopify: <strong>{config.shopify_location_id || 'No configurada'}</strong>
          </p>
          <p className="text-sm text-green-800">
            Autenticación de Shopify: <strong>gestionada por secrets del servidor</strong>
          </p>
          {config.last_sync_at && (
            <p className="text-sm text-green-800">
              Última sincronización: {new Date(config.last_sync_at).toLocaleString('es-CL')}
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Estado del Webhook</h3>
          {webhooksLoading && <span className="text-sm text-gray-500">Cargando...</span>}
        </div>

        {webhooksError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            No se pudo verificar los webhooks de Shopify: {webhooksError}
          </div>
        ) : hasOrdersCreateWebhook ? (
          <div className={`rounded-lg border p-4 ${ordersCreateWebhookMatchesAddress ? 'border-green-200 bg-green-50 text-green-800' : 'border-yellow-200 bg-yellow-50 text-yellow-900'}`}>
            <p className="font-medium">
              {ordersCreateWebhookMatchesAddress
                ? 'Webhook orders/create configurado correctamente'
                : 'Webhook orders/create detectado, pero apunta a otra URL'}
            </p>
            <p className="mt-2 text-sm">Actual: <span className="font-mono break-all">{ordersCreateWebhook?.address}</span></p>
            <p className="mt-1 text-sm">Esperado: <span className="font-mono break-all">{expectedWebhookAddress}</span></p>
          </div>
        ) : (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
            <p className="font-medium">No se encontró suscripción orders/create en Shopify.</p>
            <p className="mt-2 text-sm">Debes crear un webhook que apunte a:</p>
            <p className="mt-1 text-sm font-mono break-all">{expectedWebhookAddress}</p>
          </div>
        )}
      </div>

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

       {/* --- SALUD SHOPIFY: Productos/variantes no mapeados --- */}
       <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-6">
         <div className="flex items-center gap-2 mb-2">
           <AlertCircle className="w-5 h-5 text-yellow-500" />
           <h3 className="font-semibold text-yellow-900 text-lg">Salud Integración Shopify: Productos/variantes sin mapear</h3>
         </div>
         {discoveryLoading ? (
           <div className="text-yellow-600 py-8">Cargando productos desde Shopify...</div>
         ) : discoveryError ? (
           <div className="text-red-600 py-8">Error: {discoveryError}</div>
         ) : shopifyDiscovery && shopifyDiscovery.unmapped ? (
           <>
             <div className="mb-4 text-yellow-900">
               Encontrados <b>{shopifyDiscovery.unmapped.length}</b> productos/variantes de Shopify sin vincular.<br />
               {shopifyDiscovery.unmapped.length === 0 && (
                 <span className="text-green-800">¡Todo mapeado correctamente!</span>
               )}
             </div>
             <div className="overflow-x-auto">
               <table className="w-full border border-gray-300 rounded-lg text-sm" style={{borderCollapse:'collapse'}}>
                 <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-gray-800 font-bold">Producto Shopify</th>
                      <th className="border border-gray-300 px-4 py-2 text-gray-800 font-bold">Shopify Product ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-gray-800 font-bold">Variante</th>
                      <th className="border border-gray-300 px-4 py-2 text-gray-800 font-bold">Shopify Variant ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-gray-800 font-bold">SKU</th>
                      <th className="border border-gray-300 px-4 py-2 text-gray-800 font-bold">Sugerencia del ERP</th>
                      <th className="border border-gray-300 px-4 py-2 text-gray-800 font-bold">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopifyDiscovery.unmapped.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">No hay productos sin mapear actualmente.</td>
                      </tr>
                    )}
                    {shopifyDiscovery.unmapped.map((item: import('../types/shopify').UnmappedShopifyProduct, idx: number) => (
                      <tr key={item.variant.id + '-' + idx} className={idx%2===0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-gray-200 px-4 py-2 text-gray-900">{item.shopifyProduct.title}</td>
                        <td className="border border-gray-200 px-4 py-2 text-xs text-gray-700">
                          <div className="space-y-2">
                            <div className="break-all">{item.shopifyProduct.id}</div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.shopifyProduct.id, `product-${item.shopifyProduct.id}`)}
                              className="inline-flex items-center rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-300"
                            >
                              {copiedField === `product-${item.shopifyProduct.id}` ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-gray-900">{(() => {
                          const variant = item.shopifyProduct.variants.find(v => v.id === item.variant.id);
                          return variant?.title || '-';
                        })()}</td>
                        <td className="border border-gray-200 px-4 py-2 text-xs text-gray-700">
                          <div className="space-y-2">
                            <div className="break-all">{item.variant.id}</div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.variant.id, `variant-${item.variant.id}`)}
                              className="inline-flex items-center rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-300"
                            >
                              {copiedField === `variant-${item.variant.id}` ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-gray-900">{item.variant.sku}</td>
                        <td className="border border-gray-200 px-4 py-2 text-gray-900">
                          {item.suggestedMatch ? (
                            <span className="inline-block bg-blue-50 text-blue-800 text-xs font-medium px-2 py-1 rounded-lg">
                              {item.suggestedMatch.name || item.suggestedMatch.product_id}
                            </span>
                          ) : (
                            <span className="inline-block text-xs text-gray-400">Sin sugerencia</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-gray-900">
                          {item.suggestedMatch ? (
                            <button
                              type="button"
                              onClick={() => linkSuggestedProduct(item)}
                              disabled={linkingVariantId === item.variant.id}
                              className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                            >
                              {linkingVariantId === item.variant.id ? 'Vinculando...' : 'Vincular'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Manual</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-yellow-900">
                Si existe sugerencia, puedes vincular directamente desde aquí. Si no, ve al módulo <strong>Productos</strong> y completa los IDs manualmente.<br />
                La vinculacion siempre se hace por SKU ERP hacia una variante especifica de Shopify.
                <br />
                <a href="/productos" className="inline-block mt-3 bg-yellow-300 text-yellow-900 font-bold no-underline px-4 py-2 rounded-md hover:bg-yellow-400 transition-colors">
                  Ir al módulo Productos
               </a>
             </div>
           </>
         ) : (
           <div className="text-gray-500 py-8">No se pudo cargar el estado de salud de integración Shopify.</div>
         )}
       </div>

      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 p-4 py-6 sm:items-center">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900">Configuración de Shopify</h3>
            </div>

            <div className="space-y-4 overflow-y-auto px-6 py-4">
              <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Conexión técnica</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Ajustes necesarios para autenticar Shopify, definir la location y operar la sincronización técnica.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dominio de la Tienda
                  </label>
                  <input
                    type="text"
                    value={configForm.shop_domain}
                    onChange={(e) => setConfigForm({ ...configForm, shop_domain: e.target.value })}
                    placeholder="tu-tienda.myshopify.com"
                    className="w-full px-4 py-2 border border-gray-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shopify Location ID
                  </label>
                  <input
                    type="text"
                    value={configForm.shopify_location_id}
                    onChange={(e) => setConfigForm({ ...configForm, shopify_location_id: e.target.value })}
                    placeholder="gid://shopify/Location/... o ID numerico"
                    className="w-full px-4 py-2 border border-gray-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Define la ubicacion exacta donde Shopify debe reflejar el stock del ERP.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h5 className="text-sm font-semibold text-slate-900">Locations disponibles en Shopify</h5>
                    {locationsLoading && <span className="text-xs text-slate-500">Cargando...</span>}
                  </div>

                  {locationsError ? (
                    <p className="text-sm text-red-600">No se pudieron cargar las locations: {locationsError}</p>
                  ) : locations.length === 0 ? (
                    <p className="text-sm text-slate-600">Abre este modal con una sesion valida para consultar las locations activas.</p>
                  ) : (
                    <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                      {locations.map((location) => (
                        <div key={location.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-slate-900">{location.name}</div>
                              <div className="text-xs text-slate-500">Legacy ID: {location.legacy_id}</div>
                              <div className="text-xs text-slate-500 break-all">{location.id}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setConfigForm({ ...configForm, shopify_location_id: location.id })}
                              className="rounded-md bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                            >
                              Usar esta
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  El token de Shopify ya no se configura aqui. La autenticacion se obtiene automaticamente desde los
                  secrets del servidor usando `SHOPIFY_SHOP`, `SHOPIFY_CLIENT_ID` y `SHOPIFY_CLIENT_SECRET`.
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  La validacion del webhook tambien usa el `SHOPIFY_CLIENT_SECRET` server-side. El campo manual de
                  secreto ya no es necesario para operar la integracion.
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Versión de API Shopify
                  </label>
                  <select
                    value={configForm.api_version}
                    onChange={(e) => setConfigForm({ ...configForm, api_version: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {SHOPIFY_API_VERSION_OPTIONS.map((version) => (
                      <option key={version} value={version}>
                        {version}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Solo se muestran versiones estables oficiales de Shopify para evitar configuraciones no soportadas.
                  </p>
                </div>
              </section>

              <section className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Parámetros financieros</h4>
                  <p className="mt-1 text-sm text-amber-800">
                    Estos valores se usan para calcular comisiones, netos y rentabilidad de los pedidos Shopify dentro del ERP.
                  </p>
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
                    className="w-full px-4 py-2 border border-gray-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </section>
            </div>

            <div className="mt-auto flex gap-3 border-t border-gray-200 px-6 py-4">
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
