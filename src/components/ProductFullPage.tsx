import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BedDouble,
  Check,
  Crown,
  Heart,
  Layers,
  Leaf,
  Maximize2,
  Minus,
  PackageCheck,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  X,
} from 'lucide-react';
import type { BedSize, BedVariant, WoodBedProduct } from '../types/inventory.ts';
import { formatCurrency } from '../lib/storeApi.ts';
import { getProductRatingStats } from '../lib/reviews.ts';
import { ResilientImage } from './ResilientImage.tsx';
import { ProductCard } from './ProductCard.tsx';
import { ProductReviewsSection } from './ProductReviewsSection.tsx';
import sideBarImg from '../assets/images/section view/Teak Wood Rail with Measurement Arrow.png';
import legPostImg from '../assets/images/section view/Wooden Post with Width Measurement Arrow.png';
import undersideImg from '../assets/images/section view/Wooden Bed Base Underside Supports.png';
import plywoodImg from '../assets/images/section view/Layered Plywood Corner Close-Up.png';

interface ProductFullPageProps {
  product: WoodBedProduct;
  allProducts: WoodBedProduct[];
  wishlistIds: string[];
  cartQuantitiesByVariant: Record<string, number>;
  onBack: () => void;
  onSelectProduct: (product: WoodBedProduct) => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: WoodBedProduct, variant: BedVariant, quantity: number) => void;
}

function getFeetWidthGroup(size: BedSize): {
  feetLabel: string;
  centerBarsText: string;
} {
  switch (size) {
    case 'Single':
      return { feetLabel: '3 ft Bed', centerBarsText: 'No Center Bar' };
    case 'Diwan':
      return { feetLabel: '4 ft Bed', centerBarsText: 'No Center Bar' };
    case 'Queen':
      return { feetLabel: '5 ft Bed', centerBarsText: '1 Center Bar' };
    case 'King':
    case 'Super King':
    default:
      return {
        feetLabel: size === 'Super King' ? '6.5 ft Bed' : '6 ft Bed',
        centerBarsText: '2 Center Bars',
      };
  }
}

