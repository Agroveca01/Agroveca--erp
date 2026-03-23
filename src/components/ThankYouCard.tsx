import { Heart, Star } from 'lucide-react';

interface ThankYouCardProps {
  customerName: string;
  purchaseCount: number;
}

export default function ThankYouCard({ customerName, purchaseCount }: ThankYouCardProps) {
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
          .print-card, .print-card * {
            visibility: visible;
          }
          .print-card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
        <div className="bg-slate-900 rounded-2xl border border-amber-500 max-w-2xl w-full shadow-2xl">
          <div className="border-b border-amber-500 p-6 flex items-center justify-between bg-gradient-to-r from-amber-500/20 to-yellow-500/20">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-500 p-2 rounded-lg">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Tarjeta de Agradecimiento</h3>
            </div>
          </div>

          <div className="print-card p-8">
            <div className="w-[600px] h-[400px] border-8 border-amber-400 rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-4 right-4">
                <Star className="w-12 h-12 text-amber-400 fill-amber-400 opacity-30" />
              </div>
              <div className="absolute bottom-4 left-4">
                <Star className="w-12 h-12 text-amber-400 fill-amber-400 opacity-30" />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="text-center">
                  <img
                    src="/cuidatuplanta.webp"
                    alt="Cuida Tu Planta Logo"
                    className="h-16 w-auto object-contain mx-auto mb-6"
                  />
                </div>

                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                    <Star className="w-10 h-10 text-amber-500 fill-amber-500" />
                    <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                  </div>

                  <h1 className="text-4xl font-bold text-amber-800 mb-4">
                    ¡Gracias, {customerName}!
                  </h1>

                  <p className="text-xl text-slate-700 leading-relaxed max-w-md mx-auto">
                    Has alcanzado tu compra número <span className="font-bold text-amber-600">{purchaseCount}</span> con nosotros.
                  </p>

                  <p className="text-lg text-slate-600 leading-relaxed max-w-md mx-auto">
                    Como muestra de nuestro agradecimiento, hemos incluido un regalo especial en tu pedido.
                  </p>

                  <div className="pt-6">
                    <Heart className="w-8 h-8 text-red-500 fill-red-500 mx-auto mb-2" />
                    <p className="text-base font-semibold text-slate-700">
                      Tu confianza nos hace crecer
                    </p>
                    <p className="text-sm text-slate-600 italic">
                      Equipo Cuida Tu Planta
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="inline-block border-t-2 border-amber-400 pt-2">
                    <p className="text-xs text-slate-500">
                      www.cuidatuplanta.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-amber-500/30 flex justify-end space-x-3 no-print">
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 shadow-lg shadow-amber-500/30"
            >
              <Heart className="w-5 h-5" />
              <span>Imprimir Tarjeta</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
