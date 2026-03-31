// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ShopifyIntegrationModule from './ShopifyIntegrationModule';

const clipboardWriteText = vi.fn().mockResolvedValue(undefined);

Object.defineProperty(globalThis.navigator, 'clipboard', {
  value: {
    writeText: clipboardWriteText,
  },
  configurable: true,
});

const {
  mockInvoke,
  mockMaybeSingle,
  mockFrom,
  mockAuthState,
  mockProductsUpdate,
  mockProductsEq,
  mockProductsSelectMaybeSingle,
} = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockFrom: vi.fn(),
  mockAuthState: {
    isAdmin: true,
    session: { access_token: 'test-jwt' },
  },
  mockProductsUpdate: vi.fn(),
  mockProductsEq: vi.fn(),
  mockProductsSelectMaybeSingle: vi.fn(),
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
        id: 'erp-1',
        product_id: 'A-ROJO',
        name: 'Producto A ERP',
        shopify_variant_id: null,
        shopify_product_id: null,
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
    clipboardWriteText.mockResolvedValue(undefined);
    mockInvoke.mockImplementation((functionName?: string) => {
      if (functionName === 'shopify-locations') {
        return Promise.resolve({ data: { locations: [] }, error: null });
      }

      if (functionName === 'shopify-webhooks') {
        return Promise.resolve({ data: { webhooks: [] }, error: null });
      }

      return Promise.resolve({ data: { unmapped: [] }, error: null });
    });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockProductsEq.mockResolvedValue({ data: null, error: null });
    mockProductsUpdate.mockReturnValue({ eq: mockProductsEq });
    mockProductsSelectMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'shopify_config') {
        return {
          select: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
          update: vi.fn().mockReturnValue(createQueryBuilder({ data: null, error: null })),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }

      if (table === 'products') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: mockProductsSelectMaybeSingle,
            }),
          }),
          update: mockProductsUpdate,
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }

      return {
        select: vi.fn().mockReturnValue(createQueryBuilder({ data: [], error: null })),
        update: vi.fn().mockReturnValue(createQueryBuilder({ data: null, error: null })),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });
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
      expect(screen.getByText('gid://shopify/Product/1001')).toBeInTheDocument();
      expect(screen.getByText('Rojo')).toBeInTheDocument();
      expect(screen.getByText('gid://shopify/ProductVariant/2001')).toBeInTheDocument();
      expect(screen.getByText('A-ROJO')).toBeInTheDocument();
      expect(screen.getByText('Producto A ERP')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Vincular' })[0]).toBeInTheDocument();
      expect(screen.getByText('Producto B')).toBeInTheDocument();
      expect(screen.getByText('gid://shopify/Product/1002')).toBeInTheDocument();
      expect(screen.getByText('Azul')).toBeInTheDocument();
      expect(screen.getByText('gid://shopify/ProductVariant/2002')).toBeInTheDocument();
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

  it('vincula la variante Shopify al producto ERP sugerido', async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: mockUnmappedResponse, error: null })
      .mockResolvedValueOnce({ data: { unmapped: [] }, error: null });

    render(<ShopifyIntegrationModule />);

    const button = (await screen.findAllByRole('button', { name: 'Vincular' }))[0];
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockProductsUpdate).toHaveBeenCalledWith({
        shopify_product_id: 'gid://shopify/Product/1001',
        shopify_variant_id: 'gid://shopify/ProductVariant/2001',
      });
      expect(mockProductsEq).toHaveBeenCalledWith('id', 'erp-1');
      expect(mockInvoke).toHaveBeenCalledTimes(3);
    });
  });

  it('permite copiar los IDs Shopify desde la tabla', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: mockUnmappedResponse,
      error: null,
    });

    render(<ShopifyIntegrationModule />);

    const copyButtons = await screen.findAllByRole('button', { name: 'Copiar' });
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledWith('gid://shopify/Product/1001');
      expect(screen.getByRole('button', { name: 'Copiado' })).toBeInTheDocument();
    });
  });

  it('muestra las locations de Shopify en configuracion y permite usarlas', async () => {
    mockInvoke.mockImplementation((functionName?: string) => {
      if (functionName === 'shopify-locations') {
        return Promise.resolve({
          data: {
            locations: [
              {
                id: 'gid://shopify/Location/123456789',
                legacy_id: '123456789',
                name: 'Bodega Principal',
                active: true,
              },
            ],
          },
          error: null,
        });
      }

      if (functionName === 'shopify-webhooks') {
        return Promise.resolve({ data: { webhooks: [] }, error: null });
      }

      return Promise.resolve({ data: { unmapped: [] }, error: null });
    });

    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'cfg-1',
        shop_domain: 'agroveca.myshopify.com',
        shopify_location_id: '',
        api_version: '2024-01',
        webhook_secret: 'hook',
        commission_percentage: 2,
        payment_gateway_fee: 2.5,
        is_active: true,
        last_sync_at: null,
        created_at: '2026-03-31T00:00:00.000Z',
      },
      error: null,
    });

    render(<ShopifyIntegrationModule />);

    fireEvent.click(await screen.findByRole('button', { name: 'Configurar' }));

    expect(await screen.findByText('Bodega Principal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Usar esta' }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('gid://shopify/Location/123456789')).toBeInTheDocument();
    });
  });

  it('muestra el estado del webhook orders/create cuando existe', async () => {
    mockInvoke.mockImplementation((functionName?: string) => {
      if (functionName === 'shopify-webhooks') {
        return Promise.resolve({
          data: {
            webhooks: [
              {
                id: '1',
                topic: 'orders/create',
                address: 'http://localhost:3000/functions/v1/shopify-webhook',
                api_version: '2026-01',
              },
            ],
          },
          error: null,
        });
      }

      if (functionName === 'shopify-locations') {
        return Promise.resolve({ data: { locations: [] }, error: null });
      }

      return Promise.resolve({ data: { unmapped: [] }, error: null });
    });

    render(<ShopifyIntegrationModule />);

    expect(await screen.findByText(/Webhook orders\/create configurado correctamente/i)).toBeInTheDocument();
  });
});
