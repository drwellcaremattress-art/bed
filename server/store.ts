import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  CreateBedPayload,
  Order,
  OrderStatus,
  PlaceOrderPayload,
  StockMovement,
  WoodBedProduct,
} from '../src/types/inventory.ts';
import { SEED_MOVEMENTS, SEED_ORDERS, SEED_PRODUCTS } from '../src/data/seedCatalog.ts';

export interface StoreData {
  products: WoodBedProduct[];
  orders: Order[];
  movements: StockMovement[];
}

const DEFAULT_STORE_PATH = path.resolve(process.cwd(), 'data', 'store.json');

export function loadStore(storePath = DEFAULT_STORE_PATH): StoreData {
  if (!fs.existsSync(storePath)) {
    const initial: StoreData = {
      products: structuredClone(SEED_PRODUCTS),
      orders: structuredClone(SEED_ORDERS),
      movements: structuredClone(SEED_MOVEMENTS),
    };
    saveStore(initial, storePath);
    return initial;
  }
  const raw = fs.readFileSync(storePath, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<StoreData>;
  return {
    products: Array.isArray(parsed.products) ? parsed.products : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    movements: Array.isArray(parsed.movements) ? parsed.movements : [],
  };
}

export function saveStore(data: StoreData, storePath = DEFAULT_STORE_PATH): void {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  const tmpPath = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, storePath);
}

