/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Leaf, LogOut, MapPin, Phone, Trees } from 'lucide-react';
import { Header, type ActivePage, type LowStockAlertItem } from './components/Header.tsx';
import { HomePage } from './components/HomePage.tsx';
import { ProductsPage } from './components/ProductsPage.tsx';
import { AboutPage } from './components/AboutPage.tsx';
import { ContactPage } from './components/ContactPage.tsx';
import { OrderTrackerView } from './components/OrderTrackerView.tsx';
import { InventoryWorkspace } from './components/InventoryWorkspace.tsx';
import { ProductFullPage } from './components/ProductFullPage.tsx';
import { WishlistView } from './components/WishlistView.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { AdminLoginPage } from './components/AdminLoginPage.tsx';
import { storeApi } from './lib/storeApi.ts';
import { isSupabaseConfigured } from './lib/supabase.ts';
import type {
  BedVariant,
  CartItem,
  Order,
  StockMovement,
  WoodBedProduct,
} from './types/inventory.ts';

const WISHLIST_STORAGE_KEY = 'alder_mortise_wishlist_ids';
const CART_STORAGE_KEY = 'alder_mortise_cart_items';

function loadInitialWishlist(): string[] {
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function loadInitialCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (i): i is CartItem =>
            Boolean(i && typeof i.variantId === 'string' && typeof i.quantity === 'number')
        )
      : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [products, setProducts] = useState<WoodBedProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean>(isSupabaseConfigured);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>(loadInitialWishlist);
  const [cart, setCart] = useState<CartItem[]>(loadInitialCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');

  const loadAllData = useCallback(async (adminOverride?: boolean) => {
    setError('');
    try {
      const authed = adminOverride ?? (await storeApi.checkAdminAuth());
      setIsAdmin(authed);
      const prodData = await storeApi.listProducts();
      setProducts(prodData);
      if (authed) {
        const [orderData, movData] = await Promise.all([
          storeApi.listOrders(),
          storeApi.listMovements(),
        ]);
        setOrders(orderData);
        setMovements(movData);
      } else {
        setOrders([]);
        setMovements([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load storefront catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  useEffect(() => {
    try { window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds)); } catch { /* ignore */ }
  }, [wishlistIds]);

  useEffect(() => {
    try { window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch { /* ignore */ }
  }, [cart]);

  const handleAdminLogin = async (passcode: string) => {
    await storeApi.loginAdmin(passcode);
    await loadAllData(true);
    setActivePage('inventory');
    window.history.pushState(null, '', '#inventory');
  };

  const handleAdminLogout = async () => {
    await storeApi.logoutAdmin();
    setIsAdmin(false);
    setOrders([]);
    setMovements([]);
  };

  const savedProducts = useMemo(() => {
    const savedSet = new Set(wishlistIds);
    return products.filter((p) => savedSet.has(p.id));
  }, [products, wishlistIds]);

  const lowStockAlerts = useMemo<LowStockAlertItem[]>(() => {
    const items: LowStockAlertItem[] = [];
    for (const product of products) {
      for (const variant of product.variants) {
        if (variant.stockQuantity < 5) items.push({ product, variant });
      }
    }
    return items.sort((a, b) => a.variant.stockQuantity - b.variant.stockQuantity);
  }, [products]);

  const handleToggleWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const handleClearWishlist = useCallback(() => { setWishlistIds([]); }, []);

  const selectedProduct = useMemo(
    () => (selectedProductId ? products.find((p) => p.id === selectedProductId) || null : null),
    [products, selectedProductId]
  );

  // Sync URL hash
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#product/')) {
        const slug = decodeURIComponent(hash.slice('#product/'.length));
        const match = products.find((p) => p.slug === slug || p.id === slug);
        if (match) { setActivePage('storefront'); setSelectedProductId(match.id); }
      } else if (hash === '#wishlist') { setSelectedProductId(null); setActivePage('wishlist'); }
      else if (hash === '#track') { setSelectedProductId(null); setActivePage('track'); }
      else if (hash === '#admin') { setSelectedProductId(null); setActivePage('admin'); }
      else if (hash === '#inventory') { setSelectedProductId(null); setActivePage('inventory'); }
      else if (hash === '#about') { setSelectedProductId(null); setActivePage('about'); }
      else if (hash === '#contact') { setSelectedProductId(null); setActivePage('contact'); }
      else if (!hash || hash === '#collection') { setSelectedProductId(null); setActivePage('storefront'); }
      else if (hash === '#home' || hash === '#') { setSelectedProductId(null); setActivePage('home'); }
    };
    if (products.length > 0) syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    window.addEventListener('popstate', syncFromHash);
    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('popstate', syncFromHash);
    };
  }, [products]);

  const handleOpenProduct = (product: WoodBedProduct) => {
    setActivePage('storefront');
    setSelectedProductId(product.id);
    window.history.pushState(null, '', `#product/${encodeURIComponent(product.slug)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseProduct = () => {
    setSelectedProductId(null);
    window.history.pushState(null, '', '#collection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (page: ActivePage) => {
    setSelectedProductId(null);
    if (page === 'craft') {
      setActivePage('storefront');
      window.history.pushState(null, '', '#timber-craft');
      setTimeout(() => { document.getElementById('timber-craft')?.scrollIntoView({ behavior: 'smooth' }); }, 60);
      return;
    }
    setActivePage(page);
    const hashMap: Partial<Record<ActivePage, string>> = {
      home: '#home',
      storefront: '#collection',
      about: '#about',
      contact: '#contact',
      track: '#track',
      admin: '#admin',
      inventory: '#inventory',
      wishlist: '#wishlist',
    };
    window.history.pushState(null, '', hashMap[page] ?? `#${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cartQuantitiesByVariant = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) { map[item.variantId] = (map[item.variantId] || 0) + item.quantity; }
    return map;
  }, [cart]);

  const totalBagCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const handleAddToCart = (product: WoodBedProduct, variant: BedVariant, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        const clamped = Math.min(variant.stockQuantity, existing.quantity + quantity);
        return prev.map((i) => i.variantId === variant.id ? { ...i, quantity: clamped } : i);
      }
      return [...prev, {
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        woodSpecies: product.woodSpecies,
        sizeLabel: variant.sizeLabel,
        sku: variant.sku,
        imageUrl: product.imageUrl,
        unitPriceCents: variant.priceCents,
        quantity: Math.min(variant.stockQuantity, quantity),
      }];
    });
    setCartOpen(true);
  };

  const handleUpdateCartQty = (variantId: string, nextQty: number) => {
    if (nextQty <= 0) { setCart((prev) => prev.filter((i) => i.variantId !== variantId)); return; }
    setCart((prev) => prev.map((i) => i.variantId === variantId ? { ...i, quantity: nextQty } : i));
  };

  const handleRemoveCartItem = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const handleOrderCompleted = () => { setCart([]); loadAllData(); };

  const handleViewOrderTracking = (orderNumber: string) => {
    setSelectedProductId(null);
    setTrackingOrderNumber(orderNumber);
    setActivePage('track');
    window.history.pushState(null, '', '#track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if ((activePage === 'admin' || activePage === 'inventory') && !isAdmin) {
    return (
      <AdminLoginPage
        onLogin={handleAdminLogin}
        onBack={() => handleNavigate('home')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#18181B]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#1F3A2E] focus:text-white focus:text-xs focus:font-semibold"
      >
        Skip to main content
      </a>

      <Header
        activePage={activePage}
        cartCount={totalBagCount}
        wishlistCount={savedProducts.length}
        lowStockAlerts={lowStockAlerts}
        onNavigate={handleNavigate}
        onSelectProduct={handleOpenProduct}
        onOpenCart={() => setCartOpen(true)}
      />

      <main id="main-content" className="flex-1">
        {/* HOME */}
        {activePage === 'home' && (
          <HomePage
            products={products}
            loading={loading}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onNavigateProducts={() => handleNavigate('storefront')}
            onNavigateAbout={() => handleNavigate('about')}
            onSelectProduct={handleOpenProduct}
          />
        )}

        {/* PRODUCTS / COLLECTION */}
        {activePage === 'storefront' && selectedProduct && (
          <ProductFullPage
            product={selectedProduct}
            allProducts={products}
            wishlistIds={wishlistIds}
            cartQuantitiesByVariant={cartQuantitiesByVariant}
            onBack={handleCloseProduct}
            onSelectProduct={handleOpenProduct}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
          />
        )}
        {activePage === 'storefront' && !selectedProduct && (
          <ProductsPage
            products={products}
            loading={loading}
            error={error}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onSelectProduct={handleOpenProduct}
            onRetry={loadAllData}
          />
        )}

        {/* ABOUT */}
        {activePage === 'about' && <AboutPage />}

        {/* CONTACT */}
        {activePage === 'contact' && <ContactPage />}

        {/* WISHLIST */}
        {activePage === 'wishlist' && (
          <WishlistView
            savedProducts={savedProducts}
            onBack={() => handleNavigate('storefront')}
            onSelectProduct={handleOpenProduct}
            onToggleWishlist={handleToggleWishlist}
            onClearWishlist={handleClearWishlist}
            onQuickAddToCart={handleAddToCart}
          />
        )}

        {/* TRACK ORDER */}
        {activePage === 'track' && (
          <OrderTrackerView initialOrders={orders} initialLookupNumber={trackingOrderNumber} />
        )}

        {/* ADMIN / INVENTORY */}
        {(activePage === 'inventory' || activePage === 'admin') && isAdmin && (
          <div>
            {!isSupabaseConfigured && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6E4DE] bg-white text-xs font-medium text-[#57534E] hover:text-[#18181B] hover:bg-[#F3F2EE] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  Sign out of Workshop Admin
                </button>
              </div>
            )}
            <InventoryWorkspace
              products={products}
              orders={orders}
              movements={movements}
              loading={loading}
              onRefresh={loadAllData}
            />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="relative overflow-hidden bg-gradient-to-br from-[#0D261C] via-[#143728] to-[#0A1E15] text-white border-t border-[#D4A14A]/30">
        {/* Subtle radial spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,161,74,0.12),transparent_60%)]"
        />

        {/* Subtle bottom-left solid wood cot watermark */}
        <img
          src="/src/assets/images/tn_mahogany_diwan_1795072558300.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none hidden lg:block absolute -left-8 bottom-0 w-72 h-44 object-cover opacity-20 mix-blend-luminosity [mask-image:linear-gradient(to_right,black,transparent)]"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-0 items-start">
            {/* Left Column: Gold Tree Emblem & Brand */}
            <div className="md:col-span-5 lg:pr-10">
              <div className="inline-flex flex-col items-start">
                <div className="flex items-center gap-2.5 text-[#D4A14A] mb-2">
                  <Trees className="w-8 h-8" aria-hidden="true" />
                </div>
                <p className="font-serif text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                  Teak-In-Furnitures
                </p>
                <div className="w-28 h-px bg-gradient-to-r from-[#D4A14A] to-transparent my-3" aria-hidden="true" />
                <p className="text-sm font-medium text-[#E5B869]">
                  Pollachi &amp; Karaikudi Timber Guild
                </p>
                <p className="text-xs italic text-white/75 mt-1">
                  Solid wood cots only. Tamil Nadu since 1962.
                </p>
              </div>
            </div>

            {/* Middle Column: Navigate */}
            <div className="md:col-span-3 lg:border-l lg:border-white/12 lg:px-10">
              <p className="text-xs font-serif tracking-[0.22em] text-[#E5B869] uppercase">
                Navigate
              </p>
              <div className="w-8 h-px bg-[#D4A14A] mt-2 mb-5" aria-hidden="true" />
              <div className="flex flex-col gap-2.5 text-sm text-white/80">
                {([
                  ['home', 'Home'],
                  ['storefront', 'Collection'],
                  ['about', 'About Us'],
                  ['contact', 'Contact'],
                  ['track', 'Track Order'],
                  ['admin', 'Workshop Admin'],
                ] as const).map(([page, label]) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handleNavigate(page)}
                    className="group inline-flex items-center gap-2 text-left hover:text-[#F5C56B] transition-colors cursor-pointer"
                  >
                    <ChevronRight
                      className="w-3.5 h-3.5 text-[#D4A14A] group-hover:translate-x-0.5 transition-transform"
                      aria-hidden="true"
                    />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Workshops */}
            <div className="md:col-span-4 lg:border-l lg:border-white/12 lg:pl-10">
              <p className="text-xs font-serif tracking-[0.22em] text-[#E5B869] uppercase">
                Workshops
              </p>
              <div className="w-8 h-px bg-[#D4A14A] mt-2 mb-5" aria-hidden="true" />
              <div className="space-y-3">
                {[
                  { city: 'Pollachi — 642 001, Tamil Nadu', phone: '+91 94430 00011', tel: '+919443000011' },
                  { city: 'Karaikudi — 630 002, Tamil Nadu', phone: '+91 94430 00022', tel: '+919443000022' },
                ].map((ws) => (
                  <div
                    key={ws.city}
                    className="rounded-xl border border-[#D4A14A]/35 bg-white/5 backdrop-blur-xs px-4 py-3 flex items-start gap-3 hover:border-[#D4A14A]/65 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-[#D4A14A] shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="text-xs sm:text-sm space-y-1">
                      <p className="font-medium text-white/95">{ws.city}</p>
                      <a
                        href={`tel:${ws.tel}`}
                        className="inline-flex items-center gap-1.5 text-xs text-white/75 hover:text-[#F5C56B] transition-colors"
                      >
                        <Phone className="w-3 h-3 text-[#D4A14A]" aria-hidden="true" />
                        <span>{ws.phone}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ornamented Gold Divider */}
          <div className="mt-10 mb-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D4A14A]/60 to-[#D4A14A]/80" />
            <div className="flex items-center gap-2 text-[#D4A14A]">
              <span className="w-1 h-1 rounded-full bg-[#D4A14A]" />
              <Leaf className="w-4 h-4" aria-hidden="true" />
              <span className="w-1 h-1 rounded-full bg-[#D4A14A]" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#D4A14A]/60 to-[#D4A14A]/80" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
            <p>© 2026 Teak-In-Furnitures. All rights reserved.</p>
            <p className="italic text-white/65">
              Handcrafted in Tamil Nadu — no veneers, no MDF, no shortcuts.
            </p>
          </div>
        </div>
      </footer>

      <CartDrawer
        isOpen={cartOpen}
        cart={cart}
        products={products}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onOrderCompleted={handleOrderCompleted}
        onViewOrderTracking={handleViewOrderTracking}
      />
    </div>
  );
}
