import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  asSafeNumber,
  asSafeString,
  clearAuthCookie,
  extractAuthFromRequest,
  requireAdmin,
  sanitizeUrl,
  setAuthCookie,
  signAuthToken,
  timingSafeCompare,
  type AuthenticatedRequest,
} from './server/auth.ts';
import {
  adjustVariantStock,
  createProductRecord,
  deleteProductRecord,
  loadStore,
  placeOrderRecord,
  saveStore,
  updateOrderStatusRecord,
  updateVariantPricingRecord,
} from './server/store.ts';
import type { BedCollection, BedSize, OrderStatus, PaymentMethod } from './src/types/inventory.ts';

const ALLOWED_COLLECTIONS: BedCollection[] = ['Platform', 'Canopy', 'Storage', 'Headboard'];
const ALLOWED_SIZES: BedSize[] = ['Single', 'Diwan', 'Queen', 'King', 'Super King'];
const ALLOWED_PAYMENT_METHODS: PaymentMethod[] = ['Card', 'UPI', 'Cash on Delivery'];
const ALLOWED_ORDER_STATUSES: OrderStatus[] = [
  'Confirmed',
  'In Joinery',
  'Dispatched',
  'Delivered',
  'Cancelled',
];

// Simple in-memory rate limiter for auth endpoints (10 attempts / 15 min per IP)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count += 1;
  return true;
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'teak-in-furnitures' });
  });

  // ---------------- ADMIN AUTH ----------------

  app.get('/api/auth/me', (req, res) => {
    const { payload } = extractAuthFromRequest(req);
    res.json({ authenticated: Boolean(payload?.role === 'admin') });
  });

  app.post('/api/auth/login', (req, res) => {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
      return;
    }

    const passcode = asSafeString(req.body?.passcode, 200);
    const configured = process.env.ADMIN_PASSCODE?.trim();
    const expected =
      configured && configured.length > 0
        ? configured
        : process.env.NODE_ENV === 'production'
          ? ''
          : 'alder-admin';

    if (!expected) {
      res.status(503).json({ error: 'ADMIN_PASSCODE is not configured on the server.' });
      return;
    }

    if (!passcode || !timingSafeCompare(passcode, expected)) {
      res.status(401).json({ error: 'Invalid workshop passcode.' });
      return;
    }

    const token = signAuthToken({ sub: 'workshop-admin', role: 'admin' });
    setAuthCookie(res, token);
    res.json({ authenticated: true });
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearAuthCookie(res);
    res.json({ ok: true });
  });

  // ---------------- PRODUCTS ----------------

  app.get('/api/products', (_req, res) => {
    const store = loadStore();
    res.json(store.products);
  });

  app.post('/api/products', requireAdmin, (req, res) => {
    try {
      const name = asSafeString(req.body?.name, 140);
      const collection = asSafeString(req.body?.collection, 40) as BedCollection;
      const woodSpecies = asSafeString(req.body?.woodSpecies, 100);
      const timberOrigin = asSafeString(req.body?.timberOrigin, 140);
      const joineryMethod = asSafeString(req.body?.joineryMethod, 140);
      const finishType = asSafeString(req.body?.finishType, 140);
      const leadTimeDays = asSafeNumber(req.body?.leadTimeDays, 8, 1, 90);
      const description = asSafeString(req.body?.description, 1000);
      const imageUrl = sanitizeUrl(req.body?.imageUrl);
      const rawVariants = Array.isArray(req.body?.variants) ? req.body.variants : [];

      if (!name || !woodSpecies || !imageUrl || rawVariants.length === 0) {
        res.status(400).json({ error: 'Name, wood species, valid image URL, and at least one variant are required.' });
        return;
      }

      const safeCollection = ALLOWED_COLLECTIONS.includes(collection) ? collection : 'Platform';
      const variants = rawVariants.map((v: Record<string, unknown>) => ({
        sku: asSafeString(v?.sku, 60) || 'TN-COT-01',
        sizeLabel: ALLOWED_SIZES.includes(v?.sizeLabel as BedSize)
          ? (v.sizeLabel as BedSize)
          : 'Queen',
        dimensionsIn: asSafeString(v?.dimensionsIn, 80) || '60" W × 78" L × 40" H',
        weightLbs: asSafeNumber(v?.weightLbs, 180, 20, 1000),
        priceCents: asSafeNumber(v?.priceCents, 5000000, 1000, 100000000),
        stockQuantity: asSafeNumber(v?.stockQuantity, 0, 0, 10000),
        reorderThreshold: asSafeNumber(v?.reorderThreshold, 3, 0, 500),
      }));

      const store = loadStore();
      const created = createProductRecord(store, {
        name,
        collection: safeCollection,
        woodSpecies,
        timberOrigin: timberOrigin || 'Tamil Nadu Timber Guild',
        joineryMethod: joineryMethod || 'Wedged mortise & tenon',
        finishType: finishType || 'Cold-pressed linseed & beeswax',
        leadTimeDays,
        description: description || `Solid ${woodSpecies} cot frame.`,
        imageUrl,
        specs: req.body?.specs,
        variants,
      });
      saveStore(store);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create bed.' });
    }
  });

  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const store = loadStore();
    const deleted = deleteProductRecord(store, asSafeString(req.params.id, 100));
    if (!deleted) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    saveStore(store);
    res.json({ ok: true });
  });

  // ---------------- INVENTORY & VARIANTS ----------------

  app.get('/api/inventory/movements', requireAdmin, (_req, res) => {
    const store = loadStore();
    res.json(store.movements.slice(0, 100));
  });

  app.post('/api/inventory/adjust', requireAdmin, (req, res) => {
    try {
      const variantId = asSafeString(req.body?.variantId, 100);
      if (!variantId) {
        res.status(400).json({ error: 'variantId is required.' });
        return;
      }
      const store = loadStore();
      const movement = adjustVariantStock(store, {
        variantId,
        delta: typeof req.body?.delta === 'number' ? req.body.delta : undefined,
        exactQuantity: typeof req.body?.exactQuantity === 'number' ? req.body.exactQuantity : undefined,
        reason: asSafeString(req.body?.reason, 160),
        referenceId: asSafeString(req.body?.referenceId, 80),
      });
      saveStore(store);
      res.json(movement);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Stock adjustment failed.' });
    }
  });

  app.patch('/api/variants/:id', requireAdmin, (req, res) => {
    try {
      const variantId = asSafeString(req.params.id, 100);
      const priceCents = asSafeNumber(req.body?.priceCents, 0, 100, 100000000);
      const reorderThreshold = asSafeNumber(req.body?.reorderThreshold, 3, 0, 500);
      const store = loadStore();
      updateVariantPricingRecord(store, variantId, priceCents, reorderThreshold);
      saveStore(store);
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update variant.' });
    }
  });

  // ---------------- ORDERS ----------------

  app.get('/api/orders', (req: AuthenticatedRequest, res) => {
    const orderNumber = asSafeString(req.query?.orderNumber, 40);
    const store = loadStore();
    if (orderNumber) {
      const match = store.orders.filter(
        (o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase()
      );
      res.json(match);
      return;
    }
    // Full order list contains customer PII; require admin auth
    const { payload } = extractAuthFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      res.status(401).json({ error: 'Admin authentication required to list all orders.' });
      return;
    }
    res.json(store.orders);
  });

  app.post('/api/orders', (req, res) => {
    try {
      const customerName = asSafeString(req.body?.customerName, 120);
      const customerEmail = asSafeString(req.body?.customerEmail, 160);
      const customerPhone = asSafeString(req.body?.customerPhone, 40);
      const shippingAddress = asSafeString(req.body?.shippingAddress, 300);
      const postalCode = asSafeString(req.body?.postalCode, 20);
      const paymentMethod = asSafeString(req.body?.paymentMethod, 40) as PaymentMethod;
      const notes = asSafeString(req.body?.notes, 500);
      const items = Array.isArray(req.body?.items) ? req.body.items : [];

      if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !postalCode) {
        res.status(400).json({ error: 'All customer and shipping fields are required.' });
        return;
      }
      if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
        res.status(400).json({ error: 'Unsupported payment method.' });
        return;
      }

      const store = loadStore();
      const order = placeOrderRecord(store, {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        postalCode,
        paymentMethod,
        notes,
        items: items.map((i: Record<string, unknown>) => ({
          variantId: asSafeString(i?.variantId, 100),
          quantity: asSafeNumber(i?.quantity, 1, 1, 50),
        })),
      });
      saveStore(store);
      res.status(201).json(order);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to place order.' });
    }
  });

  app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
    try {
      const orderId = asSafeString(req.params.id, 100);
      const status = asSafeString(req.body?.status, 40) as OrderStatus;
      if (!ALLOWED_ORDER_STATUSES.includes(status)) {
        res.status(400).json({ error: 'Invalid order status.' });
        return;
      }
      const store = loadStore();
      const updated = updateOrderStatusRecord(store, orderId, status);
      saveStore(store);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to update order.' });
    }
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(process.cwd(), 'dist');

  if (isProd && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    if (!process.env.ADMIN_PASSCODE?.trim() && !isProd) {
      console.warn('[auth] ADMIN_PASSCODE not set — using dev passcode "alder-admin".');
    }
    console.log(`Teak-In-Furnitures server running on http://0.0.0.0:${port}`);
  });
}

if (process.env.VITEST_NO_LISTEN !== '1' && !process.argv.some((a) => a.includes('test'))) {
  startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}
