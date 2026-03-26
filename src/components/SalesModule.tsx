import { useState, useEffect } from 'react';
import { ShoppingBag, Plus, TrendingUp, Calendar, DollarSign, Star, Gift, Users } from 'lucide-react';
import { supabase, Product, SalesOrder, BusinessConfig } from '../lib/supabase';

type SalesChannel = 'shopify' | 'direct' | 'wholesale' | 'other';

export default function SalesModule() {
  const [orders, setOrders] = useState<(SalesOrder & { products?: Product })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [orderForm, setOrderForm] = useState({
    product_id: '',
    quantity: 1,
    channel: 'shopify' as SalesChannel,
    notes: '',
  });
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorData, setSimulatorData] = useState({
    avgOrderValue: 50000,
    newCustomers: 100,
    returningCustomers: 50,
    vipDiscountRate: 0.10,
  });

  const isSalesChannel = (value: string): value is SalesChannel => {
    return ['shopify', 'direct', 'wholesale', 'other'].includes(value);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, configData] = await Promise.all([
        supabase
          .from('sales_orders')
          .select('*, products(name, product_id, base_price)')
          .order('order_date', { ascending: false })
          .limit(100),
        supabase.from('products').select('*').order('name'),
        supabase.from('business_config').select('*').limit(1).maybeSingle(),
      ]);

      if (ordersData.error) throw ordersData.error;
      if (productsData.error) throw productsData.error;
      if (configData.error) throw configData.error;

      setOrders(ordersData.data || []);
      setProducts(productsData.data || []);
      setBusinessConfig(configData.data);

      if (productsData.data && productsData.data.length > 0) {
        setOrderForm(prev => ({ ...prev, product_id: productsData.data[0].id }));
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    try {
      const product = products.find(p => p.id === orderForm.product_id);
      if (!product || !businessConfig) return;

      if (!customerEmail) {
        alert('Por favor ingrese el email del cliente');
        return;
      }

      let customerId = selectedCustomer;

      if (!customerId) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', customerEmail)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              name: customerEmail.split('@')[0],
              email: customerEmail,
            })
            .select()
            .single();

          if (customerError) throw customerError;
          customerId = newCustomer.id;
        }
      }

      const unitPrice = product.base_price;
      const subtotal = unitPrice * orderForm.quantity;
      const commission = orderForm.channel === 'shopify' ? (subtotal * businessConfig.shopify_commission_pct / 100) : 0;
      const shippingCost = businessConfig.shipping_cost;
      const totalAmount = subtotal + shippingCost;

      const orderNumber = `ORD-${Date.now()}`;

      const { error } = await supabase
        .from('customer_orders')
        .insert({
          customer_id: customerId,
          order_number: orderNumber,
          order_date: new Date().toISOString().split('T')[0],
          total_amount: totalAmount,
          items: [
            {
              product_id: product.id,
              name: product.name,
              quantity: orderForm.quantity,
              unit_price: unitPrice,
              sku: product.product_id,
            }
          ],
          status: 'pending',
        });

      if (error) throw error;

      const { error: salesError } = await supabase
        .from('sales_orders')
        .insert({
          order_number: orderNumber,
          product_id: orderForm.product_id,
          quantity: orderForm.quantity,
          unit_price: unitPrice,
          subtotal,
          commission,
          shipping_cost: shippingCost,
          total_amount: totalAmount,
          channel: orderForm.channel,
          status: 'completed',
          notes: orderForm.notes,
        });

      if (salesError) console.error('Error creating sales order:', salesError);

      setShowOrderModal(false);
      setOrderForm({ product_id: products[0]?.id || '', quantity: 1, channel: 'shopify', notes: '' });
      setCustomerEmail('');
      setSelectedCustomer('');
      loadData();
      alert('Venta registrada exitosamente. Se ha actualizado el perfil del cliente.');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al registrar la venta');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      shopify: 'bg-green-100 text-green-700',
      direct: 'bg-blue-100 text-blue-700',
      wholesale: 'bg-purple-100 text-purple-700',
      other: 'bg-slate-100 text-slate-700',
    };
    return colors[channel] || 'bg-slate-100 text-slate-700';
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCommissions = orders.reduce((sum, order) => sum + order.commission, 0);

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyOrders = orders.filter(order => {
    const orderDate = new Date(order.order_date);
    return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
  });
  const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total_amount, 0);

  const calculateSimulation = () => {
    const newRevenue = simulatorData.avgOrderValue * simulatorData.newCustomers;
    const returningRevenue = simulatorData.avgOrderValue * simulatorData.returningCustomers;
    const vipDiscountImpact = returningRevenue * simulatorData.vipDiscountRate * 0.20;
    const netReturningRevenue = returningRevenue - vipDiscountImpact;
    const totalRevenue = newRevenue + netReturningRevenue;
    const totalOrders = simulatorData.newCustomers + simulatorData.returningCustomers;
    const avgDiscount = totalOrders > 0 ? (vipDiscountImpact / totalRevenue) * 100 : 0;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ventas</h2>
          <p className="text-slate-600 mt-1">Registro y análisis de ventas</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSimulator(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Simulador</span>
          </button>
          <button
            onClick={() => setShowOrderModal(true)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Ingresos del Mes</h3>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(monthlyRevenue)}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {monthlyOrders.length} ventas
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Ingresos Totales</h3>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {totalOrders} ventas totales
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Ticket Promedio</h3>
            <ShoppingBag className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(averageOrderValue)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Comisiones Totales</h3>
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalCommissions)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Historial de Ventas</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="text-slate-600 mt-4">Cargando ventas...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Comisión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-slate-600">
                      {order.order_number.split('-').pop()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                      {new Date(order.order_date).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{order.products?.name}</div>
                      <div className="text-sm text-slate-500">{order.products?.product_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                      {order.quantity} un
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getChannelColor(order.channel)}`}>
                        {order.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                      {formatCurrency(order.subtotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600">
                      {order.commission > 0 ? `-${formatCurrency(order.commission)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-emerald-600">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Registrar Nueva Venta</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Email del Cliente *</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="cliente@ejemplo.com"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Se creará o actualizará el perfil del cliente automáticamente
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Producto
                </label>
                <select
                  value={orderForm.product_id}
                  onChange={(e) => setOrderForm({ ...orderForm, product_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.base_price)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Canal de Venta
                </label>
                <select
                  value={orderForm.channel}
                  onChange={(e) => {
                    if (!isSalesChannel(e.target.value)) return;
                    setOrderForm({ ...orderForm, channel: e.target.value });
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="shopify">Shopify</option>
                  <option value="direct">Venta Directa</option>
                  <option value="wholesale">Mayorista</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Información adicional..."
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                {(() => {
                  const product = products.find(p => p.id === orderForm.product_id);
                  if (!product || !businessConfig) return null;

                  const subtotal = product.base_price * orderForm.quantity;
                  const commission = orderForm.channel === 'shopify' ? (subtotal * businessConfig.shopify_commission_pct / 100) : 0;
                  const shipping = businessConfig.shipping_cost;
                  const total = subtotal + shipping;

                  return (
                    <>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Subtotal:</span>
                        <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Envío:</span>
                        <span className="font-medium text-slate-900">{formatCurrency(shipping)}</span>
                      </div>
                      {commission > 0 && (
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600">Comisión ({businessConfig.shopify_commission_pct}%):</span>
                          <span className="text-red-600">-{formatCurrency(commission)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold pt-2 border-t border-slate-200">
                        <span className="text-slate-900">Total:</span>
                        <span className="text-emerald-600">{formatCurrency(total)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createOrder}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Registrar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {showSimulator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Simulador de Ventas</h3>
                  <p className="text-sm text-slate-600">Proyección con impacto de descuentos VIP del 20%</p>
                </div>
              </div>
              <button
                onClick={() => setShowSimulator(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Valor Promedio de Orden (CLP)
                </label>
                <input
                  type="number"
                  value={simulatorData.avgOrderValue}
                  onChange={(e) => setSimulatorData({ ...simulatorData, avgOrderValue: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Clientes Nuevos
                </label>
                <input
                  type="number"
                  value={simulatorData.newCustomers}
                  onChange={(e) => setSimulatorData({ ...simulatorData, newCustomers: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Clientes Recurrentes
                </label>
                <input
                  type="number"
                  value={simulatorData.returningCustomers}
                  onChange={(e) => setSimulatorData({ ...simulatorData, returningCustomers: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center space-x-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>% Clientes VIP (Descuento 20%)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={simulatorData.vipDiscountRate * 100}
                  onChange={(e) => setSimulatorData({ ...simulatorData, vipDiscountRate: Number(e.target.value) / 100 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Porcentaje de clientes recurrentes que usan descuento VIP
                </p>
              </div>
            </div>

            {(() => {
              const simulation = calculateSimulation();
              return (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <h4 className="text-lg font-bold text-blue-900 mb-4">Proyección de Ingresos</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-slate-600 mb-1">Clientes Nuevos</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(simulation.newRevenue)}</p>
                        <p className="text-xs text-slate-500 mt-1">{simulatorData.newCustomers} órdenes</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-slate-600 mb-1">Clientes Recurrentes (Bruto)</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(simulation.returningRevenue)}</p>
                        <p className="text-xs text-slate-500 mt-1">{simulatorData.returningCustomers} órdenes</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-300">
                    <div className="flex items-center space-x-2 mb-4">
                      <Gift className="w-6 h-6 text-amber-600" />
                      <h4 className="text-lg font-bold text-amber-900">Impacto de Descuentos VIP (20%)</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-amber-200">
                        <p className="text-sm text-slate-600 mb-1">Clientes VIP</p>
                        <p className="text-xl font-bold text-amber-600">
                          {Math.round(simulatorData.returningCustomers * simulatorData.vipDiscountRate)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(simulatorData.vipDiscountRate * 100).toFixed(0)}% de recurrentes
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <p className="text-sm text-slate-600 mb-1">Descuento Total</p>
                        <p className="text-xl font-bold text-red-600">-{formatCurrency(simulation.vipDiscountImpact)}</p>
                        <p className="text-xs text-slate-500 mt-1">20% en compras VIP</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-slate-600 mb-1">Ingresos Netos Recurrentes</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(simulation.netReturningRevenue)}</p>
                        <p className="text-xs text-slate-500 mt-1">Después de descuentos</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-300">
                    <h4 className="text-lg font-bold text-emerald-900 mb-4">Resultado Final</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-emerald-200">
                        <p className="text-sm text-slate-600 mb-1">Ingresos Totales</p>
                        <p className="text-3xl font-bold text-emerald-600">{formatCurrency(simulation.totalRevenue)}</p>
                        <p className="text-xs text-slate-500 mt-1">{simulation.totalOrders} órdenes totales</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-sm text-slate-600 mb-1">Ticket Promedio</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {formatCurrency(simulation.totalOrders > 0 ? simulation.totalRevenue / simulation.totalOrders : 0)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Por orden</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <p className="text-sm text-slate-600 mb-1">Impacto de Descuentos</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {simulation.avgDiscount.toFixed(2)}%
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Del total de ingresos</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Nota sobre Descuentos VIP</p>
                        <p className="text-sm text-blue-800">
                          El simulador considera que {(simulatorData.vipDiscountRate * 100).toFixed(0)}% de tus clientes recurrentes
                          alcanzarán su compra #10 y usarán el descuento VIP del 20%. Esto impacta directamente la utilidad neta
                          pero fomenta la lealtad a largo plazo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSimulator(false)}
                className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
