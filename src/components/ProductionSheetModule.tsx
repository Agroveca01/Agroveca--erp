import { useState, useEffect } from 'react';
import { Beaker, CheckCircle, XCircle, AlertTriangle, Droplet, FileText } from 'lucide-react';
import { supabase, Product, PackagingInventory, ProductionOrder } from '../lib/supabase';

const RTU_CONCENTRATE_RATIO = 0.01;

const parseFormatToLiters = (format: string): number | null => {
  const normalizedFormat = format.trim().toLowerCase();
  const numericMatch = normalizedFormat.match(/(\d+(?:[.,]\d+)?)/);

  if (!numericMatch) return null;

  const amount = parseFloat(numericMatch[1].replace(',', '.'));
  if (Number.isNaN(amount) || amount <= 0) return null;

  if (normalizedFormat.includes('cc') || normalizedFormat.includes('ml')) {
    return amount / 1000;
  }

  if (normalizedFormat.includes('l')) {
    return amount;
  }

  return null;
};

const getUnitVolumeLiters = (product: Product): number => {
  const parsedFormat = parseFormatToLiters(product.format);

  if (parsedFormat && parsedFormat > 0) {
    return parsedFormat;
  }

  return product.production_unit_liters > 0 ? product.production_unit_liters : 0;
};

const getRequiredMix = (product: Product, targetUnits: number) => {
  const totalVolumeLiters = getUnitVolumeLiters(product) * targetUnits;

  return {
    totalVolumeLiters,
    concentrateRequired: totalVolumeLiters * RTU_CONCENTRATE_RATIO,
    waterRequired: totalVolumeLiters * (1 - RTU_CONCENTRATE_RATIO),
  };
};

