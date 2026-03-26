import { RawMaterial } from './supabase';

export const normalizeManualQrCode = (manualCode: string): string => {
  return manualCode.trim();
};

export const getManualSearchMessage = (manualCode: string): string | null => {
  return normalizeManualQrCode(manualCode) ? null : 'Por favor ingresa un codigo QR';
};

export const getSearchMaterialResult = (material: RawMaterial | null): {
  message: string;
  material: RawMaterial | null;
} => {
  if (material) {
    return {
      message: 'Material encontrado',
      material,
    };
  }

  return {
    message: 'No se encontro ningun material con este codigo QR',
    material: null,
  };
};
