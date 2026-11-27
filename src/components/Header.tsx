import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, Heart, Menu, ShoppingBag, X } from 'lucide-react';
import type { BedVariant, WoodBedProduct } from '../types/inventory.ts';

export type ActivePage = 'home' | 'storefront' | 'craft' | 'about' | 'contact' | 'track' | 'inventory' | 'wishlist' | 'admin';

export interface LowStockAlertItem {
  product: WoodBedProduct;
  variant: BedVariant;
}

interface HeaderProps {
  activePage: ActivePage;
  cartCount: number;
  wishlistCount: number;
  lowStockAlerts: LowStockAlertItem[];
  onNavigate: (page: ActivePage) => void;
  onSelectProduct: (product: WoodBedProduct) => void;
  onOpenCart: () => void;
}

export function Header({
  activePage,
  cartCount,
  wishlistCount,
  lowStockAlerts,
  onNavigate,
  onSelectProduct,
  onOpenCart,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement | null>(null);

  const navItems: Array<{ id: ActivePage; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'storefront', label: 'Collection' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
    { id: 'track', label: 'Track Order' },
  ];

  useEffect(() => {
    if (!alertsOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [alertsOpen]);

  const handleNavClick = (page: ActivePage) => {
    setMobileOpen(false);
    setAlertsOpen(false);
    onNavigate(page);
  };

  const affectedModelCount = new Set(lowStockAlerts.map((item) => item.product.id)).size;
  const outOfStockCount = lowStockAlerts.filter((item) => item.variant.stockQuantity === 0).length;

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-sm border-b border-[#E6E4DE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-6">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="font-serif text-2xl font-semibold tracking-tight text-[#18181B] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F3A2E]"
        >
          Teak-In-Furnitures
        </button>

        {/* Zone 2: 4 single-line navigation links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F3A2E] ${isActive
                    ? 'text-[#18181B] font-semibold'
                    : 'text-[#57534E] hover:text-[#18181B]'
                  }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-px bg-[#1F3A2E]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Low-Stock Notification Bell, Wishlist & Bag */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Low-Stock Notification Bell & Popover */}
          <div ref={alertsRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setAlertsOpen((prev) => !prev);
              }}
              aria-expanded={alertsOpen}
              aria-haspopup="true"
              aria-label={`Low stock notifications: ${lowStockAlerts.length} items under 5 units`}
              className={`relative inline-flex items-center justify-center h-9 px-2.5 rounded-lg border transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F3A2E] ${alertsOpen
                  ? 'border-[#1F3A2E] bg-[#1F3A2E]/8 text-[#18181B]'
                  : lowStockAlerts.length > 0
                    ? 'border-[#FCD34D] bg-[#FFFBEB] text-[#92400E] hover:bg-[#FEF3C7]'
                    : 'border-[#E6E4DE] bg-white text-[#57534E] hover:bg-[#F3F2EE] hover:text-[#18181B]'
                }`}
            >
              <Bell className="w-4 h-4 shrink-0" aria-hidden="true" />
              {lowStockAlerts.length > 0 && (
                <span className="ml-1.5 font-mono text-[11px] font-semibold tabular-nums">
                  {lowStockAlerts.length}
                </span>
              )}
            </button>

            {alertsOpen && (
              <div
                role="region"
                aria-label="Low stock availability alerts"
                className="absolute right-0 mt-2 w-[320px] sm:w-[360px] rounded-xl bg-white border border-[#E6E4DE] shadow-xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-[#E6E4DE] bg-[#FAFAF8] flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#18181B]">
                      Low Stock Summary (&lt; 5 units)
                    </p>
                    <p className="text-[11px] text-[#57534E] tabular-nums mt-0.5">
                      {lowStockAlerts.length === 0
                        ? 'All sizes well stocked'
                        : `${lowStockAlerts.length} ${lowStockAlerts.length === 1 ? 'size' : 'sizes'} across ${affectedModelCount} ${affectedModelCount === 1 ? 'model' : 'models'}${outOfStockCount > 0 ? ` · ${outOfStockCount} out` : ''}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertsOpen(false)}
                    aria-label="Close low stock alerts"
                    className="p-1 rounded-md text-[#57534E] hover:bg-[#F3F2EE] hover:text-[#18181B] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                {lowStockAlerts.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs font-semibold text-[#1F3A2E]">
                      All solid wood frames are well stocked
                    </p>
                    <p className="text-[11px] text-[#57534E] mt-1">
                      Every size variant currently has 5 or more units ready in the workshop yard.
                    </p>
                  </div>
                ) : (
                  <ul className="max-h-72 overflow-y-auto divide-y divide-[#E6E4DE]">
                    {lowStockAlerts.map(({ product, variant }) => {
                      const isOut = variant.stockQuantity === 0;
                      return (
                        <li key={variant.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setAlertsOpen(false);
                              onSelectProduct(product);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-[#FAFAF8] transition-colors flex items-start justify-between gap-3 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#18181B] truncate">
                                {product.name}
                              </p>
                              <p className="text-[11px] text-[#57534E] mt-0.5">
                                {variant.sizeLabel}{' '}
                                <span aria-hidden="true">·</span>{' '}
                                <span className="font-mono">{variant.sku}</span>
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold tabular-nums whitespace-nowrap shrink-0 ${isOut ? 'text-[#B91C1C]' : 'text-[#B45309]'
                                }`}
                            >
                              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                              <span>{isOut ? 'Out (0)' : `${variant.stockQuantity} left`}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="px-4 py-2.5 border-t border-[#E6E4DE] bg-[#FAFAF8] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#57534E]">
                    Click an item to inspect frame
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNavClick('admin')}
                    className="text-xs font-semibold text-[#1F3A2E] hover:underline underline-offset-4 whitespace-nowrap cursor-pointer"
                  >
                    Manage Stock →
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleNavClick('wishlist')}
            aria-label={`Open wishlist (${wishlistCount} saved)`}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F3A2E] ${activePage === 'wishlist'
                ? 'border-[#1F3A2E] bg-[#1F3A2E]/8 text-[#18181B]'
                : 'border-[#E6E4DE] bg-white text-[#18181B] hover:bg-[#F3F2EE]'
              }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${wishlistCount > 0 ? 'fill-[#B91C1C] text-[#B91C1C]' : 'text-[#57534E]'
                }`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Wishlist</span>
            <span className="tabular-nums text-[#57534E]">({wishlistCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAlertsOpen(false);
              onOpenCart();
            }}
            className="inline-flex items-center gap-2 h-9 px-3.5 sm:px-4 rounded-lg bg-[#1F3A2E] text-white text-xs font-semibold hover:bg-[#162920] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F3A2E]"
          >
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="tabular-nums">Bag ({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAlertsOpen(false);
              setMobileOpen((prev) => !prev);
            }}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 rounded-lg border border-[#E6E4DE] text-[#18181B] hover:bg-[#F3F2EE] cursor-pointer"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-[#E6E4DE] bg-[#FAFAF8] px-4 py-3 flex flex-col gap-1"
        >
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap ${isActive
                    ? 'bg-[#F3F2EE] text-[#18181B] font-semibold'
                    : 'text-[#57534E] hover:bg-[#F3F2EE] hover:text-[#18181B]'
                  }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleNavClick('wishlist')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap flex items-center justify-between ${activePage === 'wishlist'
                ? 'bg-[#F3F2EE] text-[#18181B] font-semibold'
                : 'text-[#57534E] hover:bg-[#F3F2EE] hover:text-[#18181B]'
              }`}
          >
            <span>Wishlist</span>
            <span className="font-mono text-xs tabular-nums">({wishlistCount})</span>
          </button>
        </nav>
      )}
    </header>
  );
}
