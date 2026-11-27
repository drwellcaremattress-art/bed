import { motion, useReducedMotion } from 'motion/react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { BedCollection, WoodBedProduct } from '../types/inventory.ts';
import { ProductCard } from './ProductCard.tsx';

interface ProductsPageProps {
  products: WoodBedProduct[];
  loading: boolean;
  error: string;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: WoodBedProduct) => void;
  onRetry: () => void;
}

const COLLECTIONS: Array<'All' | BedCollection> = ['All', 'Headboard', 'Platform', 'Canopy', 'Storage'];

export function ProductsPage({
  products,
  loading,
  error,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onRetry,
}: ProductsPageProps) {
  const [activeCollection, setActiveCollection] = useState<'All' | BedCollection>('All');
  const [speciesFilter, setSpeciesFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const shouldReduceMotion = useReducedMotion();

  const speciesOptions = useMemo(() => {
    const set = new Set(products.map((p) => p.woodSpecies));
    return ['All', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = products.filter((p) => {
      if (activeCollection !== 'All' && p.collection !== activeCollection) return false;
      if (speciesFilter !== 'All' && p.woodSpecies !== speciesFilter) return false;
      if (q) {
        const hay = `${p.name} ${p.woodSpecies} ${p.timberOrigin} ${p.collection} ${p.joineryMethod}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => Math.min(...a.variants.map((v) => v.priceCents)) - Math.min(...b.variants.map((v) => v.priceCents)));
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => Math.min(...b.variants.map((v) => v.priceCents)) - Math.min(...a.variants.map((v) => v.priceCents)));
    return list;
  }, [products, activeCollection, speciesFilter, searchQuery, sortBy]);

  const fade = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay, ease: "easeOut" as import("motion/react").Easing } };

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      {/* Page header */}
      <div className="bg-[#1F3A2E] text-white py-16 sm:py-20 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.p {...fade()} className="text-xs font-mono tracking-[0.2em] text-[#C9924A] uppercase mb-3">
            Solid Wood Cot Frames
          </motion.p>
          <motion.h1 {...fade(0.1)} className="font-serif text-4xl sm:text-6xl font-semibold leading-tight">
            The Collection
          </motion.h1>
          <motion.p {...fade(0.2)} className="mt-4 text-sm text-white/60 max-w-lg">
            {products.length > 0
              ? `${products.length} frames crafted in Tamil Nadu — no veneers, no MDF, no shortcuts.`
              : 'Handcrafted solid wood frames from Tamil Nadu timber guilds.'}
          </motion.p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="sticky top-16 z-30 bg-[#FAFAF8]/95 backdrop-blur-sm border-b border-[#E6E4DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#57534E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search frames…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E6E4DE] bg-white text-xs focus:outline-none focus:border-[#1F3A2E]"
              aria-label="Search frames"
            />
          </div>

          {/* Collection tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {COLLECTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCollection(c)}
                className={`h-9 px-4 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeCollection === c
                    ? 'bg-[#1F3A2E] text-white'
                    : 'border border-[#E6E4DE] text-[#57534E] hover:border-[#1F3A2E] hover:text-[#18181B]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Sort + Species */}
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E6E4DE] text-xs text-[#57534E] bg-white focus:outline-none focus:border-[#1F3A2E] cursor-pointer"
              aria-label="Filter by wood species"
            >
              {speciesOptions.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All species' : s}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E6E4DE] bg-white">
              <SlidersHorizontal className="w-3 h-3 text-[#57534E]" aria-hidden="true" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs text-[#57534E] bg-transparent focus:outline-none cursor-pointer"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="text-center py-16">
            <p className="text-sm text-[#B91C1C] mb-4">{error}</p>
            <button type="button" onClick={onRetry} className="h-10 px-6 rounded-full bg-[#1F3A2E] text-white text-sm font-semibold cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#E6E4DE] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[#F3F2EE]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-[#F3F2EE] rounded w-1/3" />
                  <div className="h-5 bg-[#F3F2EE] rounded w-2/3" />
                  <div className="h-3 bg-[#F3F2EE] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-[#18181B] mb-2">No frames found</p>
            <p className="text-sm text-[#57534E]">Try clearing your filters.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="text-xs text-[#57534E] mb-6">{filtered.length} frame{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  isWished={wishlistIds.includes(product.id)}
                  onSelect={onSelectProduct}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
