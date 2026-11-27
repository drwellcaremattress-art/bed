import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Heart, Search } from 'lucide-react';
import type { BedCollection, WoodBedProduct } from '../types/inventory.ts';
import { formatCurrency } from '../lib/storeApi.ts';
import { ResilientImage } from './ResilientImage.tsx';
import { WoodBed3DViewer } from './WoodBed3DViewer.tsx';
import { TimberAtelierSection } from './TimberAtelierSection.tsx';

interface StorefrontViewProps {
  products: WoodBedProduct[];
  loading: boolean;
  error: string;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: WoodBedProduct) => void;
  onRetry: () => void;
}

const COLLECTIONS: Array<'All' | BedCollection> = [
  'All',
  'Headboard',
  'Platform',
  'Canopy',
  'Storage',
];

export function StorefrontView({
  products,
  loading,
  error,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onRetry,
}: StorefrontViewProps) {
  const [activeCollection, setActiveCollection] = useState<'All' | BedCollection>('All');
  const [speciesFilter, setSpeciesFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const shouldReduceMotion = useReducedMotion();

  const speciesOptions = useMemo(() => {
    const set = new Set(products.map((p) => p.woodSpecies));
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (activeCollection !== 'All' && p.collection !== activeCollection) return false;
      if (speciesFilter !== 'All' && p.woodSpecies !== speciesFilter) return false;
      if (q) {
        const hay =
          `${p.name} ${p.woodSpecies} ${p.timberOrigin} ${p.collection} ${p.joineryMethod}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => {
        const minA = Math.min(...a.variants.map((v) => v.priceCents));
        const minB = Math.min(...b.variants.map((v) => v.priceCents));
        return minA - minB;
      });
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => {
        const minA = Math.min(...a.variants.map((v) => v.priceCents));
        const minB = Math.min(...b.variants.map((v) => v.priceCents));
        return minB - minA;
      });
    }
    return list;
  }, [products, activeCollection, speciesFilter, searchQuery, sortBy]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Section 1: 3D & Motion-Graphic Tamil Nadu Solid Wood Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 lg:pt-12 lg:pb-18">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col justify-between py-2"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#57534E]">
                <span>Pollachi &amp; Karaikudi, Tamil Nadu</span>
                <span aria-hidden="true">·</span>
                <span>Solid Wood Frame Only</span>
              </div>

              <h1
                className="font-serif font-semibold text-[#18181B] mt-3 leading-[1.06] tracking-tight"
                style={{ fontSize: 'clamp(2.45rem, 4vw, 3.75rem)', textWrap: 'balance' }}
              >
                Tamil Nadu solid wood cots—zero mattress, pure timber.
              </h1>

              <p className="mt-5 text-base text-[#57534E] leading-relaxed max-w-lg">
                Inspect every Burma Teak, Indian Rosewood, Vengai, and Jackwood frame in live 3D.
                Milled from seasoned heartwood in Tamil Nadu and delivered bare-frame ready for
                generations.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => scrollToSection('collection-grid')}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-[#1F3A2E] text-white text-sm font-semibold hover:bg-[#162920] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Explore Wood Cots</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('timber-craft')}
                  className="text-sm font-semibold text-[#18181B] underline underline-offset-4 decoration-[#E6E4DE] hover:decoration-[#18181B] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Chettinad Joinery
                </button>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-[#E6E4DE] grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="font-mono font-medium text-[#18181B] tabular-nums">100%</p>
                <p className="text-[#57534E] mt-0.5">Heartwood Only</p>
              </div>
              <div>
                <p className="font-mono font-medium text-[#18181B] tabular-nums">25 Years</p>
                <p className="text-[#57534E] mt-0.5">Termite &amp; Joint Care</p>
              </div>
              <div>
                <p className="font-mono font-medium text-[#18181B] tabular-nums">Tamil Nadu</p>
                <p className="text-[#57534E] mt-0.5">Free Over ₹50,000</p>
              </div>
            </div>
          </motion.div>

          {/* Interactive 3D Solid Wood Bed Frame Viewport */}
          <div className="lg:col-span-7">
            <WoodBed3DViewer />
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Tamil Nadu Heartwood & Blueprint Showcase */}
      <TimberAtelierSection
        onFilterBySpecies={(speciesName) => {
          setActiveCollection('All');
          setSpeciesFilter(speciesName);
          scrollToSection('collection-grid');
        }}
        onInspectProductById={(productId) => {
          const match = products.find((p) => p.id === productId) || products[0];
          if (match) onSelectProduct(match);
        }}
      />

      {/* Section 3: Tamil Nadu Solid Wood Cot Catalog (Frame Only) */}
      <section
        id="collection-grid"
        className="border-t border-[#E6E4DE] bg-white py-16 lg:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E6E4DE]">
            <div>
              <p className="text-xs font-medium text-[#57534E]">
                Live Tamil Nadu Workshop Inventory · Solid Timber Frames Only
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#18181B] mt-1">
                Solid Wood Cot Collection
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                role="tablist"
                aria-label="Wood cot collections"
                className="inline-flex items-center gap-1 p-1 bg-[#F3F2EE] rounded-lg border border-[#E6E4DE]"
              >
                {COLLECTIONS.map((col) => {
                  const active = activeCollection === col;
                  return (
                    <button
                      key={col}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveCollection(col)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white text-[#18181B] shadow-xs'
                          : 'text-[#57534E] hover:text-[#18181B]'
                      }`}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 text-[#57534E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teak, rosewood, vengai..."
                  aria-label="Search wood cots"
                  className="h-9 pl-8 pr-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-xs text-[#18181B] placeholder:text-[#57534E] focus:outline-none focus:border-[#1F3A2E] w-52"
                />
              </div>

              <select
                value={speciesFilter}
                onChange={(e) => setSpeciesFilter(e.target.value)}
                aria-label="Filter by wood species"
                className="h-9 px-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#1F3A2E] cursor-pointer"
              >
                {speciesOptions.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp === 'All' ? 'All Tamil Nadu Woods' : sp}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Sort wood cots"
                className="h-9 px-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#1F3A2E] cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-8 p-6 rounded-xl border border-[#FECACA] bg-[#FEF2F2] flex items-center justify-between gap-4">
              <p className="text-sm text-[#B91C1C]">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-lg bg-white border border-[#FECACA] text-xs font-semibold text-[#B91C1C] cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="border border-[#E6E4DE] rounded-xl overflow-hidden bg-[#FAFAF8] animate-pulse"
                >
                  <div className="aspect-[4/3] bg-[#F3F2EE]" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-32 bg-[#E6E4DE] rounded" />
                    <div className="h-5 w-48 bg-[#E6E4DE] rounded" />
                    <div className="h-4 w-24 bg-[#E6E4DE] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-12 py-16 text-center border border-[#E6E4DE] rounded-xl bg-[#FAFAF8]">
              <p className="font-serif text-2xl font-medium text-[#18181B]">
                No solid wood frames match your filters
              </p>
              <p className="text-sm text-[#57534E] mt-2">
                Reset filters to view all Burma Teak, Rosewood, Vengai, and Jackwood cots.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCollection('All');
                  setSpeciesFilter('All');
                  setSearchQuery('');
                }}
                className="mt-5 px-4 py-2 rounded-lg bg-[#1F3A2E] text-white text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
                const lowestPrice = Math.min(...product.variants.map((v) => v.priceCents));
                const anyLow = product.variants.some(
                  (v) => v.stockQuantity > 0 && v.stockQuantity <= v.reorderThreshold
                );

                const stockText =
                  totalStock === 0
                    ? 'Out of Stock'
                    : anyLow && totalStock <= 6
                      ? `Low Stock · ${totalStock} left`
                      : `In Stock · ${totalStock} frames across ${product.variants.length} sizes`;

                const isSaved = wishlistIds.includes(product.id);

                return (
                  <article
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    className="group flex flex-col justify-between bg-[#FAFAF8] border border-[#E6E4DE] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                  >
                    <div>
                      <div className="relative aspect-[4/3] w-full bg-[#F3F2EE] overflow-hidden border-b border-[#E6E4DE]">
                        <ResilientImage
                          src={product.imageUrl}
                          alt={`${product.name} bare solid wood frame in ${product.woodSpecies}`}
                          fallbackLabel={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <button
                          type="button"
                          aria-label={
                            isSaved
                              ? `Remove ${product.name} from wishlist`
                              : `Save ${product.name} to wishlist`
                          }
                          aria-pressed={isSaved}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(product.id);
                          }}
                          className={`absolute top-3 right-3 w-9 h-9 rounded-full border flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-white border-[#FECACA] text-[#B91C1C]'
                              : 'bg-white/90 border-[#E6E4DE] text-[#18181B] hover:bg-white hover:text-[#B91C1C]'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${isSaved ? 'fill-[#B91C1C]' : ''}`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-2 text-[12px] uppercase tracking-wider text-[#57534E]">
                          <span>{product.collection}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{product.woodSpecies}</span>
                        </div>

                        <h3 className="font-serif text-xl font-semibold text-[#18181B] mt-1.5">
                          {product.name}
                        </h3>

                        <p className="mt-1.5 font-mono text-[11px] text-[#57534E] tabular-nums">
                          Head {product.specs?.headSideHeightIn || '40"'} · Side Bar{' '}
                          {product.specs?.sideBarSize || '5" × 2"'} · Leg{' '}
                          {product.specs?.legThickness || '4" × 4"'}
                        </p>

                        <p
                          className={`mt-2 text-xs font-medium tabular-nums ${
                            totalStock === 0
                              ? 'text-[#B91C1C]'
                              : anyLow && totalStock <= 6
                                ? 'text-[#B45309]'
                                : 'text-[#1F3A2E]'
                          }`}
                        >
                          {stockText}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3.5 border-t border-[#E6E4DE] bg-white flex items-center justify-between">
                      <span className="font-mono text-[15px] font-medium text-[#18181B] tabular-nums">
                        From {formatCurrency(lowestPrice)}
                      </span>
                      <span className="text-xs font-semibold text-[#1F3A2E] group-hover:underline underline-offset-4">
                        Full View &amp; Specs →
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Section 4: Chettinad & Pollachi Timber Guild */}
      <section id="timber-craft" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-7">
            <div className="aspect-[16/10] lg:h-full rounded-xl overflow-hidden border border-[#E6E4DE] bg-[#F3F2EE]">
              <ResilientImage
                src="/src/assets/images/craft_wood_joinery_1795071999133.jpg"
                alt="Hand-cut solid timber mortise and tenon bed frame joinery in Tamil Nadu workshop"
                fallbackLabel="Chettinad Mortise and Tenon Joinery"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between py-2">
            <div>
              <p className="text-xs font-medium text-[#57534E]">
                Karaikudi · Pollachi · Tenkasi · Madurai
              </p>
              <h2
                className="font-serif text-3xl sm:text-4xl font-semibold text-[#18181B] mt-2 leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Direct-from-guild carpenter delivery across Tamil Nadu.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[#57534E] leading-relaxed">
                Every cot ships as bare solid hardwood rails, headboard, footboard, and slats—with
                zero mattresses or hidden MDF boards. Our own timber carpenters assemble the
                interlocking frame inside your bedroom across Chennai, Coimbatore, Madurai, Trichy,
                Salem, and Erode.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E6E4DE] grid grid-cols-3 gap-4">
              <div>
                <p className="font-mono text-lg font-medium text-[#18181B] tabular-nums">38 Districts</p>
                <p className="text-xs text-[#57534E] mt-1">Tamil Nadu Delivery</p>
              </div>
              <div>
                <p className="font-mono text-lg font-medium text-[#18181B] tabular-nums">0%</p>
                <p className="text-xs text-[#57534E] mt-1">Plywood or Veneer</p>
              </div>
              <div>
                <p className="font-mono text-lg font-medium text-[#18181B] tabular-nums">14 Slats</p>
                <p className="text-xs text-[#57534E] mt-1">Heavy Hardwood Deck</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
