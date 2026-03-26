import { useState, useEffect } from 'react';
import { Plus, TrendingDown, Package, DollarSign, CheckCircle } from 'lucide-react';
import { supabase, Purchase, PackagingInventory } from '../lib/supabase';
import { calculateNetFromGross } from '../lib/taxUtils';

const DEFAULT_FORM_STATE = {
  supplier_name: '',
  item_type: 'envase',
  item_name: '',
  format: '',
  quantity: 0,
  unit_price_gross: 0,
  invoice_number: '',
  notes: '',
};

export default function PurchasesModule() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [packagingInventory, setPackagingInventory] = useState<PackagingInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchasesData, inventoryData] = await Promise.all([
        supabase.from('purchases').select('*').order('purchase_date', { ascending: false }),
        supabase.from('packaging_inventory').select('*').order('item_type, format'),
      ]);

      setPurchases(purchasesData.data || []);
      setPackagingInventory(inventoryData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalGross = formData.quantity * formData.unit_price_gross;
    const breakdown = calculateNetFromGross(totalGross);
    const normalizedFormat = formData.format.trim() || null;
    const unitCostNet = formData.quantity > 0 ? breakdown.net / formData.quantity : 0;

    try {
      const { data: purchase, error } = await supabase
        .from('purchases')
        .insert([
          {
            supplier_name: formData.supplier_name,
            item_type: formData.item_type,
            item_name: formData.item_name,
            quantity: formData.quantity,
            unit_price_gross: formData.unit_price_gross,
            total_gross: totalGross,
            total_net: breakdown.net,
            vat_credit: breakdown.vat,
            invoice_number: formData.invoice_number || null,
            notes: formData.notes || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const existingItem = packagingInventory.find(
        (item) =>
          item.item_type === formData.item_type &&
          item.item_name === formData.item_name &&
          (item.format || null) === normalizedFormat
      );

      let packagingInventoryId = existingItem?.id || null;

      if (existingItem) {
        await supabase
          .from('packaging_inventory')
          .update({
            current_stock: existingItem.current_stock + formData.quantity,
            unit_cost_net: unitCostNet,
          })
          .eq('id', existingItem.id);
      } else {
        const { data: newInventoryItem, error: inventoryInsertError } = await supabase
          .from('packaging_inventory')
          .insert([
            {
              item_type: formData.item_type,
              item_name: formData.item_name,
              format: normalizedFormat,
              current_stock: formData.quantity,
              unit_cost_net: unitCostNet,
            },
          ])
          .select()
          .single();

        if (inventoryInsertError) throw inventoryInsertError;
        packagingInventoryId = newInventoryItem.id;
      }

      if (packagingInventoryId) {
        const { error: movementError } = await supabase.from('inventory_movements').insert([
          {
            packaging_inventory_id: packagingInventoryId,
            movement_type: 'entrada',
            quantity: formData.quantity,
            reference_id: purchase?.id,
            reference_type: 'purchase',
            notes: `Compra a ${formData.supplier_name}`,
          },
        ]);

        if (movementError) throw movementError;
      }

      await supabase
        .from('purchases')
        .update({ inventory_updated: Boolean(packagingInventoryId) })
        .eq('id', purchase?.id);

      alert('Compra registrada exitosamente');
      setShowForm(false);
      setFormData(DEFAULT_FORM_STATE);
      loadData();
    } catch (error) {
      console.error('Error creating purchase:', error);
      alert('Error al registrar la compra');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyPurchases = purchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.purchase_date);
    return purchaseDate.getMonth() === thisMonth && purchaseDate.getFullYear() === thisYear;
  });

  const totalVatCredit = monthlyPurchases.reduce((sum, p) => sum + p.vat_credit, 0);
  const totalSpent = monthlyPurchases.reduce((sum, p) => sum + p.total_gross, 0);

  const totalGross = formData.quantity * formData.unit_price_gross;
  const previewBreakdown = calculateNetFromGross(totalGross);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Gestión de Compras</h2>
          <p className="text-[#10b981] mt-1 font-medium">Registro de compras con IVA Crédito automático</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-[#10b981] text-white px-5 py-3 rounded-xl hover:shadow-lg  transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Compra</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider">IVA Crédito del Mes</h3>
            <TrendingDown className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(totalVatCredit)}</p>
          <p className="text-sm text-slate-400 mt-1">Ahorro fiscal acumulado</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Total Invertido</h3>
            <DollarSign className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalSpent)}</p>
          <p className="text-sm text-slate-400 mt-1">{monthlyPurchases.length} compras este mes</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Ahorro Fiscal %</h3>
            <Package className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-amber-400">
            {totalSpent > 0 ? ((totalVatCredit / totalSpent) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-sm text-slate-400 mt-1">IVA recuperable</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-6">Registrar Nueva Compra</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proveedor</label>
                <input
                  type="text"
                  required
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Insumo</label>
                <select
                  value={formData.item_type}
                  onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="envase">Envase</option>
                  <option value="tapa">Tapa</option>
                  <option value="gatillo">Gatillo</option>
                  <option value="etiqueta">Etiqueta</option>
                  <option value="materia_prima">Materia Prima</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre del Insumo</label>
                <input
                  type="text"
                  required
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Ej: Botella PET"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Formato</label>
                <input
                  type="text"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Ej: 500cc"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cantidad</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Precio Unitario Bruto</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.unit_price_gross}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_price_gross: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Número de Factura (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Ej: F-00123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notas (Opcional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Observaciones"
                />
              </div>
            </div>

            {formData.quantity > 0 && formData.unit_price_gross > 0 && (
              <div className="bg-blue-900/30 rounded-lg p-6 border-2 border-blue-500/50">
                <h4 className="font-bold text-blue-200 mb-4">Vista Previa del Cálculo</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Total Bruto</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totalGross)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Total Neto</p>
                    <p className="text-xl font-bold text-blue-400">{formatCurrency(previewBreakdown.net)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">IVA Crédito</p>
                    <p className="text-xl font-bold text-green-400">{formatCurrency(previewBreakdown.vat)}</p>
                  </div>
                  <div className="bg-green-900/50 rounded-lg p-4 border-2 border-green-500">
                    <p className="text-xs text-green-200 mb-1">Ahorro Fiscal</p>
                    <p className="text-xl font-bold text-green-300">{formatCurrency(previewBreakdown.vat)}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Este IVA Crédito se restará automáticamente del IVA Débito en tu declaración F29
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-semibold"
              >
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Registrar Compra y Actualizar Stock</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-[#10b981]/30 to-[#10b981]/40">
          <h3 className="text-lg font-bold text-white">Historial de Compras</h3>
          <p className="text-sm text-[#10b981] mt-1">IVA Crédito calculado automáticamente</p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#10b981]"></div>
            <p className="text-slate-300 mt-4">Cargando compras...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Insumo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total Bruto</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total Neto</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">IVA Crédito</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(purchase.purchase_date).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{purchase.supplier_name}</div>
                      {purchase.invoice_number && (
                        <div className="text-xs text-slate-500">F: {purchase.invoice_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{purchase.item_name}</div>
                      <div className="text-xs text-slate-500">{purchase.item_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                      {purchase.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-slate-900">
                      {formatCurrency(purchase.total_gross)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-blue-700">
                      {formatCurrency(purchase.total_net)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-green-600">
                      {formatCurrency(purchase.vat_credit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {purchase.inventory_updated ? (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                          Stock actualizado
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
