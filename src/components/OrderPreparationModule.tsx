import { useState, useEffect, useCallback } from 'react';
import { Star, Package, CheckCircle, AlertCircle, Gift, Printer, Search, Filter } from 'lucide-react';
import { filterPreparedOrders, sanitizeOrderItems } from '../lib/orderPreparationHelpers';
import { CustomerOrderItem, supabase } from '../lib/supabase';
import VIPOrderLabel from './VIPOrderLabel';
import ThankYouCard from './ThankYouCard';

interface Order {
  id: string;
  customer_id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  items: CustomerOrderItem[];
  status: string;
  reward_eligible: boolean;
  reward_included: boolean;
  is_vip_milestone: boolean;
  customer?: {
    name: string;
    email: string;
    address: string | null;
    total_purchases: number;
    order_count: number;
  };
}

export default function OrderPreparationModule() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showVIPLabel, setShowVIPLabel] = useState(false);
  const [showThankYouCard, setShowThankYouCard] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('customer_orders')
      .select(`
        *,
        customer:customers(*)
      `)
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
    } else {
      setOrders(data || []);
    }
  };

  const filterOrders = useCallback(() => {
    setFilteredOrders(filterPreparedOrders(orders, searchTerm, statusFilter));
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('customer_orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      alert('Error al actualizar el estado');
    } else {
      loadOrders();
    }
  };

  const markRewardIncluded = async (orderId: string) => {
    const { error } = await supabase
      .from('customer_orders')
      .update({ reward_included: true })
      .eq('id', orderId);

    if (error) {
      console.error('Error marking reward:', error);
      alert('Error al marcar regalo incluido');
    } else {
      loadOrders();
    }
  };

  const openVIPLabel = (order: Order) => {
    setSelectedOrder(order);
    setShowVIPLabel(true);
  };

  const openThankYouCard = (order: Order) => {
    setSelectedOrder(order);
    setShowThankYouCard(true);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pendiente' },
      preparing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Preparando' },
      ready: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Listo' },
      shipped: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Enviado' },
      delivered: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Entregado' },
      cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelado' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const vipPendingOrders = pendingOrders.filter(o => o.reward_eligible && !o.reward_included);
  const vipMilestoneOrders = pendingOrders.filter(o => o.is_vip_milestone && o.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Órdenes por Preparar</h2>
          <p className="text-slate-400">Panel de control de preparación y despacho</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{pendingOrders.length}</p>
          <p className="text-yellow-300 text-sm font-medium">Órdenes Pendientes</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <Gift className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{vipPendingOrders.length}</p>
          <p className="text-amber-300 text-sm font-medium">Órdenes VIP</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {filteredOrders.filter(o => o.status === 'ready').length}
          </p>
          <p className="text-blue-300 text-sm font-medium">Listos para Envío</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {filteredOrders.filter(o => o.status === 'shipped' || o.status === 'delivered').length}
          </p>
          <p className="text-green-300 text-sm font-medium">En Tránsito/Entregados</p>
        </div>
      </div>

      {vipMilestoneOrders.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/30 to-amber-600/30 backdrop-blur-sm rounded-xl p-6 border-4 border-amber-500 shadow-2xl shadow-amber-500/40 animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-amber-500 p-3 rounded-xl shadow-lg">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-amber-100 mb-1">¡REGALO VIP! Incluir Pack de Semillas + Nota física</h3>
              <p className="text-amber-200 font-semibold">Compra #10 detectada - Cliente alcanzó nivel Bosque VIP</p>
            </div>
          </div>
          <div className="space-y-3">
            {vipMilestoneOrders.map((order) => (
              <div
                key={order.id}
                className="bg-amber-900/60 rounded-lg p-5 border-2 border-amber-400 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Star className="w-7 h-7 text-amber-300 fill-amber-300 animate-spin" style={{ animationDuration: '3s' }} />
                      <span className="text-white font-bold text-xl">Orden #{order.order_number}</span>
                      <span className="bg-gradient-to-r from-amber-500 to-amber-400 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                        🌳 PEDIDO #10 - BOSQUE VIP
                      </span>
                    </div>
                    <p className="text-white font-bold text-lg">{order.customer?.name}</p>
                    <p className="text-amber-200 text-sm">{order.customer?.email}</p>
                    <div className="bg-amber-500/30 border border-amber-400 rounded-lg p-3 mt-3">
                      <div className="flex items-center space-x-2">
                        <Gift className="w-5 h-5 text-amber-200" />
                        <span className="text-amber-100 font-bold">
                          INCLUIR: Pack de Semillas de Regalo + Nota de Agradecimiento Impresa
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => openVIPLabel(order)}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 shadow-lg"
                    >
                      <Printer className="w-5 h-5" />
                      <span>Imprimir Etiqueta VIP</span>
                    </button>
                    <button
                      onClick={() => openThankYouCard(order)}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 shadow-lg"
                    >
                      <Star className="w-5 h-5" />
                      <span>Nota de Agradecimiento</span>
                    </button>
                    <button
                      onClick={() => markRewardIncluded(order.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 shadow-lg"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Marcar Regalo Incluido</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vipPendingOrders.length > 0 && vipMilestoneOrders.length === 0 && (
        <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 backdrop-blur-sm rounded-xl p-6 border-2 border-amber-500 shadow-2xl shadow-amber-500/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-amber-500 p-2 rounded-lg animate-pulse">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Alertas VIP - ¡Incluir Regalo de Lealtad!</h3>
          </div>
          <div className="space-y-3">
            {vipPendingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900/60 rounded-lg p-4 border-2 border-amber-500 shadow-lg shadow-amber-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                      <span className="text-white font-bold text-lg">Orden #{order.order_number}</span>
                      <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        NIVEL 10 VIP
                      </span>
                    </div>
                    <p className="text-white font-semibold">{order.customer?.name}</p>
                    <p className="text-slate-400 text-sm">{order.customer?.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400 font-semibold text-sm">
                        ¡CLIENTE VIP: INCLUIR REGALO NIVEL 10!
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => openVIPLabel(order)}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Etiqueta VIP</span>
                    </button>
                    <button
                      onClick={() => openThankYouCard(order)}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Tarjeta</span>
                    </button>
                    <button
                      onClick={() => markRewardIncluded(order.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirmar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Todas las Órdenes</h3>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar orden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
              />
            </div>
            <div className="relative">
              <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 appearance-none"
              >
                <option value="all">Todos los Estados</option>
                <option value="pending">Pendiente</option>
                <option value="preparing">Preparando</option>
                <option value="ready">Listo</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`rounded-lg p-4 transition-all ${
                order.reward_eligible && !order.reward_included
                  ? 'bg-gradient-to-r from-amber-900/40 to-amber-800/40 border-2 border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/60 border border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {order.reward_eligible && !order.reward_included && (
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                    )}
                    <span className="text-white font-bold">Orden #{order.order_number}</span>
                    {getStatusBadge(order.status)}
                    {order.reward_eligible && !order.reward_included && (
                      <span className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                        <Gift className="w-3 h-3" />
                        <span>VIP</span>
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Cliente</p>
                      <p className="text-white font-semibold">{order.customer?.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Fecha</p>
                      <p className="text-white">{order.order_date}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Total</p>
                      <p className="text-emerald-400 font-semibold">${order.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="preparing">Preparando</option>
                    <option value="ready">Listo</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  {order.reward_eligible && !order.reward_included && (
                    <button
                      onClick={() => openVIPLabel(order)}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-all flex items-center justify-center space-x-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>VIP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showVIPLabel && selectedOrder && (
        <VIPOrderLabel
          orderNumber={selectedOrder.order_number}
          customerName={selectedOrder.customer?.name || ''}
          customerEmail={selectedOrder.customer?.email || ''}
          address={selectedOrder.customer?.address || ''}
          items={sanitizeOrderItems(selectedOrder.items)}
          orderDate={selectedOrder.order_date}
        />
      )}

      {showThankYouCard && selectedOrder && (
        <ThankYouCard
          customerName={selectedOrder.customer?.name || ''}
          purchaseCount={selectedOrder.customer?.total_purchases || 10}
        />
      )}

      {(showVIPLabel || showThankYouCard) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowVIPLabel(false);
            setShowThankYouCard(false);
          }}
        />
      )}
    </div>
  );
}