export default function ProductionSheetModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<PackagingInventory[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [targetUnits, setTargetUnits] = useState(24);
  const [validation, setValidation] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, inventoryData, ordersData] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('packaging_inventory').select('*'),
        supabase.from('production_orders').select('*, products(*)').order('created_at', { ascending: false }),
      ]);

      setProducts(productsData.data || []);
      setInventory(inventoryData.data || []);
      setOrders(ordersData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const validateProduction = () => {
    if (!selectedProduct || targetUnits <= 0) {
      alert('Selecciona un producto y cantidad válida');
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const format = product.format.toLowerCase();
    const mix = getRequiredMix(product, targetUnits);

    if (mix.totalVolumeLiters <= 0) {
      alert('No se pudo calcular el volumen por unidad a partir del formato del producto.');
      return;
    }

    const errors: string[] = [];

    const envase = inventory.find(
      (item) => item.item_type === 'envase' && item.format && format.includes(item.format.toLowerCase())
    );
    const tapa = inventory.find(
      (item) =>
        (item.item_type === 'tapa' || item.item_type === 'gatillo') &&
        item.format &&
        format.includes(item.format.toLowerCase())
    );
    const etiqueta = inventory.find(
      (item) => item.item_type === 'etiqueta' && item.format && format.includes(item.format.toLowerCase())
    );

    if (!envase || envase.current_stock < targetUnits) {
      errors.push(`Envases insuficientes. Necesitas ${targetUnits}, tienes ${envase?.current_stock || 0}`);
    }
    if (!tapa || tapa.current_stock < targetUnits) {
      errors.push(
        `Tapas/Gatillos insuficientes. Necesitas ${targetUnits}, tienes ${tapa?.current_stock || 0}`
      );
    }
    if (!etiqueta || etiqueta.current_stock < targetUnits) {
      errors.push(`Etiquetas insuficientes. Necesitas ${targetUnits}, tienes ${etiqueta?.current_stock || 0}`);
    }

    setValidation({
      product,
      targetUnits,
      totalVolumeLiters: mix.totalVolumeLiters,
      concentrateRequired: mix.concentrateRequired,
      waterRequired: mix.waterRequired,
      envase,
      tapa,
      etiqueta,
      errors,
      passed: errors.length === 0,
    });
  };

  const createProductionOrder = async () => {
    if (!validation || !validation.passed) {
      alert('La validación no ha pasado. Corrige los errores antes de continuar.');
      return;
    }

    try {
      const orderNumber = `PROD-${Date.now()}`;

      const { error } = await supabase
        .from('production_orders')
        .insert([
          {
            order_number: orderNumber,
            product_id: validation.product.id,
            target_units: validation.targetUnits,
            concentrate_required_liters: validation.concentrateRequired,
            water_required_liters: validation.waterRequired,
            status: 'pending',
            validation_passed: true,
            validation_errors: null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      alert(`Orden de producción ${orderNumber} creada exitosamente`);
      setValidation(null);
      setSelectedProduct('');
      setTargetUnits(24);
      loadData();
    } catch (error) {
      console.error('Error creating production order:', error);
      alert('Error al crear la orden de producción');
    }
  };

  const completeProductionOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const wasteUnits = prompt('¿Cuántas unidades se dañaron/perdieron?', '0');
    const wasteLiters = prompt('¿Cuántos litros se perdieron durante el llenado?', '0');

    if (wasteUnits === null || wasteLiters === null) return;

    const wasteUnitsValue = parseFloat(wasteUnits) || 0;
    const wasteLitersValue = parseFloat(wasteLiters) || 0;

    try {
      await supabase
        .from('production_orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          waste_units: wasteUnitsValue,
          waste_liters: wasteLitersValue,
        })
        .eq('id', orderId);

      const product = order.products;
      if (!product) return;

      const format = product.format.toLowerCase();
      const successfulUnits = Math.max(0, order.target_units - wasteUnitsValue);
      const successfulLiters = Math.max(
        0,
        order.concentrate_required_liters + order.water_required_liters - wasteLitersValue,
      );

      const envase = inventory.find(
        (item) => item.item_type === 'envase' && item.format && format.includes(item.format.toLowerCase())
      );
      const tapa = inventory.find(
        (item) =>
          (item.item_type === 'tapa' || item.item_type === 'gatillo') &&
          item.format &&
          format.includes(item.format.toLowerCase())
      );
      const etiqueta = inventory.find(
        (item) => item.item_type === 'etiqueta' && item.format && format.includes(item.format.toLowerCase())
      );

      const consumePackagingInventory = async (
        packagingItem: PackagingInventory | undefined,
        itemLabel: string,
      ) => {
        if (!packagingItem) return;

        await supabase
          .from('packaging_inventory')
          .update({ current_stock: Math.max(0, packagingItem.current_stock - order.target_units) })
          .eq('id', packagingItem.id);

        await supabase.from('inventory_movements').insert([
          {
            packaging_inventory_id: packagingItem.id,
            movement_type: 'salida',
            quantity: -order.target_units,
            reference_id: orderId,
            reference_type: 'production_order',
            notes: `${itemLabel} usado en orden ${order.order_number}`,
          },
        ]);
      };

      await consumePackagingInventory(envase, 'Envases');
      await consumePackagingInventory(tapa, 'Tapas/Gatillos');
      await consumePackagingInventory(etiqueta, 'Etiquetas');

      const batchNumber = `BATCH-${product.product_id}-${Date.now()}`;

      await supabase.from('production_batches').insert([
        {
          product_id: product.id,
          batch_number: batchNumber,
          quantity_liters: successfulLiters,
          units_produced: successfulUnits,
          raw_material_cost: 0,
          packaging_cost: 0,
          total_cost: 0,
          cost_per_unit: 0,
          notes: `Generado desde orden ${order.order_number}. Lote RTU producido - ${successfulUnits} unidades`,
        },
      ]);

      alert(`Orden completada. ${successfulUnits} unidades producidas exitosamente.`);
      loadData();
    } catch (error) {
      console.error('Error completing production order:', error);
      alert('Error al completar la orden');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Hoja de Ruta de Producción</h2>
          <p className="text-[#10b981] mt-1 font-medium">Calculador de lote RTU con validación de insumos</p>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Beaker className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-white">Calculador de Lote RTU</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Producto a Fabricar</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white font-semibold"
            >
              <option value="">Seleccionar producto...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.format}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Unidades a Producir</label>
            <input
              type="number"
              min="1"
              step="1"
              value={targetUnits}
              onChange={(e) => setTargetUnits(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white font-semibold"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={validateProduction}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all font-semibold"
          >
            Validar Insumos y Calcular Mezcla
          </button>
        </div>
      </div>

      {validation && (
        <div
          className={`rounded-xl shadow-2xl border-2 p-6 ${
            validation.passed
              ? 'bg-green-900/30 border-green-500'
              : 'bg-red-900/30 border-red-500'
          }`}
        >
          <div className="flex items-start space-x-3 mb-6">
            {validation.passed ? (
              <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`text-2xl font-bold ${validation.passed ? 'text-green-200' : 'text-red-200'}`}>
                {validation.passed ? 'Validación Exitosa - Listo para Producir' : 'Validación Fallida'}
              </h3>
              <p className={`text-sm mt-1 ${validation.passed ? 'text-green-300' : 'text-red-300'}`}>
                {validation.passed
                  ? 'Todos los insumos están disponibles'
                  : 'Faltan insumos críticos para iniciar la producción'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-800/70 rounded-lg p-5 border border-slate-600">
              <h4 className="font-bold text-cyan-300 mb-3 flex items-center space-x-2">
                <Droplet className="w-5 h-5" />
                <span>Requerimientos de Líquido</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Concentrado necesario:</span>
                  <span className="font-bold text-cyan-400">{validation.concentrateRequired.toFixed(3)} L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Agua desmineralizada:</span>
                  <span className="font-bold text-blue-400">{validation.waterRequired.toFixed(2)} L</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/70 rounded-lg p-5 border border-slate-600">
              <h4 className="font-bold text-purple-300 mb-3">Insumos de Envasado</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Envases:</span>
                  <span
                    className={`font-bold ${validation.envase && validation.envase.current_stock >= validation.targetUnits ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {validation.envase?.current_stock || 0} / {validation.targetUnits}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Tapas/Gatillos:</span>
                  <span
                    className={`font-bold ${validation.tapa && validation.tapa.current_stock >= validation.targetUnits ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {validation.tapa?.current_stock || 0} / {validation.targetUnits}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Etiquetas:</span>
                  <span
                    className={`font-bold ${validation.etiqueta && validation.etiqueta.current_stock >= validation.targetUnits ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {validation.etiqueta?.current_stock || 0} / {validation.targetUnits}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!validation.passed && (
            <div className="bg-red-800/50 rounded-lg p-5 mb-6">
              <h4 className="font-bold text-red-200 mb-3 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Errores de Validación</span>
              </h4>
              <ul className="space-y-2">
                {validation.errors.map((error: string, index: number) => (
                  <li key={index} className="text-sm text-red-200 flex items-start space-x-2">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validation.passed && (
            <>
              <div className="bg-blue-900/50 rounded-lg p-5 mb-6">
                <h4 className="font-bold text-blue-200 mb-3 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Protocolo de Mezcla (Paso a Paso)</span>
                </h4>
                <ol className="space-y-3 text-sm text-blue-100">
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-300 flex-shrink-0">1.</span>
                    <span>Disolver conservantes (Benzoato/Sorbato) en agua tibia</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-300 flex-shrink-0">2.</span>
                    <span>Añadir {validation.concentrateRequired.toFixed(3)} L de Concentrado al tanque</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-300 flex-shrink-0">3.</span>
                    <span>Completar con {validation.waterRequired.toFixed(2)} L de Agua Desmineralizada</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-300 flex-shrink-0">4.</span>
                    <span>Ajustar pH a 5.2 con ácido cítrico si es necesario</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-300 flex-shrink-0">5.</span>
                    <span>Aplicar filtrado de seguridad antes de envasar</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-300 flex-shrink-0">6.</span>
                    <span>Envasar inmediatamente en los {validation.targetUnits} envases preparados</span>
                  </li>
                </ol>
              </div>

              <button
                onClick={createProductionOrder}
                className="w-full px-6 py-4 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-bold text-lg shadow-lg"
              >
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-6 h-6" />
                  <span>Crear Orden de Producción</span>
                </div>
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-900/30 to-indigo-900/30">
          <h3 className="text-lg font-bold text-white">Órdenes de Producción</h3>
          <p className="text-sm text-purple-400 mt-1">Historial y seguimiento de lotes</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Unidades</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Concentrado (L)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{order.products?.name}</div>
                    <div className="text-xs text-slate-500">{order.products?.format}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-slate-900">
                    {order.target_units}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-700">
                    {order.concentrate_required_liters.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status === 'completed' ? 'Completada' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => completeProductionOrder(order.id)}
                        className="px-3 py-1 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] text-xs font-semibold"
                      >
                        Completar
                      </button>
                    )}
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
