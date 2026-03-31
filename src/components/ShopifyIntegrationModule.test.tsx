// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ShopifyIntegrationModule from './ShopifyIntegrationModule';

const {
  mockInvoke,
  mockMaybeSingle,
  mockFrom,
  mockAuthState,
} = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockFrom: vi.fn(),
  mockAuthState: {
    isAdmin: true,
    session: { access_token: 'test-jwt' },
  },
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
    from: mockFrom,
  },
}));

function createQueryBuilder(result: { data: unknown; error: unknown }) {
  return {
    maybeSingle: vi.fn().mockResolvedValue(result),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
    not: vi.fn().mockResolvedValue(result),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue(result),
    eq: vi.fn().mockResolvedValue(result),
  };
}

const mockUnmappedResponse = {
  unmapped: [
    {
      shopifyProduct: {
        id: 'gid://shopify/Product/1001',
        title: 'Producto A',
        variants: [{ id: 'gid://shopify/ProductVariant/2001', title: 'Rojo', sku: 'A-ROJO' }],
      },
      variant: { id: 'gid://shopify/ProductVariant/2001', sku: 'A-ROJO', title: 'Rojo' },
      suggestedMatch: {
        product_id: 'A-ROJO',
        name: 'Producto A ERP',
      },
    },
    {
      shopifyProduct: {
        id: 'gid://shopify/Product/1002',
        title: 'Producto B',
        variants: [{ id: 'gid://shopify/ProductVariant/2002', title: 'Azul', sku: 'B-AZUL' }],
      },
      variant: { id: 'gid://shopify/ProductVariant/2002', sku: 'B-AZUL', title: 'Azul' },
      suggestedMatch: null,
    },
  ],
};

describe('ShopifyIntegrationModule – Panel de Salud Shopify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({ data: { unmapped: [] }, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockReturnValue(
        table === 'shopify_config'
          ? { maybeSingle: mockMaybeSingle }
          : createQueryBuilder({ data: [], error: null })
      ),
      update: vi.fn().mockReturnValue(createQueryBuilder({ data: null, error: null })),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));
  });

  it('muestra loader mientras carga los productos Shopify no mapeados', async () => {
    mockInvoke.mockImplementationOnce(() => new Promise(() => {}));
    render(<ShopifyIntegrationModule />);
    await waitFor(() => {
      expect(screen.getByText(/Cargando productos desde Shopify/i)).toBeInTheDocument();
    });
  });

  it('muestra mensaje de error si falla el fetch', async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'falló!', status: 500 } });
    render(<ShopifyIntegrationModule />);
    await waitFor(() => {
      expect(screen.getByText(/Error: Error al consultar descubrimiento Shopify: falló!/i)).toBeInTheDocument();
    });
  });

  it('muestra tabla con productos y variantes no mapeados', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: mockUnmappedResponse,
      error: null,
    });
    render(<ShopifyIntegrationModule />);
    await waitFor(() => {
      expect(screen.getByText(/Salud Integración Shopify: Productos\/variantes sin mapear/i)).toBeInTheDocument();
      expect(screen.getByText('Producto A')).toBeInTheDocument();
      expect(screen.getByText('Rojo')).toBeInTheDocument();
      expect(screen.getByText('A-ROJO')).toBeInTheDocument();
      expect(screen.getByText('Producto A ERP')).toBeInTheDocument();
      expect(screen.getByText('Producto B')).toBeInTheDocument();
      expect(screen.getByText('Azul')).toBeInTheDocument();
      expect(screen.getByText('B-AZUL')).toBeInTheDocument();
      expect(screen.getByText('Sin sugerencia')).toBeInTheDocument();
    });
  });

  it('muestra mensaje de todo mapeado correctamente si el array está vacío', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { unmapped: [] },
      error: null,
    });
    render(<ShopifyIntegrationModule />);
    await waitFor(() => {
      expect(screen.getByText(/¡Todo mapeado correctamente!/i)).toBeInTheDocument();
    });
  });
});
