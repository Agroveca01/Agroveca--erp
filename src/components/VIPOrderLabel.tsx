import { Star, Gift, Package } from 'lucide-react';

interface VIPOrderLabelProps {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  address: string;
  items: Array<{
    name: string;
    quantity: number;
    sku?: string;
  }>;
  orderDate: string;
}

export default function VIPOrderLabel({
  orderNumber,
  customerName,
  customerEmail,
  address,
  items,
  orderDate
}: VIPOrderLabelProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
        <div className="bg-slate-900 rounded-2xl border border-amber-500 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="border-b border-amber-500 p-6 flex items-center justify-between bg-gradient-to-r from-amber-500/20 to-yellow-500/20">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-500 p-2 rounded-lg">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Pedido VIP - Orden #{orderNumber}</h3>
                <p className="text-amber-400 font-semibold">¡Cliente Nivel 10! - Incluir Regalo de Lealtad</p>
              </div>
            </div>
          </div>

          <div className="print-area p-8">
            <div className="border-8 border-amber-500 rounded-xl p-8 bg-white">
              <div className="flex items-center justify-between mb-8 pb-6 border-b-4 border-amber-500">
                <img
                  src="/cuidatuplanta.webp"
                  alt="Cuida Tu Planta Logo"
                  className="h-20 w-auto object-contain"
                />
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-2 mb-2">
                    <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                    <span className="text-3xl font-bold text-amber-600">VIP</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">Orden #{orderNumber}</p>
                  <p className="text-sm text-slate-600">{orderDate}</p>
                </div>
              </div>

              <div className="bg-amber-50 border-4 border-amber-400 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Gift className="w-8 h-8 text-amber-600" />
                  <h2 className="text-2xl font-bold text-amber-700">¡CLIENTE VIP: INCLUIR REGALO NIVEL 10!</h2>
                </div>
                <p className="text-amber-800 font-semibold text-lg">
                  Este cliente ha alcanzado su 10ma compra. Por favor incluir regalo especial de lealtad.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-300">
                  <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase">Información del Cliente</h3>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-slate-900">{customerName}</p>
                    <p className="text-sm text-slate-700">{customerEmail}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-300">
                  <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase">Dirección de Envío</h3>
                  <p className="text-sm text-slate-900 leading-relaxed">{address}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-300 mb-6">
                <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>Items del Pedido</span>
                </h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-2 px-2 text-sm font-bold text-slate-700">Producto</th>
                      <th className="text-left py-2 px-2 text-sm font-bold text-slate-700">SKU</th>
                      <th className="text-center py-2 px-2 text-sm font-bold text-slate-700">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-slate-200">
                        <td className="py-3 px-2 text-sm text-slate-900 font-medium">{item.name}</td>
                        <td className="py-3 px-2 text-sm text-slate-700">{item.sku || '-'}</td>
                        <td className="py-3 px-2 text-sm text-slate-900 text-center font-semibold">{item.quantity}</td>
                      </tr>
                    ))}
                    <tr className="bg-amber-100 border-2 border-amber-400">
                      <td className="py-3 px-2 text-sm text-amber-900 font-bold flex items-center space-x-2">
                        <Gift className="w-5 h-5 text-amber-600" />
                        <span>REGALO DE LEALTAD VIP</span>
                      </td>
                      <td className="py-3 px-2 text-sm text-amber-700">GIFT-VIP10</td>
                      <td className="py-3 px-2 text-sm text-amber-900 text-center font-bold">1</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center space-x-4 pt-6 border-t-4 border-amber-500">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                <p className="text-center text-sm text-slate-600 font-semibold">
                  Gracias por confiar en Cuida Tu Planta
                </p>
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-amber-500/30 flex justify-end space-x-3 no-print">
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 shadow-lg shadow-amber-500/30"
            >
              <Package className="w-5 h-5" />
              <span>Imprimir Etiqueta VIP</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
