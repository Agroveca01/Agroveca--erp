import { describe, expect, it } from 'vitest';

import { getManualSearchMessage, getSearchMaterialResult, normalizeManualQrCode } from './qrScannerHelpers';

describe('qrScannerHelpers', () => {
  it('trims manual QR codes before searching', () => {
    expect(normalizeManualQrCode('  ABC-123  ')).toBe('ABC-123');
  });

  it('requires a non-empty QR code for manual search', () => {
    expect(getManualSearchMessage('   ')).toBe('Por favor ingresa un codigo QR');
    expect(getManualSearchMessage('ABC-123')).toBeNull();
  });

  it('returns the expected search result message for found and missing materials', () => {
    const material = {
      id: 'rm1',
      name: 'Alcohol Isopropilico',
      category: 'chemical' as const,
      unit: 'l',
      current_cost: 3500,
      stock_quantity: 12,
      min_stock_alert: 2,
    };

    expect(getSearchMaterialResult(material)).toEqual({
      message: 'Material encontrado',
      material,
    });

    expect(getSearchMaterialResult(null)).toEqual({
      message: 'No se encontro ningun material con este codigo QR',
      material: null,
    });
  });
});
