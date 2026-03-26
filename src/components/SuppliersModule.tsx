import { useState, useEffect } from 'react';
import { Users, Plus, Building, Phone, Mail, CreditCard as Edit, FileText } from 'lucide-react';
import { supabase, Supplier, PurchaseInvoice } from '../lib/supabase';

export default function SuppliersModule() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    rut: '',
    business_name: '',
    trade_name: '',
    business_activity: '',
    address: '',
    phone: '',
    email: '',
    contact_person: '',
    payment_terms_days: 30,
    notes: '',
  });

  const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Error al guardar proveedor';
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suppliersData, invoicesData] = await Promise.all([
        supabase.from('suppliers').select('*').order('business_name'),
        supabase.from('purchase_invoices').select('*, suppliers(*)').order('invoice_date', { ascending: false }),
      ]);

      setSuppliers(suppliersData.data || []);
      setInvoices(invoicesData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedSupplier) {
        await supabase.from('suppliers').update(formData).eq('id', selectedSupplier.id);
        alert('Proveedor actualizado');
      } else {
        await supabase.from('suppliers').insert([formData]);
        alert('Proveedor creado');
      }

      setShowForm(false);
      setSelectedSupplier(null);
      setFormData({
        rut: '',
        business_name: '',
        trade_name: '',
        business_activity: '',
        address: '',
        phone: '',
        email: '',
        contact_person: '',
        payment_terms_days: 30,
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert(getErrorMessage(error));
    }
  };

  const editSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      rut: supplier.rut,
      business_name: supplier.business_name,
      trade_name: supplier.trade_name || '',
      business_activity: supplier.business_activity || '',
      address: supplier.address || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      contact_person: supplier.contact_person || '',
      payment_terms_days: supplier.payment_terms_days,
      notes: supplier.notes || '',
    });
    setShowForm(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSupplierStats = (supplierId: string) => {
    const supplierInvoices = invoices.filter((inv) => inv.supplier_id === supplierId);
    const totalSpent = supplierInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const pendingInvoices = supplierInvoices.filter((inv) => inv.status === 'pending');
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    return { totalSpent, pendingAmount, invoiceCount: supplierInvoices.length };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Gestión de Proveedores</h2>
          <p className="text-[#10b981] mt-1 font-medium">Base de datos de proveedores y estado de cuenta</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setSelectedSupplier(null);
            setFormData({
              rut: '',
              business_name: '',
              trade_name: '',
              business_activity: '',
              address: '',
              phone: '',
              email: '',
              contact_person: '',
              payment_terms_days: 30,
              notes: '',
            });
          }}
          className="flex items-center space-x-2 bg-[#10b981] text-white px-5 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-6">
            {selectedSupplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">RUT</label>
                <input
                  type="text"
                  required
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="12.345.678-9"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Razón Social</label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Empresa S.A."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Comercial</label>
                <input
                  type="text"
                  value={formData.trade_name}
                  onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Nombre comercial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Giro</label>
                <input
                  type="text"
                  value={formData.business_activity}
                  onChange={(e) => setFormData({ ...formData, business_activity: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Venta de envases"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="contacto@proveedor.cl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Persona de Contacto</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Plazo de Pago (días)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.payment_terms_days}
                  onChange={(e) => setFormData({ ...formData, payment_terms_days: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Av. Principal 123, Comuna, Ciudad"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  rows={2}
                  placeholder="Observaciones adicionales"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-semibold"
              >
                {selectedSupplier ? 'Actualizar' : 'Registrar'} Proveedor
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedSupplier(null);
                }}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => {
          const stats = getSupplierStats(supplier.id);
          return (
            <div key={supplier.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 p-6 hover:border-[#10b981]/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Building className="w-8 h-8 text-[#10b981]" />
                  <div>
                    <h3 className="font-bold text-white">{supplier.business_name}</h3>
                    {supplier.trade_name && (
                      <p className="text-sm text-slate-400">{supplier.trade_name}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => editSupplier(supplier)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center space-x-2 text-slate-300">
                  <FileText className="w-4 h-4" />
                  <span>RUT: {supplier.rut}</span>
                </div>
                {supplier.phone && (
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Phone className="w-4 h-4" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Volumen anual:</span>
                  <span className="font-bold text-[#10b981]">{formatCurrency(stats.totalSpent)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Saldo pendiente:</span>
                  <span className={`font-bold ${stats.pendingAmount > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                    {formatCurrency(stats.pendingAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Facturas:</span>
                  <span className="font-semibold text-white">{stats.invoiceCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Plazo:</span>
                  <span className="font-semibold text-cyan-400">{supplier.payment_terms_days} días</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {suppliers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay proveedores registrados</p>
          <p className="text-sm text-slate-500 mt-2">Agrega tu primer proveedor para comenzar</p>
        </div>
      )}
    </div>
  );
}
