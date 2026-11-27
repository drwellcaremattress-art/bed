import { supabase } from './supabase.ts';
import storeFallback from '../../data/store.json';
import type {
  BedVariant,
  CreateBedPayload,
  Order,
  OrderStatus,
  PlaceOrderPayload,
  StockMovement,
  WoodBedProduct,
} from '../types/inventory.ts';

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options?.headers || {}),
    },
    ...options,
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Unexpected response type (${res.status})`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

function mapSupabaseProduct(row: Record<string, unknown>): WoodBedProduct {
  const variantsRaw = Array.isArray(row.product_variants) ? row.product_variants : [];
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    collection: row.collection as WoodBedProduct['collection'],
    woodSpecies: String(row.wood_species),
    timberOrigin: String(row.timber_origin),
    joineryMethod: String(row.joinery_method),
    finishType: String(row.finish_type),
    leadTimeDays: Number(row.lead_time_days),
    description: String(row.description),
    imageUrl: String(row.image_url),
    isFeatured: Boolean(row.is_featured),
    createdAt: String(row.created_at),
    specs: row.specs ? (row.specs as WoodBedProduct['specs']) : undefined,
    variants: variantsRaw.map((v: Record<string, unknown>) => ({
      id: String(v.id),
      productId: String(v.product_id),
      sku: String(v.sku),
      sizeLabel: v.size_label as BedVariant['sizeLabel'],
      dimensionsIn: String(v.dimensions_in),
      weightLbs: Number(v.weight_lbs),
      priceCents: Number(v.price_cents),
      stockQuantity: Number(v.stock_quantity),
      reorderThreshold: Number(v.reorder_threshold),
    })),
  };
}

export const storeApi = {
  async listProducts(): Promise<WoodBedProduct[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map((row) => mapSupabaseProduct(row as Record<string, unknown>));
    }
    if (
      import.meta.env.VITE_STATIC_CATALOG === '1' ||
      (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app'))
    ) {
      return storeFallback.products as WoodBedProduct[];
    }
    try {
      const data = await apiJson<WoodBedProduct[]>('/api/products');
      return Array.isArray(data) ? data : (storeFallback.products as WoodBedProduct[]);
    } catch {
      return storeFallback.products as WoodBedProduct[];
    }
  },

  async createProduct(payload: CreateBedPayload): Promise<WoodBedProduct> {
    if (supabase) {
      const slug = `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
      const { data: prod, error: prodErr } = await supabase
        .from('products')
        .insert({
          slug,
          name: payload.name,
          collection: payload.collection,
          wood_species: payload.woodSpecies,
          timber_origin: payload.timberOrigin,
          joinery_method: payload.joineryMethod,
          finish_type: payload.finishType,
          lead_time_days: payload.leadTimeDays,
          description: payload.description,
          image_url: payload.imageUrl,
          specs: payload.specs || {
            headSideHeightIn: '40"',
            legSideHeightIn: '20"',
            sideBarSize: '5" × 2"',
            legThickness: '4" × 4"',
            baseSpec: '18 mm Solid Hardwood Slats / Deck Base',
            crossBarsCount: 4,
          },
        })
        .select()
        .single();
      if (prodErr || !prod) throw new Error(prodErr?.message || 'Failed to create bed product');

      const variantInserts = payload.variants.map((v) => ({
        product_id: prod.id,
        sku: v.sku.toUpperCase(),
        size_label: v.sizeLabel,
        dimensions_in: v.dimensionsIn,
        weight_lbs: v.weightLbs,
        price_cents: v.priceCents,
        stock_quantity: v.stockQuantity,
        reorder_threshold: v.reorderThreshold,
      }));
      const { data: vars, error: varErr } = await supabase
        .from('product_variants')
        .insert(variantInserts)
        .select();
      if (varErr) throw new Error(varErr.message);

      return mapSupabaseProduct({ ...prod, product_variants: vars || [] });
    }
    return apiJson<WoodBedProduct>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteProduct(id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    await apiJson(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async adjustStock(params: {
    variantId: string;
    delta?: number;
    exactQuantity?: number;
    reason?: string;
    referenceId?: string;
  }): Promise<void> {
    if (supabase) {
      const { data: current, error: fetchErr } = await supabase
        .from('product_variants')
        .select('id, sku, size_label, stock_quantity, products(name)')
        .eq('id', params.variantId)
        .single();
      if (fetchErr || !current) throw new Error(fetchErr?.message || 'Variant not found');

      const prevStock = Number(current.stock_quantity);
      const nextStock =
        typeof params.exactQuantity === 'number'
          ? Math.max(0, Math.floor(params.exactQuantity))
          : Math.max(0, prevStock + Math.trunc(params.delta || 0));

      const { error: updErr } = await supabase
        .from('product_variants')
        .update({ stock_quantity: nextStock })
        .eq('id', params.variantId);
      if (updErr) throw new Error(updErr.message);

      const productRecord = current.products as unknown as { name: string } | null;
      await supabase.from('stock_movements').insert({
        variant_id: current.id,
        sku: current.sku,
        product_name: productRecord?.name || 'Wood Cot Frame',
        size_label: current.size_label,
        delta: nextStock - prevStock,
        previous_stock: prevStock,
        new_stock: nextStock,
        reason: params.reason || 'Manual Inventory Adjustment',
        reference_id: params.referenceId || 'ADMIN',
      });
      return;
    }
    await apiJson('/api/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async updateVariantPricing(variantId: string, priceCents: number, reorderThreshold: number): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('product_variants')
        .update({ price_cents: priceCents, reorder_threshold: reorderThreshold })
        .eq('id', variantId);
      if (error) throw new Error(error.message);
      return;
    }
    await apiJson(`/api/variants/${encodeURIComponent(variantId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ priceCents, reorderThreshold }),
    });
  },

  async listMovements(): Promise<StockMovement[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return (data || []).map((m: Record<string, unknown>) => ({
        id: String(m.id),
        variantId: String(m.variant_id),
        sku: String(m.sku),
        productName: String(m.product_name),
        sizeLabel: m.size_label as StockMovement['sizeLabel'],
        delta: Number(m.delta),
        previousStock: Number(m.previous_stock),
        newStock: Number(m.new_stock),
        reason: String(m.reason),
        referenceId: String(m.reference_id || ''),
        createdAt: String(m.created_at),
      }));
    }
    return apiJson<StockMovement[]>('/api/inventory/movements');
  },

  async listOrders(orderNumber?: string): Promise<Order[]> {
    if (supabase) {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (orderNumber?.trim()) {
        query = query.ilike('order_number', orderNumber.trim());
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map((o: Record<string, unknown>) => ({
        id: String(o.id),
        orderNumber: String(o.order_number),
        customerName: String(o.customer_name),
        customerEmail: String(o.customer_email),
        customerPhone: String(o.customer_phone),
        shippingAddress: String(o.shipping_address),
        postalCode: String(o.postal_code),
        paymentMethod: o.payment_method as Order['paymentMethod'],
        status: o.status as Order['status'],
        subtotalCents: Number(o.subtotal_cents),
        deliveryCents: Number(o.delivery_cents),
        totalCents: Number(o.total_cents),
        notes: String(o.notes || ''),
        createdAt: String(o.created_at),
        items: (Array.isArray(o.order_items) ? o.order_items : []).map((i: Record<string, unknown>) => ({
          id: String(i.id),
          orderId: String(i.order_id),
          productId: String(i.product_id),
          variantId: String(i.variant_id),
          productName: String(i.product_name),
          sizeLabel: i.size_label as Order['items'][number]['sizeLabel'],
          sku: String(i.sku),
          quantity: Number(i.quantity),
          unitPriceCents: Number(i.unit_price_cents),
        })),
      }));
    }
    if (
      import.meta.env.VITE_STATIC_CATALOG === '1' ||
      (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app'))
    ) {
      const orders = storeFallback.orders as Order[];
      if (orderNumber?.trim()) {
        const needle = orderNumber.trim().toLowerCase();
        return orders.filter((o) => o.orderNumber.toLowerCase() === needle);
      }
      return [];
    }
    const qs = orderNumber?.trim() ? `?orderNumber=${encodeURIComponent(orderNumber.trim())}` : '';
    try {
      const data = await apiJson<Order[]>(`/api/orders${qs}`);
      return Array.isArray(data) ? data : [];
    } catch {
      const orders = storeFallback.orders as Order[];
      if (orderNumber?.trim()) {
        const needle = orderNumber.trim().toLowerCase();
        return orders.filter((o) => o.orderNumber.toLowerCase() === needle);
      }
      return [];
    }
  },

  async placeOrder(payload: PlaceOrderPayload): Promise<Order> {
    if (supabase) {
      const { data, error } = await supabase.rpc('place_bed_order', {
        p_customer_name: payload.customerName,
        p_customer_email: payload.customerEmail,
        p_customer_phone: payload.customerPhone,
        p_shipping_address: payload.shippingAddress,
        p_postal_code: payload.postalCode,
        p_payment_method: payload.paymentMethod,
        p_notes: payload.notes || '',
        p_items: payload.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      });
      if (error) throw new Error(error.message);
      const created = data as { order_number: string };
      const orders = await storeApi.listOrders(created.order_number);
      if (orders[0]) return orders[0];
      throw new Error('Order created but could not be loaded.');
    }
    return apiJson<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw new Error(error.message);
      return;
    }
    await apiJson(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async checkAdminAuth(): Promise<boolean> {
    if (supabase) return true;
    if (
      import.meta.env.VITE_STATIC_CATALOG === '1' ||
      (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app'))
    ) {
      return false;
    }
    try {
      const res = await apiJson<{ authenticated: boolean }>('/api/auth/me');
      return Boolean(res.authenticated);
    } catch {
      return false;
    }
  },

  async loginAdmin(passcode: string): Promise<void> {
    await apiJson<{ authenticated: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ passcode }),
    });
  },

  async logoutAdmin(): Promise<void> {
    await apiJson('/api/auth/logout', { method: 'POST' });
  },
};
