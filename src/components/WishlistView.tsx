import { ArrowLeft, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import type { BedVariant, WoodBedProduct } from '../types/inventory.ts';
import { formatCurrency } from '../lib/storeApi.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface WishlistViewProps {
  savedProducts: WoodBedProduct[];
  onBack: () => void;
  onSelectProduct: (product: WoodBedProduct) => void;
  onToggleWishlist: (productId: string) => void;
  onClearWishlist: () => void;
  onQuickAddToCart: (product: WoodBedProduct, variant: BedVariant, quantity: number) => void;
}

export function WishlistView({
  savedProducts,
  onBack,
  onSelectProduct,
  onToggleWishlist,
  onClearWishlist,
  onQuickAddToCart,
}: WishlistViewProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E6E4DE]">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#57534E] hover:text-[#18181B] transition-colors cursor-pointer mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Collection</span>
          </button>
          <p className="text-xs font-medium text-[#57534E]">
            Saved Shortlist · Temporary Session View
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#18181B] mt-1">
            Your Wishlist{' '}
            <span className="font-mono text-xl font-normal text-[#57534E] tabular-nums">
              ({savedProducts.length})
            </span>
          </h1>
        </div>

        {savedProducts.length > 0 && (
          <button
            type="button"
            onClick={onClearWishlist}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6E4DE] bg-white text-xs font-semibold text-[#57534E] hover:text-[#B91C1C] hover:border-[#FECACA] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear Saved Items</span>
          </button>
        )}
      </div>

      {savedProducts.length === 0 ? (
        <div className="py-16 px-6 text-center bg-white border border-[#E6E4DE] rounded-xl max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#F3F2EE] border border-[#E6E4DE] mx-auto flex items-center justify-center text-[#57534E]">
            <Heart className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#18181B] mt-4">
            No solid wood frames saved yet
          </h2>
          <p className="text-sm text-[#57534E] mt-2 max-w-md mx-auto leading-relaxed">
            Click the heart icon on any Teak Wood or Mahogany Wood cot frame in the
            collection to keep your favorites here for quick comparison.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1F3A2E] text-white text-xs font-semibold hover:bg-[#162920] transition-colors cursor-pointer"
          >
            <span>Browse Solid Wood Collection</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {savedProducts.map((product) => {
            const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
            const lowestPrice = Math.min(...product.variants.map((v) => v.priceCents));
            const defaultInStockVariant = product.variants.find((v) => v.stockQuantity > 0);
            const anyLow = product.variants.some(
              (v) => v.stockQuantity > 0 && v.stockQuantity <= v.reorderThreshold
            );

            const stockText =
              totalStock === 0
                ? 'Out of Stock'
                : anyLow && totalStock <= 6
                  ? `Low Stock · ${totalStock} left`
                  : `In Stock · ${totalStock} frames across ${product.variants.length} sizes`;

            return (
              <article
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group flex flex-col justify-between bg-white border border-[#E6E4DE] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
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
                      aria-label={`Remove ${product.name} from wishlist`}
                      aria-pressed="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product.id);
                      }}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 border border-[#FECACA] text-[#B91C1C] flex items-center justify-center shadow-xs hover:bg-[#FEF2F2] active:scale-95 transition-all cursor-pointer"
                    >
                      <Heart className="w-4 h-4 fill-[#B91C1C]" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[12px] uppercase tracking-wider text-[#57534E]">
                      <span>{product.collection}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{product.woodSpecies}</span>
                    </div>

                    <h2 className="font-serif text-xl font-semibold text-[#18181B] mt-1.5">
                      {product.name}
                    </h2>

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

                <div className="px-5 py-3.5 border-t border-[#E6E4DE] bg-[#FAFAF8] flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[15px] font-medium text-[#18181B] tabular-nums">
                      From {formatCurrency(lowestPrice)}
                    </p>
                    <span className="text-[11px] font-semibold text-[#1F3A2E] group-hover:underline underline-offset-4">
                      Full View &amp; Specs →
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!defaultInStockVariant}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (defaultInStockVariant) {
                        onQuickAddToCart(product, defaultInStockVariant, 1);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1F3A2E] text-white text-xs font-semibold hover:bg-[#162920] disabled:bg-[#D6D3CD] disabled:text-[#57534E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {defaultInStockVariant ? `Add ${defaultInStockVariant.sizeLabel}` : 'Sold Out'}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
