import { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase, Supplier, PackagingInventory, PurchaseInvoice } from '../lib/supabase';
import {
  buildInvoiceInventoryResolutionPlan,
  calculateInvoiceTotals,
  EMPTY_LINE_ITEM,
  getCreditDueDate,
  hasInvoiceItemsToSubmit,
  InvoiceLineItem,
  InvoiceLineItemValue,
  normalizeInvoiceItemsForInsert,
  updateInvoiceLineItem,
} from '../lib/purchaseInvoiceHelpers';

export default function InvoicesPurchaseModule() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<PackagingInventory[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentCondition, setPaymentCondition] = useState('cash');
  const [creditDays, setCreditDays] = useState(30);
  const [notes, setNotes] = useState('');

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([EMPTY_LINE_ITEM]);

  const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Error al guardar la factura';
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suppliersData, inventoryData, invoicesData] = await Promise.all([
        supabase.from('suppliers').select('*').eq('is_active', true).order('business_name'),
        supabase.from('packaging_inventory').select('*').order('item_type, format'),
        supabase.from('purchase_invoices').select('*, suppliers(*)').order('invoice_date', { ascending: false }).limit(50),
      ]);

      setSuppliers(suppliersData.data || []);
      setInventory(inventoryData.data || []);
      setInvoices(invoicesData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      EMPTY_LINE_ITEM,
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: InvoiceLineItemValue) => {
    setLineItems(updateInvoiceLineItem(lineItems, index, field, value, inventory));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasInvoiceItemsToSubmit(lineItems)) {
      alert('Debes agregar al menos un ítem a la factura');
      return;
    }

    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert([
          {
            supplier_id: supplierId,
            invoice_number: invoiceNumber,
            invoice_date: invoiceDate,
            payment_condition: paymentCondition,
            credit_days: paymentCondition === 'credit' ? creditDays : 0,
            notes: notes || null,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const inventoryResolvedItems: InvoiceLineItem[] = [];

      for (const item of lineItems.filter((lineItem) => lineItem.quantity > 0)) {
        const inventoryPlan = buildInvoiceInventoryResolutionPlan(item, invoiceNumber, inventory);
        let packagingInventoryId = inventoryPlan.packagingInventoryId;

        if (inventoryPlan.shouldInsertInventory && inventoryPlan.inventoryInsertPayload) {
          const { data: newInventoryItem, error: inventoryInsertError } = await supabase
            .from('packaging_inventory')
            .insert([inventoryPlan.inventoryInsertPayload])
            .select()
            .single();

          if (inventoryInsertError) throw inventoryInsertError;

          packagingInventoryId = newInventoryItem.id;
        } else if (inventoryPlan.inventoryUpdatePayload) {
          packagingInventoryId = inventoryPlan.inventoryUpdatePayload.id;
          const { error: inventoryUpdateError } = await supabase
            .from('packaging_inventory')
            .update({
              current_stock: inventoryPlan.inventoryUpdatePayload.current_stock,
              unit_cost_net: inventoryPlan.inventoryUpdatePayload.unit_cost_net,
            })
            .eq('id', inventoryPlan.inventoryUpdatePayload.id);

          if (inventoryUpdateError) throw inventoryUpdateError;
        }

        const { error: movementError } = await supabase.from('inventory_movements').insert([
          {
            packaging_inventory_id: packagingInventoryId,
            movement_type: inventoryPlan.movementPayload.movement_type,
            quantity: inventoryPlan.movementPayload.quantity,
            reference_id: invoice.id,
            reference_type: inventoryPlan.movementPayload.reference_type,
            notes: inventoryPlan.movementPayload.notes,
          },
        ]);

        if (movementError) throw movementError;

        inventoryResolvedItems.push({
          ...item,
          format: inventoryPlan.normalizedFormat || '',
          packaging_inventory_id: packagingInventoryId,
        });
      }

      const itemsToInsert = normalizeInvoiceItemsForInsert(invoice.id, inventoryResolvedItems);

      await supabase.from('purchase_invoice_items').insert(itemsToInsert);

      if (paymentCondition === 'credit') {
        const totals = calculateInvoiceTotals(lineItems);
        await supabase.from('accounts_payable').insert([
          {
            invoice_id: invoice.id,
            supplier_id: supplierId,
            amount_due: totals.totalAmount,
            amount_paid: 0,
            due_date: getCreditDueDate(invoiceDate, creditDays),
            status: 'pending',
          },
        ]);
      }

      alert('Factura registrada exitosamente');
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert(getErrorMessage(error));
    }
  };

  const resetForm = () => {
    setSupplierId('');
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setPaymentCondition('cash');
    setCreditDays(30);
    setNotes('');
    setLineItems([EMPTY_LINE_ITEM]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totals = calculateInvoiceTotals(lineItems);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Facturas de Compra</h2>
          <p className="text-[#10b981] mt-1 font-medium">Registro de facturas con múltiples ítems</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Factura</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-6">Registrar Factura de Compra</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proveedor</label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Seleccionar...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.business_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">N° Factura</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="F-00123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Fecha</label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Condición de Pago</label>
                <select
                  value={paymentCondition}
                  onChange={(e) => setPaymentCondition(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="cash">Contado</option>
                  <option value="credit">Crédito</option>
                </select>
              </div>

              {paymentCondition === 'credit' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Días de Crédito</label>
                  <input
                    type="number"
                    min="1"
                    value={creditDays}
                    onChange={(e) => setCreditDays(parseInt(e.target.value) || 30)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              )}
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-white">Ítems de la Factura</h4>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Ítem</span>
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                        <select
                          value={item.item_type}
                          onChange={(e) => updateLineItem(index, 'item_type', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                        >
                          <option value="envase">Envase</option>
                          <option value="tapa">Tapa</option>
                          <option value="gatillo">Gatillo</option>
                          <option value="etiqueta">Etiqueta</option>
                          <option value="materia_prima">Materia Prima</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => updateLineItem(index, 'item_name', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                          placeholder="Botella PET"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Formato</label>
                        <input
                          type="text"
                          value={item.format}
                          onChange={(e) => updateLineItem(index, 'format', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                          placeholder="500cc"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Cantidad</label>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Precio Unit. Neto</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price_net}
                          onChange={(e) => updateLineItem(index, 'unit_price_net', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                        />
                      </div>

                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 mb-1">Total Línea</label>
                          <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-cyan-400 text-sm font-bold">
                            {formatCurrency(item.line_total_net)}
                          </div>
                        </div>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-900/30 rounded-lg p-6 border-2 border-blue-500/50">
              <h4 className="font-bold text-blue-200 mb-4">Resumen de Factura</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal (Neto):</span>
                  <span className="font-bold text-white">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>IVA Crédito (19%):</span>
                  <span className="font-bold text-green-400">{formatCurrency(totals.vatAmount)}</span>
                </div>
                <div className="flex justify-between text-lg border-t border-blue-700 pt-2">
                  <span className="font-bold text-blue-200">Total Bruto:</span>
                  <span className="font-bold text-blue-300 text-2xl">{formatCurrency(totals.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Notas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                rows={2}
                placeholder="Observaciones adicionales"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-semibold"
              >
                <Save className="w-5 h-5" />
                <span>Guardar Factura y Actualizar Stock</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/30 to-cyan-900/30">
          <h3 className="text-lg font-bold text-white">Historial de Facturas</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">N° Factura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Condición</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Subtotal</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">IVA</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {new Date(invoice.invoice_date).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-slate-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {invoice.suppliers?.business_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.payment_condition === 'cash'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {invoice.payment_condition === 'cash' ? 'Contado' : `${invoice.credit_days}d`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-blue-700">
                    {formatCurrency(invoice.subtotal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-green-600">
                    {formatCurrency(invoice.vat_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
