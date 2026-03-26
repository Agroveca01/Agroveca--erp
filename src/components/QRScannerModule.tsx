import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { QrCode, X, Search, CheckCircle } from 'lucide-react';
import { getManualSearchMessage, getSearchMaterialResult, normalizeManualQrCode } from '../lib/qrScannerHelpers';
import { supabase, RawMaterial } from '../lib/supabase';

interface QRScannerModuleProps {
  onClose: () => void;
  onMaterialFound: (material: RawMaterial) => void;
}

export default function QRScannerModule({ onClose, onMaterialFound }: QRScannerModuleProps) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [message, setMessage] = useState('');
  const [material, setMaterial] = useState<RawMaterial | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerInitialized = useRef(false);

  const onScanError = (error: string) => {
    console.log(error);
  };

  const searchMaterial = useCallback(async (qrCode: string) => {
    setMessage('Buscando material...');
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('qr_code', qrCode)
        .maybeSingle();

      if (error) throw error;

      const result = getSearchMaterialResult(data);
      setMaterial(result.material);
      setMessage(result.message);

      if (result.material) {
        onMaterialFound(result.material);
      }
    } catch (error) {
      console.error('Error searching material:', error);
      setMessage('Error al buscar el material');
    }
  }, [onMaterialFound]);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerInitialized.current = false;
    }
    setScanning(false);
    await searchMaterial(decodedText);
  }, [searchMaterial]);

  useEffect(() => {
    if (scanning && !scannerInitialized.current) {
      scannerInitialized.current = true;
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        },
        false
      );

      scanner.render(onScanSuccess, onScanError);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerInitialized.current = false;
      }
    };
  }, [onScanSuccess, scanning]);

  const handleManualSearch = () => {
    const validationMessage = getManualSearchMessage(manualCode);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    searchMaterial(normalizeManualQrCode(manualCode));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="bg-[#10b981] p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <QrCode className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">Escanear QR</h3>
                <p className="text-white/90 text-sm">Busca materias primas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {!scanning ? (
            <>
              <button
                onClick={() => setScanning(true)}
                className="w-full bg-[#10b981] text-white py-3 rounded-lg hover:bg-[#059669] transition-colors font-medium flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                Activar Cámara
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">o ingresa manualmente</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Código QR
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]"
                    placeholder="Pega el código aquí"
                  />
                  <button
                    onClick={handleManualSearch}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
              <button
                onClick={() => {
                  if (scannerRef.current) {
                    scannerRef.current.clear().catch(console.error);
                    scannerInitialized.current = false;
                  }
                  setScanning(false);
                }}
                className="w-full mt-4 bg-slate-600 text-white py-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancelar Escaneo
              </button>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              material
                ? 'bg-[#10b981]/10 border border-[#10b981]/30'
                : 'bg-slate-50 border border-slate-200'
            }`}>
              {material && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className={`text-sm font-medium ${material ? 'text-emerald-900' : 'text-slate-900'}`}>
                  {message}
                </p>
                {material && (
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <p><span className="font-medium">Material:</span> {material.name}</p>
                    <p><span className="font-medium">Stock:</span> {material.stock_quantity} {material.unit}</p>
                    <p><span className="font-medium">Categoría:</span> {material.category}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
            <p className="font-medium mb-2">Instrucciones:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Activa la cámara de tu dispositivo</li>
              <li>Apunta al código QR del bidón</li>
              <li>El sistema abrirá automáticamente la ficha del material</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