export function ProductFullPage({
  product,
  allProducts,
  wishlistIds,
  cartQuantitiesByVariant,
  onBack,
  onSelectProduct,
  onToggleWishlist,
  onAddToCart,
}: ProductFullPageProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>(product.imageUrl);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const firstInStock =
      product.variants.find((v) => v.stockQuantity > 0) || product.variants[0];
    setSelectedVariantId(firstInStock?.id || '');
    setQuantity(1);
    setActiveImage(product.imageUrl);
    setLightboxOpen(false);
    setDeliveryEstimate(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  if (!selectedVariant) return null;

  const specs = product.specs || {
    headSideHeightIn: '40"',
    legSideHeightIn: '20"',
    sideBarSize: '5" × 2"',
    legThickness: '4" × 4"',
    baseSpec: '18 mm Solid Timber Slats / Deck Base',
    crossBarsCount: 4,
  };

  const widthRule = getFeetWidthGroup(selectedVariant.sizeLabel);
  const alreadyInBag = cartQuantitiesByVariant[selectedVariant.id] || 0;
  const remainingAvailable = Math.max(0, selectedVariant.stockQuantity - alreadyInBag);
  const isOutOfStock = selectedVariant.stockQuantity === 0;
  const isMaxedInBag = !isOutOfStock && remainingAvailable === 0;
  const isWished = wishlistIds.includes(product.id);
  const isTeak = product.woodSpecies.toLowerCase().includes('teak');
  const ratingStats = getProductRatingStats(product.id);

  // Subtle compare-at workshop MRP (+12% rounded to nearest 1000 rupees)
  const compareAtCents = Math.round((selectedVariant.priceCents * 1.125) / 100000) * 100000;
  const savingsCents = Math.max(0, compareAtCents - selectedVariant.priceCents);

  const galleryThumbs = [
    { src: product.imageUrl, label: product.name },
    { src: sideBarImg, label: `Side Bar ${specs.sideBarSize}` },
    { src: legPostImg, label: `Leg Thickness ${specs.legThickness}` },
    { src: undersideImg, label: 'Underside Center Support Bars' },
    { src: plywoodImg, label: '18 mm Solid Deck Layering' },
  ];

  const handleConfirmAdd = () => {
    if (remainingAvailable <= 0) return;
    onAddToCart(product, selectedVariant, Math.min(quantity, remainingAvailable));
  };

  const handleCheckPincode = () => {
    const clean = pincode.replace(/\D/g, '');
    if (clean.length !== 6) {
      setDeliveryEstimate({
        ok: false,
        message: 'Enter a valid 6-digit Tamil Nadu pincode (e.g., 600018, 641002).',
      });
      return;
    }
    const prefix = Number(clean.slice(0, 2));
    if (prefix >= 60 && prefix <= 64) {
      const zone =
        prefix === 60
          ? 'Chennai & Northern TN'
          : prefix === 64
            ? 'Coimbatore, Pollachi & Western TN'
            : prefix === 62
              ? 'Madurai, Karaikudi & Southern TN'
              : 'Central & Delta Tamil Nadu';
      const freeEligible = selectedVariant.priceCents * quantity >= 5000000;
      setDeliveryEstimate({
        ok: true,
        message: `${zone} (${clean}): Guild carpenter delivery & assembly in ${product.leadTimeDays}–${product.leadTimeDays + 3} days · ${
          freeEligible ? 'Complimentary delivery' : '₹1,800 guild transit'
        }`,
      });
    } else {
      setDeliveryEstimate({
        ok: true,
        message: `Pincode ${clean}: Pan-India insured crated dispatch in ${product.leadTimeDays + 4}–${product.leadTimeDays + 7} days.`,
      });
    }
  };

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="bg-[#FAF6EE] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#1F3A2E] hover:text-[#C9924A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Collection</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
              isWished
                ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
                : 'border-[#E2CFA8] bg-white text-[#18181B] hover:bg-[#F3ECE1]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWished ? 'fill-current' : ''}`} aria-hidden="true" />
            <span>{isWished ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Main 2-Column Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT COLUMN: Gallery + Structural Callouts + 4-Card Anatomy + Banner */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex gap-3 sm:gap-4">
              {/* Vertical Thumbnail Strip */}
              <div className="hidden sm:flex flex-col gap-2.5 w-16 shrink-0">
                {galleryThumbs.map((thumb) => {
                  const active = activeImage === thumb.src;
                  return (
                    <button
                      key={thumb.label}
                      type="button"
                      onClick={() => setActiveImage(thumb.src)}
                      aria-label={`View ${thumb.label}`}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white ${
                        active
                          ? 'border-[#1F3A2E] ring-2 ring-[#1F3A2E]/20'
                          : 'border-[#E6DFD3] hover:border-[#C9924A]'
                      }`}
                    >
                      <ResilientImage
                        src={thumb.src}
                        alt={thumb.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>

              {/* Main Large Viewport */}
              <div className="relative flex-1 rounded-3xl overflow-hidden border-2 border-white bg-[#F6EFE5] shadow-[0_18px_45px_-15px_rgba(31,24,16,0.16)]">
                <div className="aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden">
                  <ResilientImage
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Expand Button */}
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Expand image"
                  className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-[#E6DFD3] text-[#18181B] flex items-center justify-center shadow-xs hover:bg-white cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" aria-hidden="true" />
                </button>

                {/* Structural Dimension Callouts on Primary Image */}
                {activeImage === product.imageUrl && (
                  <>
                    <div className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none px-2.5 py-1.5 rounded-xl bg-[#1F3A2E]/95 text-white text-center shadow-md border border-[#C9924A]/50">
                      <p className="text-[9px] text-white/80 leading-tight">Head Side</p>
                      <p className="text-[9px] text-white/80 leading-tight">Height</p>
                      <p className="font-mono text-sm font-bold text-[#F5C56B] mt-0.5">
                        {specs.headSideHeightIn}
                      </p>
                    </div>

                    <div className="hidden sm:block absolute left-[24%] bottom-3 pointer-events-none px-2.5 py-1 rounded-xl bg-[#1F3A2E]/95 text-white text-center shadow-md border border-[#C9924A]/50">
                      <p className="text-[9px] text-white/80 leading-tight">Side Bar</p>
                      <p className="font-mono text-xs font-bold text-[#F5C56B]">
                        {specs.sideBarSize}
                      </p>
                    </div>

                    <div className="hidden sm:block absolute left-[52%] bottom-3 pointer-events-none px-2.5 py-1 rounded-xl bg-[#1F3A2E]/95 text-white text-center shadow-md border border-[#C9924A]/50">
                      <p className="text-[9px] text-white/80 leading-tight">Leg Thickness</p>
                      <p className="font-mono text-xs font-bold text-[#F5C56B]">
                        {specs.legThickness}
                      </p>
                    </div>

                    <div className="hidden sm:block absolute right-3 bottom-1/4 pointer-events-none px-2.5 py-1.5 rounded-xl bg-[#1F3A2E]/95 text-white text-center shadow-md border border-[#C9924A]/50">
                      <p className="text-[9px] text-white/80 leading-tight">Leg Side</p>
                      <p className="text-[9px] text-white/80 leading-tight">Height</p>
                      <p className="font-mono text-sm font-bold text-[#F5C56B] mt-0.5">
                        {specs.legSideHeightIn}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Horizontal Thumbnails */}
            <div className="flex sm:hidden gap-2 overflow-x-auto pb-1">
              {galleryThumbs.map((thumb) => {
                const active = activeImage === thumb.src;
                return (
                  <button
                    key={thumb.label}
                    type="button"
                    onClick={() => setActiveImage(thumb.src)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 ${
                      active ? 'border-[#1F3A2E]' : 'border-[#E6DFD3]'
                    }`}
                  >
                    <ResilientImage src={thumb.src} alt={thumb.label} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>

            {/* 4-Card Structural Anatomy Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { img: sideBarImg, label: 'Side Bar', value: specs.sideBarSize },
                { img: legPostImg, label: 'Leg Thickness', value: specs.legThickness },
                { img: undersideImg, label: widthRule.feetLabel, value: widthRule.centerBarsText },
                { img: plywoodImg, label: '18 mm Solid Deck', value: `${specs.crossBarsCount} Cross Bars` },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl overflow-hidden border-2 border-white bg-[#FAF6EE] shadow-2xs flex flex-col"
                >
                  <div className="h-24 bg-[#F7F2E8] flex items-center justify-center overflow-hidden">
                    <img
                      src={card.img}
                      alt={card.label}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="py-2 px-2 text-center bg-white">
                    <p className="text-[11px] font-medium text-[#57534E] leading-tight">{card.label}</p>
                    <p className="text-xs font-bold text-[#18181B] leading-tight mt-0.5">{card.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Full-Width Dark Green Base Banner */}
            <div className="rounded-2xl bg-[#1F3A2E] text-white px-4 py-3 flex items-center gap-2.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#F5C56B] shrink-0" aria-hidden="true" />
              <p className="text-xs font-medium">
                <span className="font-semibold">Full Bed Base:</span> {specs.baseSpec} with Bottom Cross Support ({specs.crossBarsCount} Cross Bars)
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Buy Box, Specs & Pincode Checker */}
          <div className="lg:col-span-5 space-y-5">
            {/* Gold Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F5E6C4] border border-[#E2CFA8] text-[11px] font-semibold text-[#5A421C]">
              <Crown className="w-3.5 h-3.5 text-[#9A6B21]" aria-hidden="true" />
              <span>Premium {isTeak ? 'Teak' : 'Mahogany'} Collection</span>
            </div>

            <div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-bold text-[#18181B] leading-[1.08]">
                {product.name}
              </h1>

              {/* Rating & Stock Status Row */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <a
                  href="#product-reviews"
                  className="inline-flex items-center gap-2 text-xs text-[#18181B] hover:underline"
                >
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.round(ratingStats.average)
                            ? 'fill-[#D4A14A] text-[#D4A14A]'
                            : 'text-[#D6D3CE]'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <span className="font-bold">{ratingStats.average.toFixed(1)}</span>
                  <span className="text-[#57534E]">({ratingStats.count} Reviews)</span>
                </a>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    isOutOfStock
                      ? 'bg-[#FEF2F2] text-[#B91C1C]'
                      : 'bg-[#ECFDF5] text-[#15803D]'
                  }`}
                >
                  <Check className="w-3 h-3" aria-hidden="true" />
                  {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                </span>
              </div>

              {/* Price Row */}
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="font-sans text-3xl sm:text-4xl font-extrabold text-[#143326] tabular-nums">
                  {formatCurrency(selectedVariant.priceCents)}
                </span>
                <span className="text-base text-[#78716C] line-through tabular-nums">
                  {formatCurrency(compareAtCents)}
                </span>
                {savingsCents > 0 && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#F5E6C4] text-[#7A5415] text-xs font-bold tabular-nums">
                    Save {formatCurrency(savingsCents)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-[#57534E] leading-relaxed">{product.description}</p>

            {/* Select Cot Size */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-semibold text-[#18181B]">Select Cot Size</span>
                <span className="inline-flex items-center gap-1 text-[#57534E]">
                  <BedDouble className="w-3.5 h-3.5" aria-hidden="true" />
                  {widthRule.feetLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {product.variants.map((variant) => {
                  const selected = variant.id === selectedVariant.id;
                  const vFeet = getFeetWidthGroup(variant.sizeLabel).feetLabel;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setQuantity(1);
                      }}
                      className={`relative text-left p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                        selected
                          ? 'border-[#1F3A2E] bg-white shadow-xs'
                          : 'border-[#E6DFD3] bg-white/70 hover:border-[#C9924A]'
                      }`}
                    >
                      <BedDouble className="w-5 h-5 text-[#1F3A2E] shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#18181B] leading-tight">
                          {variant.sizeLabel}{' '}
                          <span className="font-normal text-[#57534E]">{vFeet}</span>
                        </p>
                        <p className="text-sm font-extrabold text-[#143326] tabular-nums mt-0.5">
                          {formatCurrency(variant.priceCents)}
                        </p>
                        <p className="text-[10px] text-[#57534E] mt-0.5">
                          {variant.stockQuantity} in stock
                        </p>
                      </div>
                      {selected && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#1F3A2E] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clean Spec Table */}
            <div className="rounded-2xl bg-white border border-[#E6DFD3] divide-y divide-[#F3ECE1] text-xs">
              {[
                { icon: Leaf, label: 'Hardwood Species', value: product.woodSpecies },
                { icon: Award, label: 'Crafted By', value: product.timberOrigin },
                { icon: Ruler, label: 'Overall Dimensions', value: selectedVariant.dimensionsIn },
                { icon: Layers, label: 'Center Support Rule', value: widthRule.centerBarsText },
                { icon: ShieldCheck, label: 'Joinery & Finish', value: `${product.joineryMethod}` },
                {
                  icon: PackageCheck,
                  label: 'Workshop Stock',
                  value: isOutOfStock ? 'Out of stock' : `In Stock · ${selectedVariant.stockQuantity} frames ready`,
                  highlight: !isOutOfStock,
                },
              ].map((row) => (
                <div key={row.label} className="px-4 py-2.5 flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 text-[#57534E]">
                    <row.icon className="w-3.5 h-3.5 text-[#1F3A2E]" aria-hidden="true" />
                    {row.label}
                  </span>
                  <span
                    className={`font-semibold text-right ${
                      row.highlight ? 'text-[#15803D]' : 'text-[#18181B]'
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Quantity & Add Wood Frame CTA */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-xl border border-[#E2CFA8] bg-white h-12 px-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 flex items-center justify-center text-[#18181B] hover:bg-[#FAF6EE] rounded-lg cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <span className="w-8 text-center text-sm font-bold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, remainingAvailable), q + 1))}
                  aria-label="Increase quantity"
                  className="w-9 h-9 flex items-center justify-center text-[#18181B] hover:bg-[#FAF6EE] rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock || isMaxedInBag}
                onClick={handleConfirmAdd}
                className="flex-1 h-12 rounded-xl bg-[#1F3A2E] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-md hover:bg-[#162920] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                <span>
                  {isOutOfStock
                    ? 'Out of Stock'
                    : isMaxedInBag
                      ? 'Max in Bag'
                      : `Add Wood Frame · ${formatCurrency(selectedVariant.priceCents * quantity)}`}
                </span>
              </button>
            </div>

            {/* Pincode Delivery Checker */}
            <div className="rounded-2xl bg-white border border-[#E6DFD3] p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#18181B]">
                <Truck className="w-4 h-4 text-[#1F3A2E]" aria-hidden="true" />
                <span>Check Tamil Nadu Carpenter Delivery</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Enter TN Pincode (e.g., 641002)"
                  className="flex-1 h-10 px-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-xs focus:outline-none focus:border-[#1F3A2E]"
                />
                <button
                  type="button"
                  onClick={handleCheckPincode}
                  className="px-4 h-10 rounded-lg border border-[#E2CFA8] bg-[#FAF6EE] text-xs font-semibold text-[#18181B] hover:bg-[#F3ECE1] cursor-pointer"
                >
                  Check
                </button>
              </div>
              {deliveryEstimate && (
                <p
                  className={`text-[11px] font-medium ${
                    deliveryEstimate.ok ? 'text-[#15803D]' : 'text-[#B91C1C]'
                  }`}
                >
                  {deliveryEstimate.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Product Customer Review System */}
        <ProductReviewsSection productId={product.id} productName={product.name} />

        {/* Related Frames (Matching Home & Collection ProductCards) */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#E6DFD3]">
            <div className="mb-8">
              <p className="text-xs font-mono tracking-[0.2em] text-[#7A6348] uppercase mb-1.5">
                More From Our Guild
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#18181B]">
                Explore Similar Solid Wood Cots
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedProducts.map((rel, idx) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  index={idx}
                  isWished={wishlistIds.includes(rel.id)}
                  onSelect={onSelectProduct}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Simple Lightbox Modal */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image preview"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-[#18181B] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={activeImage}
            alt={product.name}
            className="max-w-4xl max-h-[85vh] rounded-2xl object-contain bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