export function createProductRecord(store: StoreData, payload: CreateBedPayload): WoodBedProduct {
  const productId = `prod-${crypto.randomUUID().slice(0, 8)}`;
  const slug = `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;
  const product: WoodBedProduct = {
    id: productId,
    slug,
    name: payload.name.trim(),
    collection: payload.collection,
    woodSpecies: payload.woodSpecies.trim(),
    timberOrigin: payload.timberOrigin.trim(),
    joineryMethod: payload.joineryMethod.trim(),
    finishType: payload.finishType.trim(),
    leadTimeDays: Math.max(1, Math.round(payload.leadTimeDays || 8)),
    description: payload.description.trim(),
    imageUrl: payload.imageUrl.trim(),
    isFeatured: true,
    createdAt: new Date().toISOString(),
    specs: payload.specs,
    variants: payload.variants.map((v) => ({
      id: `var-${crypto.randomUUID().slice(0, 8)}`,
      productId,
      sku: v.sku.trim().toUpperCase(),
      sizeLabel: v.sizeLabel,
      dimensionsIn: v.dimensionsIn.trim(),
      weightLbs: Math.max(1, Math.round(v.weightLbs || 100)),
      priceCents: Math.max(100, Math.round(v.priceCents)),
      stockQuantity: Math.max(0, Math.floor(v.stockQuantity || 0)),
      reorderThreshold: Math.max(0, Math.floor(v.reorderThreshold || 3)),
    })),
  };

  store.products.unshift(product);
  return product;
}

export function deleteProductRecord(store: StoreData, productId: string): boolean {
  const idx = store.products.findIndex((p) => p.id === productId);
  if (idx === -1) return false;
  store.products.splice(idx, 1);
  return true;
}

export function adjustVariantStock(
  store: StoreData,
  params: {
    variantId: string;
    delta?: number;
    exactQuantity?: number;
    reason?: string;
    referenceId?: string;
  }
): StockMovement {
  for (const product of store.products) {
    const variant = product.variants.find((v) => v.id === params.variantId);
    if (!variant) continue;

    const prevStock = variant.stockQuantity;
    const nextStock =
      typeof params.exactQuantity === 'number'
        ? Math.max(0, Math.floor(params.exactQuantity))
        : Math.max(0, prevStock + Math.trunc(params.delta || 0));

    variant.stockQuantity = nextStock;

    const movement: StockMovement = {
      id: `mov-${crypto.randomUUID().slice(0, 8)}`,
      variantId: variant.id,
      sku: variant.sku,
      productName: product.name,
      sizeLabel: variant.sizeLabel,
      delta: nextStock - prevStock,
      previousStock: prevStock,
      newStock: nextStock,
      reason: params.reason?.trim() || 'Manual Inventory Adjustment',
      referenceId: params.referenceId?.trim() || 'ADMIN',
      createdAt: new Date().toISOString(),
    };
    store.movements.unshift(movement);
    return movement;
  }
  throw new Error('Variant not found');
}

export function updateVariantPricingRecord(
  store: StoreData,
  variantId: string,
  priceCents: number,
  reorderThreshold: number
): void {
  for (const product of store.products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) continue;
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      throw new Error('Price must be a positive amount.');
    }
    variant.priceCents = Math.round(priceCents);
    variant.reorderThreshold = Math.max(0, Math.floor(reorderThreshold));
    return;
  }
  throw new Error('Variant not found');
}

export function placeOrderRecord(store: StoreData, payload: PlaceOrderPayload): Order {
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('Order must contain at least one solid wood frame.');
  }

  const resolved: Array<{
    product: WoodBedProduct;
    variant: WoodBedProduct['variants'][number];
    quantity: number;
  }> = [];

  for (const item of payload.items) {
    const qty = Math.floor(Number(item.quantity));
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error('Quantity must be at least 1.');
    }
    let found: (typeof resolved)[number] | null = null;
    for (const product of store.products) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (variant) {
        found = { product, variant, quantity: qty };
        break;
      }
    }
    if (!found) throw new Error('Selected bed variant was not found.');
    if (found.variant.stockQuantity < qty) {
      throw new Error(
        `Insufficient stock for ${found.product.name} (${found.variant.sizeLabel}) — only ${found.variant.stockQuantity} available.`
      );
    }
    resolved.push(found);
  }

  const subtotalCents = resolved.reduce(
    (sum, r) => sum + r.variant.priceCents * r.quantity,
    0
  );
  // Complimentary across Tamil Nadu for orders >= ₹50,000 (5,000,000 paise), else ₹1,800
  const deliveryCents = subtotalCents >= 5000000 ? 0 : 180000;
  const totalCents = subtotalCents + deliveryCents;
  const orderId = `ord-${crypto.randomUUID().slice(0, 8)}`;
  const orderNumber = `AM-${Math.floor(1000 + crypto.randomInt(9000))}`;
  const now = new Date().toISOString();

  const order: Order = {
    id: orderId,
    orderNumber,
    customerName: payload.customerName.trim(),
    customerEmail: payload.customerEmail.trim(),
    customerPhone: payload.customerPhone.trim(),
    shippingAddress: payload.shippingAddress.trim(),
    postalCode: payload.postalCode.trim(),
    paymentMethod: payload.paymentMethod,
    status: 'Confirmed',
    subtotalCents,
    deliveryCents,
    totalCents,
    notes: (payload.notes || '').trim(),
    createdAt: now,
    items: resolved.map((r) => ({
      id: `oi-${crypto.randomUUID().slice(0, 8)}`,
      orderId,
      productId: r.product.id,
      variantId: r.variant.id,
      productName: r.product.name,
      sizeLabel: r.variant.sizeLabel,
      sku: r.variant.sku,
      quantity: r.quantity,
      unitPriceCents: r.variant.priceCents,
    })),
  };

  for (const r of resolved) {
    const prevStock = r.variant.stockQuantity;
    const nextStock = prevStock - r.quantity;
    r.variant.stockQuantity = nextStock;
    store.movements.unshift({
      id: `mov-${crypto.randomUUID().slice(0, 8)}`,
      variantId: r.variant.id,
      sku: r.variant.sku,
      productName: r.product.name,
      sizeLabel: r.variant.sizeLabel,
      delta: -r.quantity,
      previousStock: prevStock,
      newStock: nextStock,
      reason: 'Customer Order Sale',
      referenceId: orderNumber,
      createdAt: now,
    });
  }

  store.orders.unshift(order);
  return order;
}

export function updateOrderStatusRecord(
  store: StoreData,
  orderId: string,
  status: OrderStatus
): Order {
  const order = store.orders.find((o) => o.id === orderId);
  if (!order) throw new Error('Order not found');
  order.status = status;
  return order;
}
