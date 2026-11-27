import { ArrowRight, Columns2, Heart, Layers, Leaf, Star, TreePine } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { WoodBedProduct } from '../types/inventory.ts';
import { formatCurrency } from '../lib/storeApi.ts';
import { getProductRatingStats } from '../lib/reviews.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductCardProps {
  product: WoodBedProduct;
  isWished?: boolean;
  index?: number;
  onSelect: (product: WoodBedProduct) => void;
  onToggleWishlist?: (productId: string) => void;
}

export function ProductCard({
  product,
  isWished = false,
  index = 0,
  onSelect,
  onToggleWishlist,
}: ProductCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const minP = Math.min(...product.variants.map((v) => v.priceCents));
  const isTeak = product.woodSpecies.toLowerCase().includes('teak');
  const rating = getProductRatingStats(product.id);

  const fade = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: {
          duration: 0.45,
          delay: Math.min(index * 0.05, 0.25),
          ease: 'easeOut' as import('motion/react').Easing,
        },
      };

  return (
    <motion.article
      {...fade}
      className="group relative rounded-3xl border border-[#E2CFA8] bg-gradient-to-b from-[#FAF6EE] via-[#FDFBF7] to-[#FAF3E6] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Top-Left Corner Ribbon Badge */}
      <div className="absolute top-0 left-0 z-10 rounded-br-2xl bg-[#143326] text-white px-3.5 py-2 inline-flex items-center gap-2 shadow-sm">
        <Leaf className="w-4 h-4 text-[#D4A14A] shrink-0" aria-hidden="true" />
        <div className="leading-tight">
          <p className="text-[10px] text-white/80 font-medium">Premium</p>
          <p className="text-[11px] font-semibold text-white">
            {isTeak ? 'Teak Wood' : 'Mahogany Wood'}
          </p>
        </div>
      </div>

      {/* Top-Right Wishlist Heart */}
      {onToggleWishlist && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          aria-label={isWished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-[#E6DFD3] shadow-xs flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 ${isWished ? 'fill-red-500 text-red-500' : 'text-[#18181B]'}`}
            aria-hidden="true"
          />
        </button>
      )}

      {/* Product Image */}
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="relative block w-full aspect-[16/10] overflow-hidden bg-[#F5EFE4] cursor-pointer"
      >
        <ResilientImage
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#FAF6EE] via-[#FAF6EE]/45 to-transparent"
        />
      </button>

      {/* Centered Editorial Content */}
      <div className="px-5 pt-2 pb-8 flex flex-col flex-1 text-center relative z-10">
        {/* Eyebrow with gold flanking lines */}
        <div className="inline-flex items-center justify-center gap-2.5 text-xs font-semibold text-[#143326]">
          <span className="w-8 h-px bg-[#D4A14A]" aria-hidden="true" />
          <span>{isTeak ? 'Solid Teak Wood' : 'Solid Mahogany Wood'}</span>
          <span className="w-8 h-px bg-[#D4A14A]" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={() => onSelect(product)}
          className="mt-1 cursor-pointer"
        >
          <h3 className="font-serif text-2xl sm:text-[1.75rem] font-bold text-[#143326] leading-tight group-hover:text-[#1F4A37] transition-colors">
            {product.name}
          </h3>
        </button>

        <p className="mt-1.5 text-xs text-[#4B4237] font-medium flex items-center justify-center gap-2">
          <span>Strong</span>
          <span className="text-[#D4A14A]">|</span>
          <span>Durable</span>
          <span className="text-[#D4A14A]">|</span>
          <span className="inline-flex items-center gap-1 font-semibold text-[#143326]">
            <Star className="w-3 h-3 fill-[#D4A14A] text-[#D4A14A]" aria-hidden="true" />
            {rating.average.toFixed(1)} ({rating.count})
          </span>
        </p>

        {/* 3-Item Spec Row with soft circular icon badges */}
        <div className="mt-4 mb-5 py-1 grid grid-cols-3 divide-x divide-[#E6DFD3] text-left">
          <div className="flex items-center gap-2 px-1.5 justify-center">
            <span className="w-7 h-7 rounded-full bg-[#FDF2DF] border border-[#EED9B3] flex items-center justify-center shrink-0">
              <TreePine className="w-3.5 h-3.5 text-[#143326]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-bold text-[#18181B] leading-tight">100%</p>
              <p className="text-[10px] text-[#57534E] leading-tight">Solid Wood</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-1.5 justify-center">
            <span className="w-7 h-7 rounded-full bg-[#FDF2DF] border border-[#EED9B3] flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5 text-[#143326]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-bold text-[#18181B] leading-tight">18 mm</p>
              <p className="text-[10px] text-[#57534E] leading-tight">Plywood Base</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-1.5 justify-center">
            <span className="w-7 h-7 rounded-full bg-[#FDF2DF] border border-[#EED9B3] flex items-center justify-center shrink-0">
              <Columns2 className="w-3.5 h-3.5 text-[#143326]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-bold text-[#18181B] leading-tight">Center</p>
              <p className="text-[10px] text-[#57534E] leading-tight">Support Bar</p>
            </div>
          </div>
        </div>

        {/* Bottom Price Ribbon + Explore Frame CTA */}
        <div className="mt-auto flex flex-wrap items-center justify-center gap-3 pt-1">
          {/* Slanted Two-Tone Price Ribbon */}
          <div className="inline-flex items-stretch rounded-lg overflow-hidden shadow-sm border border-[#D4A14A]">
            <span className="bg-[#143326] text-white text-[11px] italic font-medium px-2.5 py-1.5 flex items-center">
              From
            </span>
            <span className="bg-gradient-to-b from-[#F9E39E] via-[#F2C96B] to-[#DDA942] text-[#143326] font-bold text-sm px-3 py-1.5 tabular-nums flex items-center">
              {formatCurrency(minP)}
            </span>
          </div>

          <span className="hidden sm:inline-block w-px h-6 bg-[#DFD3C0]" aria-hidden="true" />

          <button
            type="button"
            onClick={() => onSelect(product)}
            className="inline-flex items-center justify-center gap-2 py-2 px-5 rounded-full bg-[#143326] text-white text-xs font-semibold border border-[#D4A14A]/70 shadow-sm hover:bg-[#1E4735] transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Explore Frame</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Bottom Curved Dark-Green & Gold Wave Accent */}
      <svg
        viewBox="0 0 400 28"
        preserveAspectRatio="none"
        className="w-full h-5 block pointer-events-none -mt-3"
        aria-hidden="true"
      >
        <path
          d="M0,10 Q95,28 240,18 T400,2 L400,28 L0,28 Z"
          fill="#143326"
        />
        <path
          d="M0,10 Q95,28 240,18 T400,2"
          fill="none"
          stroke="#D4A14A"
          strokeWidth="2.5"
        />
      </svg>
    </motion.article>
  );
}
