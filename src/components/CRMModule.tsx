import { useState, useEffect } from 'react';
import { Users, TrendingUp, Gift, Leaf, Mail, Phone, MapPin, DollarSign, ShoppingBag, Award, Search, Plus, X, Ticket, Calendar, Check, Send, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VIPEmailPreview from './VIPEmailPreview';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  total_purchases: number;
  total_spent: number;
  loyalty_tier: number;
  order_count: number;
  last_purchase_date: string | null;
  created_at: string;
}

interface VIPDiscountCode {
  id: string;
  customer_id: string;
  discount_code: string;
  discount_percentage: number;
  generated_at: string;
  expires_at: string | null;
  is_used: boolean;
  used_at: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  email_opened: boolean;
  email_clicked: boolean;
  customers?: Customer;
}

interface Order {
  id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  status: string;
  is_vip_milestone: boolean;
  discount_code_used: string | null;
  discount_amount: number;
}

export default function CRMModule() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vipCodes, setVipCodes] = useState<VIPDiscountCode[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [previewCode, setPreviewCode] = useState<VIPDiscountCode | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
    loadVIPCodes();
  }, []);

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('total_spent', { ascending: false });

    if (error) {
      console.error('Error loading customers:', error);
    } else {
      setCustomers(data || []);
    }
  };

  const loadVIPCodes = async () => {
    const { data, error } = await supabase
      .from('vip_discount_codes')
      .select(`
        *,
        customers (*)
      `)
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('Error loading VIP codes:', error);
    } else {
      setVipCodes(data || []);
    }
  };

  const loadCustomerOrders = async (customerId: string) => {
    const { data, error } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
    } else {
      setCustomerOrders(data || []);
    }
  };

  const addCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    const { error } = await supabase
      .from('customers')
      .insert([{
        ...newCustomer,
        order_count: 0,
        loyalty_tier: 1
      }]);

    if (error) {
      console.error('Error adding customer:', error);
      alert('Error al agregar cliente: ' + error.message);
    } else {
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      setShowAddCustomer(false);
      loadCustomers();
    }
  };

  const sendVIPEmail = async (code: VIPDiscountCode) => {
    if (!code.customers) {
      alert('No se encontró información del cliente');
      return;
    }

    try {
      const response = await supabase.functions.invoke('send-vip-email', {
        body: {
          customer_id: code.customer_id,
          customer_name: code.customers.name,
          customer_email: code.customers.email,
          discount_code: code.discount_code,
          discount_code_id: code.id,
        },
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.success) {
        await supabase
          .from('vip_discount_codes')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          })
          .eq('id', code.id);

        await supabase.rpc('log_email_event', {
          p_customer_id: code.customer_id,
          p_discount_code_id: code.id,
          p_email_type: 'vip_milestone',
          p_recipient_email: code.customers.email,
          p_subject: '🌿 ¡Llegaste a tu décima cosecha! Tu regalo VIP te espera',
          p_delivered: true,
        });

        alert('Email enviado exitosamente');
        loadVIPCodes();
      } else {
        throw new Error('Error al enviar el email');
      }
    } catch (error) {
      console.error('Error sending VIP email:', error);
      alert('Error al enviar el email: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const previewEmail = (code: VIPDiscountCode) => {
    setPreviewCode(code);
    setShowEmailPreview(true);
  };

  const getLoyaltyIcon = (tier: number, orderCount: number) => {
    const leaves = [];
    const tierConfig = {
      1: { count: 1, color: 'text-[#10b981] fill-[#10b981]' },
      2: { count: 2, color: 'text-green-500 fill-green-500' },
      3: { count: 3, color: 'text-amber-500 fill-amber-500' }
    };

    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig[1];

    for (let i = 0; i < config.count; i++) {
      leaves.push(<Leaf key={i} className={`w-5 h-5 ${config.color}`} />);
    }
    return { leaves, config, orderCount };
  };

  const getTierName = (tier: number) => {
    const names = {
      1: 'Brote',
      2: 'Crecimiento',
      3: 'Bosque VIP'
    };
    return names[tier as keyof typeof names] || 'Brote';
  };

  const getTierBorderClass = (tier: number) => {
    if (tier === 3) return 'border-amber-500/50 shadow-amber-500/20';
    if (tier === 2) return 'border-green-500/30 shadow-green-500/10';
    return 'border-[#10b981]/20';
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topCustomers = customers.slice(0, 5);
  const totalLTV = customers.reduce((sum, c) => sum + Number(c.total_spent), 0);
  const avgLTV = customers.length > 0 ? totalLTV / customers.length : 0;

  const tierDistribution = {
    brote: customers.filter(c => c.loyalty_tier === 1).length,
    crecimiento: customers.filter(c => c.loyalty_tier === 2).length,
    bosque: customers.filter(c => c.loyalty_tier === 3).length
  };

  const maxTierCount = Math.max(tierDistribution.brote, tierDistribution.crecimiento, tierDistribution.bosque, 1);

  return (
    <div className="space-y-6 bg-slate-950 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Customer Loyalty & CRM</h2>
          <p className="text-slate-400">Sistema de fidelización por hojas y gestión de recompensas VIP</p>
        </div>
        <button
          onClick={() => setShowAddCustomer(true)}
          className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{customers.length}</p>
          <p className="text-blue-300 text-sm font-medium">Total Clientes</p>
        </div>

        <div className="bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/30 backdrop-blur-sm rounded-xl p-6 border border-[#10b981]/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-[#10b981]" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">${totalLTV.toLocaleString('es-CL')}</p>
          <p className="text-emerald-300 text-sm font-medium">LTV Total</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">${avgLTV.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</p>
          <p className="text-purple-300 text-sm font-medium">LTV Promedio</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Gift className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{tierDistribution.bosque}</p>
          <p className="text-amber-300 text-sm font-medium">Clientes VIP</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Leaf className="w-6 h-6 text-[#10b981]" />
          <h3 className="text-xl font-bold text-white">Distribución por Nivel de Hojas</h3>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Leaf className="w-5 h-5 text-[#10b981] fill-[#10b981]" />
                <span className="text-white font-semibold">Brote (1-3)</span>
              </div>
              <span className="text-2xl font-bold text-[#10b981]">{tierDistribution.brote}</span>
            </div>
            <div className="bg-slate-800 rounded-lg h-48 overflow-hidden relative">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ height: `${(tierDistribution.brote / maxTierCount) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Leaf className="w-5 h-5 text-green-500 fill-green-500" />
                <Leaf className="w-5 h-5 text-green-500 fill-green-500" />
                <span className="text-white font-semibold">Crecimiento (4-9)</span>
              </div>
              <span className="text-2xl font-bold text-green-400">{tierDistribution.crecimiento}</span>
            </div>
            <div className="bg-slate-800 rounded-lg h-48 overflow-hidden relative">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-400 transition-all duration-500"
                style={{ height: `${(tierDistribution.crecimiento / maxTierCount) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Leaf className="w-5 h-5 text-amber-500 fill-amber-500" />
                <Leaf className="w-5 h-5 text-amber-500 fill-amber-500" />
                <Leaf className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-white font-semibold">Bosque VIP (10+)</span>
              </div>
              <span className="text-2xl font-bold text-amber-400">{tierDistribution.bosque}</span>
            </div>
            <div className="bg-slate-800 rounded-lg h-48 overflow-hidden relative">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-amber-500 to-amber-400 transition-all duration-500 shadow-amber-500/50 shadow-lg"
                style={{ height: `${(tierDistribution.bosque / maxTierCount) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {vipCodes.length > 0 && (
        <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 backdrop-blur-sm rounded-xl p-6 border border-amber-500/50 shadow-xl shadow-amber-500/20">
          <div className="flex items-center space-x-3 mb-6">
            <Ticket className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Códigos de Descuento VIP (20%)</h3>
            <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm font-bold">
              {vipCodes.length} códigos generados
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-amber-700/50">
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold text-sm">Cliente</th>
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold text-sm">Código</th>
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold text-sm">Descuento</th>
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold text-sm">Generado</th>
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold text-sm">Email Enviado</th>
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold text-sm">Estado</th>
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vipCodes.map((code) => (
                  <tr key={code.id} className="border-b border-amber-800/30 hover:bg-amber-900/20 transition-all">
                    <td className="py-3 px-4 text-white font-semibold">
                      {code.customers?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-amber-500/30 text-amber-300 px-3 py-1 rounded-lg font-mono font-bold">
                        {code.discount_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-amber-400 font-bold">
                      {code.discount_percentage}%
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-sm">
                      {new Date(code.generated_at).toLocaleDateString('es-CL')}
                    </td>
                    <td className="py-3 px-4">
                      {code.email_sent ? (
                        <div className="flex items-center space-x-2">
                          <div className="bg-green-500 rounded-full p-1">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-green-400 font-semibold text-sm">Enviado</p>
                            {code.email_sent_at && (
                              <p className="text-slate-400 text-xs">
                                {new Date(code.email_sent_at).toLocaleDateString('es-CL')}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="flex items-center space-x-1 text-slate-500">
                          <X className="w-4 h-4" />
                          <span className="text-sm">Pendiente</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {code.is_used ? (
                        <span className="flex items-center space-x-1 text-green-400">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-semibold">Usado</span>
                        </span>
                      ) : (
                        <span className="bg-[#10b981]/20 text-[#10b981] px-3 py-1 rounded-full text-xs font-semibold">
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => previewEmail(code)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-all"
                          title="Vista previa del email"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!code.email_sent && (
                          <button
                            onClick={() => sendVIPEmail(code)}
                            className="bg-lime-500 hover:bg-lime-600 text-white p-2 rounded-lg transition-all"
                            title="Enviar email VIP"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Award className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Top 5 Clientes</h3>
          </div>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => {
              const { leaves } = getLoyaltyIcon(customer.loyalty_tier, customer.order_count);
              return (
                <div
                  key={customer.id}
                  className={`bg-slate-800/60 rounded-lg p-4 border ${getTierBorderClass(customer.loyalty_tier)} hover:shadow-lg transition-all cursor-pointer`}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    loadCustomerOrders(customer.id);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-slate-600">#{index + 1}</span>
                      <span className="text-white font-semibold">{customer.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {leaves}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#10b981] font-semibold">${customer.total_spent.toLocaleString('es-CL')}</span>
                    <span className="text-slate-400">{customer.order_count} pedidos</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {getTierName(customer.loyalty_tier)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Todos los Clientes</h3>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">Cliente</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">Nivel</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">Pedidos</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">LTV</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold text-sm">Última Compra</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const { leaves } = getLoyaltyIcon(customer.loyalty_tier, customer.order_count);
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        loadCustomerOrders(customer.id);
                      }}
                      className={`border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer transition-all border-l-4 ${getTierBorderClass(customer.loyalty_tier)}`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-semibold">{customer.name}</p>
                          <p className="text-slate-400 text-sm">{customer.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          {leaves}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{getTierName(customer.loyalty_tier)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white font-bold">{customer.order_count}</span>
                        <span className="text-slate-500 text-sm ml-1">pedidos</span>
                      </td>
                      <td className="py-3 px-4 text-[#10b981] font-semibold">
                        ${customer.total_spent.toLocaleString('es-CL')}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-sm">
                        {customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString('es-CL') : 'Sin compras'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{selectedCustomer.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{selectedCustomer.email}</span>
                  </span>
                  {selectedCustomer.phone && (
                    <span className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{selectedCustomer.phone}</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`bg-slate-800/60 rounded-lg p-4 border ${getTierBorderClass(selectedCustomer.loyalty_tier)} shadow-lg`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {getLoyaltyIcon(selectedCustomer.loyalty_tier, selectedCustomer.order_count).leaves}
                  </div>
                  <p className="text-white font-bold">{getTierName(selectedCustomer.loyalty_tier)}</p>
                  <p className="text-slate-400 text-sm">Tier de Lealtad</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                  <p className="text-2xl font-bold text-white mb-1">{selectedCustomer.order_count}</p>
                  <p className="text-slate-400 text-sm">Total Pedidos</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                  <p className="text-2xl font-bold text-[#10b981] mb-1">${selectedCustomer.total_spent.toLocaleString('es-CL')}</p>
                  <p className="text-slate-400 text-sm">Valor LTV</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                  <p className="text-2xl font-bold text-blue-400 mb-1">{selectedCustomer.total_purchases}</p>
                  <p className="text-slate-400 text-sm">Compras Totales</p>
                </div>
              </div>

              {selectedCustomer.address && (
                <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center space-x-2 text-slate-400 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-semibold">Dirección</span>
                  </div>
                  <p className="text-white">{selectedCustomer.address}</p>
                </div>
              )}

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                  <h4 className="text-lg font-bold text-white">Historial de Pedidos</h4>
                </div>
                <div className="space-y-3">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`rounded-lg p-4 border ${order.is_vip_milestone
                        ? 'bg-gradient-to-r from-amber-900/40 to-amber-800/40 border-amber-500 shadow-lg shadow-amber-500/30'
                        : 'bg-slate-800/60 border-slate-700'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-white font-semibold">{order.order_number}</p>
                            {order.is_vip_milestone && (
                              <span className="bg-amber-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1">
                                <Gift className="w-3 h-3" />
                                <span>PEDIDO #10</span>
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm flex items-center space-x-2">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(order.order_date).toLocaleDateString('es-CL')}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#10b981] font-bold text-lg">${order.total_amount.toLocaleString('es-CL')}</p>
                          {order.discount_amount > 0 && (
                            <p className="text-amber-400 text-xs">-${order.discount_amount.toLocaleString('es-CL')} (20%)</p>
                          )}
                        </div>
                      </div>
                      {order.discount_code_used && (
                        <div className="mt-2 bg-[#10b981]/20 border border-emerald-500/50 rounded-lg p-2">
                          <p className="text-[#10b981] text-sm font-semibold">
                            Código usado: {order.discount_code_used}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {customerOrders.length === 0 && (
                    <p className="text-slate-500 text-center py-8">No hay pedidos registrados</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full shadow-2xl">
            <div className="border-b border-slate-700 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Nuevo Cliente</h3>
              <button
                onClick={() => setShowAddCustomer(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Dirección</label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  rows={3}
                  placeholder="Dirección de envío"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddCustomer(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={addCustomer}
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmailPreview && previewCode && previewCode.customers && (
        <VIPEmailPreview
          customerName={previewCode.customers.name}
          discountCode={previewCode.discount_code}
          onClose={() => {
            setShowEmailPreview(false);
            setPreviewCode(null);
          }}
        />
      )}
    </div>
  );
}
