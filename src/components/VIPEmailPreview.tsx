import { X } from 'lucide-react';

interface VIPEmailPreviewProps {
  customerName: string;
  discountCode: string;
  deliveryMode?: 'preview' | 'simulation';
  onClose: () => void;
}

export default function VIPEmailPreview({
  customerName,
  discountCode,
  deliveryMode = 'preview',
  onClose,
}: VIPEmailPreviewProps) {
  const noteText =
    deliveryMode === 'simulation'
      ? 'Esta es una simulacion del email. El sistema aun no envía correos reales desde esta acción.'
      : 'Esta es una vista previa del email. El contenido mostrado corresponde al mensaje VIP configurado.';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Vista Previa del Email VIP</h3>
            <p className="text-slate-400">Email que recibirá el cliente al alcanzar su pedido #10</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-700">
            <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-10 text-center">
              <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg">
                🌿
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                ¡Llegaste a tu décima cosecha! 🌿
              </h1>
            </div>

            <div className="bg-slate-800 p-8 text-slate-200">
              <div className="text-2xl font-bold text-lime-500 mb-5">
                ¡Hola, {customerName}!
              </div>

              <div className="space-y-4 text-base leading-relaxed text-slate-300">
                <p>Tu fidelidad hace crecer nuestra comunidad. Desde Cuida Tu Planta queremos agradecerte por ser parte de nuestra familia verde.</p>

                <p>Has alcanzado un hito muy especial: <strong className="text-lime-500">¡Tu décimo pedido!</strong> 🎉</p>

                <p>Como muestra de nuestro agradecimiento, te regalamos un descuento exclusivo del <strong className="text-lime-500">20% OFF</strong> para tu próxima compra, sin límite de monto.</p>
              </div>

              <div className="bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl p-8 text-center my-8 shadow-2xl shadow-lime-500/30">
                <div className="text-white text-sm font-semibold uppercase tracking-wider mb-3">
                  Tu Código Exclusivo
                </div>
                <div className="text-white text-4xl font-bold tracking-widest font-mono bg-black/20 rounded-lg py-4 px-6 inline-block">
                  {discountCode}
                </div>
              </div>

              <div className="text-center my-8">
                <a
                  href={`https://cuidatuplanta.cl/?discount=${discountCode}`}
                  className="inline-block bg-gradient-to-r from-lime-500 to-lime-600 text-white no-underline px-12 py-4 rounded-full text-lg font-bold shadow-xl shadow-lime-500/40 hover:shadow-lime-500/60 transition-all"
                  style={{ textDecoration: 'none' }}
                >
                  🎁 Reclamar mi Descuento
                </a>
              </div>

              <div className="bg-slate-950 border-2 border-lime-500 rounded-xl p-6 my-8">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <span className="text-2xl">✨</span>
                    <div className="flex-1">
                      <strong className="text-lime-500">20% de descuento</strong><br />
                      <span className="text-slate-400">Válido en toda tu próxima compra, sin tope de monto</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <span className="text-2xl">🎁</span>
                    <div className="flex-1">
                      <strong className="text-lime-500">Pack de Semillas de Regalo</strong><br />
                      <span className="text-slate-400">Incluido automáticamente en tu pedido</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <span className="text-2xl">⏰</span>
                    <div className="flex-1">
                      <strong className="text-lime-500">Válido por 1 año</strong><br />
                      <span className="text-slate-400">Tienes todo el tiempo del mundo para usarlo</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <span className="text-2xl">🌳</span>
                    <div className="flex-1">
                      <strong className="text-lime-500">Status Bosque VIP</strong><br />
                      <span className="text-slate-400">Ya eres parte de nuestra comunidad más especial</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-slate-400 text-sm">
                <p>Copia tu código y úsalo en tu próxima compra. También lo encontrarás guardado en tu cuenta.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-8 text-center border-t border-slate-700">
              <div className="flex justify-center space-x-6 mb-6">
                <a href="#" className="text-lime-500 hover:text-lime-400 text-2xl">Instagram</a>
                <a href="#" className="text-lime-500 hover:text-lime-400 text-2xl">Facebook</a>
                <a href="#" className="text-lime-500 hover:text-lime-400 text-2xl">WhatsApp</a>
              </div>

              <div className="text-slate-400 text-sm space-y-2">
                <p className="font-semibold text-white">Cuida Tu Planta</p>
                <p>
                  <a href="mailto:contacto@cuidatuplanta.cl" className="text-lime-500 hover:text-lime-400">
                    contacto@cuidatuplanta.cl
                  </a>
                </p>
                <p>Chile</p>
                <p className="text-xs mt-4">
                  Este correo fue enviado porque alcanzaste tu décimo pedido.<br />
                  Gracias por ser parte de nuestra comunidad verde 🌱
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-900/40 border border-blue-500/50 rounded-lg p-4">
            <p className="text-sm text-blue-200">
              <strong>Nota:</strong> {noteText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
