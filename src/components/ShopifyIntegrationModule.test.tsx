// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ShopifyIntegrationModule from './ShopifyIntegrationModule';

const mockAlert = vi.fn();
const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
const expectedWebhookAddress = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-webhook`;

vi.stubGlobal('alert', mockAlert);

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
    mockAlert.mockReset();
    clipboardWriteText.mockResolvedValue(undefined);
    mockInvoke.mockImplementation((functionName?: string) => {
      if (functionName === 'shopify-locations') {
        return Promise.resolve({ data: { locations: [] }, error: null });
      }

      if (functionName === 'shopify-webhook-status') {
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

      if (table === 'shopify_webhook_events') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue(createQueryBuilder({ data: null, error: null })),
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

      if (functionName === 'shopify-webhook-status') {
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
      if (functionName === 'shopify-webhook-status') {
        return Promise.resolve({
          data: {
            webhooks: [
              {
                id: '1',
                topic: 'orders/create',
                address: expectedWebhookAddress,
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

  it('muestra eventos recientes del webhook cuando existen', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'shopify_config') {
        return {
          select: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
          update: vi.fn().mockReturnValue(createQueryBuilder({ data: null, error: null })),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }

      if (table === 'shopify_webhook_events') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'evt-1',
                    topic: 'orders/create',
                    status: 'processed',
                    shop_domain: 'agroveca.myshopify.com',
                    http_status: 200,
                    error_message: null,
                    created_at: '2026-03-31T20:48:38.076Z',
                    processed_at: '2026-03-31T20:48:38.500Z',
                  },
                ],
                error: null,
              }),
            }),
          }),
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

    render(<ShopifyIntegrationModule />);

    expect(await screen.findByText(/Eventos recientes del Webhook/i)).toBeInTheDocument();
    expect(screen.getAllByText('orders/create').length).toBeGreaterThan(0);
    expect(screen.getByText('processed')).toBeInTheDocument();
    expect(screen.getByText('agroveca.myshopify.com')).toBeInTheDocument();
    expect(screen.getByText('Procesado correctamente')).toBeInTheDocument();
  });

  it('permite registrar el webhook orders/create desde el panel', async () => {
    mockInvoke.mockImplementation((functionName?: string) => {
      if (functionName === 'shopify-webhook-status') {
        return Promise.resolve({ data: { webhooks: [] }, error: null });
      }

      if (functionName === 'shopify-webhook-sync') {
        return Promise.resolve({ data: { action: 'created' }, error: null });
      }

      if (functionName === 'shopify-locations') {
        return Promise.resolve({ data: { locations: [] }, error: null });
      }

      return Promise.resolve({ data: { unmapped: [] }, error: null });
    });

    render(<ShopifyIntegrationModule />);

    const button = await screen.findByRole('button', { name: 'Registrar webhook' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('shopify-webhook-sync', {
        method: 'POST',
        body: {
          expected_address: expectedWebhookAddress,
        },
      });
      expect(mockAlert).toHaveBeenCalledWith('Webhook orders/create creado correctamente');
    });

    expect(mockInvoke).toHaveBeenCalledWith('shopify-webhook-status', { method: 'GET' });
  });

  it('traduce errores de permisos de Shopify al registrar webhook', async () => {
    mockInvoke.mockImplementation((functionName?: string) => {
      if (functionName === 'shopify-webhook-status') {
        return Promise.resolve({ data: { webhooks: [] }, error: null });
      }

      if (functionName === 'shopify-webhook-sync') {
        return Promise.resolve({
          data: null,
          error: {
            message: 'Failed to create webhook: Invalid topic specified: orders/create. Does it exist? Is there a missing access scope? Topics allowed: products/create',
          },
        });
      }

      return Promise.resolve({ data: { unmapped: [] }, error: null });
    });

    render(<ShopifyIntegrationModule />);

    fireEvent.click(await screen.findByRole('button', { name: 'Registrar webhook' }));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Shopify rechazo el webhook porque la app no tiene permisos de pedidos. Revisa el scope `read_orders` y vuelve a autorizar la app.'
      );
    });
  });

  it('permite reparar el webhook cuando apunta a otra URL', async () => {
    mockInvoke.mockImplementation((functionName?: string) => {
      if (functionName === 'shopify-webhook-status') {
        return Promise.resolve({
          data: {
            webhooks: [
              {
                id: '1',
                topic: 'orders/create',
                address: 'https://wrong.example/functions/v1/shopify-webhook',
                api_version: '2026-01',
              },
            ],
          },
          error: null,
        });
      }

      if (functionName === 'shopify-webhook-sync') {
        return Promise.resolve({ data: { action: 'updated' }, error: null });
      }

      if (functionName === 'shopify-locations') {
        return Promise.resolve({ data: { locations: [] }, error: null });
      }

      return Promise.resolve({ data: { unmapped: [] }, error: null });
    });

    render(<ShopifyIntegrationModule />);

    expect(await screen.findByText(/Webhook orders\/create detectado, pero apunta a otra URL/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reparar webhook' }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('shopify-webhook-sync', {
        method: 'POST',
        body: {
          expected_address: expectedWebhookAddress,
        },
      });
      expect(mockAlert).toHaveBeenCalledWith('Webhook orders/create actualizado correctamente');
    });
  });

  it('muestra mensajes operativos para fallos de inventario del webhook', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'shopify_config') {
        return {
          select: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
          update: vi.fn().mockReturnValue(createQueryBuilder({ data: null, error: null })),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }

      if (table === 'shopify_webhook_events') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'evt-2',
                    topic: 'orders/create',
                    status: 'failed',
                    shop_domain: 'agroveca.myshopify.com',
                    http_status: 500,
                    error_message: 'No ERP product linked to Shopify variant gid://shopify/ProductVariant/2001',
                    created_at: '2026-03-31T20:48:38.076Z',
                    processed_at: '2026-03-31T20:48:38.500Z',
                  },
                ],
                error: null,
              }),
            }),
          }),
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

      if (table === 'shopify_orders') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'ord-1',
                    order_number: '1010',
                    total_amount: 10000,
                    commission_amount: 200,
                    net_amount: 9800,
                    created_at: '2026-03-31T20:48:38.076Z',
                    inventory_processed_at: null,
                    inventory_processing_error: 'No ERP product linked to Shopify variant gid://shopify/ProductVariant/2001',
                  },
                ],
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue(createQueryBuilder({ data: null, error: null })),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }

      return {
        select: vi.fn().mockReturnValue(createQueryBuilder({ data: [], error: null })),
        update: vi.fn().mockReturnValue(createQueryBuilder({ data: null, error: null })),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<ShopifyIntegrationModule />);

    expect(await screen.findByText(/Pedidos Shopify con observaciones/i)).toBeInTheDocument();
    expect(screen.getByText(/Hay una variante de Shopify sin vincular a un producto del ERP/i)).toBeInTheDocument();
    expect(screen.getByText(/Pedido #1010/i)).toBeInTheDocument();
  });
});
