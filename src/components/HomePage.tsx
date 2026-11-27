import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Award, Bug, Layers, Leaf, Play, Shield, ShieldCheck, Star, TreePine, Truck, Wrench } from 'lucide-react';
import { ResilientImage } from './ResilientImage.tsx';
import { WoodBed3DViewer } from './WoodBed3DViewer.tsx';
import { CotAnatomySection } from './CotAnatomySection.tsx';
import { ProductCard } from './ProductCard.tsx';
import { getHighlightReviews } from '../lib/reviews.ts';
import type { WoodBedProduct } from '../types/inventory.ts';

interface HomePageProps {
  products: WoodBedProduct[];
  loading: boolean;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onNavigateProducts: () => void;
  onNavigateAbout: () => void;
  onSelectProduct: (product: WoodBedProduct) => void;
}

const CRAFT_IMAGE = '/src/assets/images/craft_wood_joinery_1795071999133.jpg';
const HERO_BG_IMAGE = '/src/assets/images/hero_sunlit_atelier.jpg';

const DIFFERENCE_CARDS = [
  {
    title: 'Premium Materials',
    body: 'Teak Wood & Mahogany Wood only',
    image: '/src/assets/images/tn_burma_teak_cot_1795072557358.jpg',
  },
  {
    title: 'Artisanal Craftsmanship',
    body: "Tamil Nadu's time-honoured woodcraft",
    image: '/src/assets/images/craft_wood_joinery_1795071999133.jpg',
  },
  {
    title: 'Traditional Joinery',
    body: 'Stronger, longer-lasting mortise & tenon',
    image: '/src/assets/images/tn_mahogany_diwan_1795072558300.jpg',
  },
  {
    title: 'Customisation',
    body: '15 cot models & custom sizes for your home',
    image: '/src/assets/images/tn_chettinad_canopy_1795072558017.jpg',
  },
];

const PILLARS = [
  {
    icon: Leaf,
    title: 'Ethically Sourced',
    body: 'Every log traced to certified Tamil Nadu timber guilds in Pollachi, Karaikudi, and the Nilgiris.',
  },
  {
    icon: Shield,
    title: 'Lifetime Structural Warranty',
    body: 'Our mortise-and-tenon joints are hand-tested under 400 kg static load before they leave the yard.',
  },
  {
    icon: Award,
    title: 'No Veneers. Ever.',
    body: 'Solid hardwood through the full section — no MDF core, no plywood sandwich, no shortcuts.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'The Chettinad teak we ordered is extraordinary. Eleven years old and not one squeak.',
    author: 'Meenakshi Rajan',
    city: 'Chennai',
    stars: 5,
  },
  {
    quote: 'White glove delivery, immaculate joinery. This is what furniture should feel like.',
    author: 'Sanjay Krishnaswamy',
    city: 'Coimbatore',
    stars: 5,
  },
  {
    quote: 'The rosewood platform frame weighs 190 kg and still feels lighter than it looks.',
    author: 'Priya Venkataraman',
    city: 'Bangalore',
    stars: 5,
  },
];

export function HomePage({
  products,
  loading,
  wishlistIds,
  onToggleWishlist,
  onNavigateProducts,
  onNavigateAbout,
  onSelectProduct,
}: HomePageProps) {
  const shouldReduceMotion = useReducedMotion();
  const featured = products.filter((p) => p.isFeatured).slice(0, 3);

  const fade = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay, ease: "easeOut" as import("motion/react").Easing } };

  return (
    <div className="bg-[#FAFAF8]">
      {/* ── 3D & MOTION-GRAPHIC HERO WITH SUNLIT ATELIER BG ── */}
      <section className="relative overflow-hidden border-b border-[#E5DCCF]">
        {/* Full-bleed sunlit room background */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={HERO_BG_IMAGE}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6EE]/92 via-[#FAF6EE]/68 to-[#FAF6EE]/25" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#FAF6EE] to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" as import("motion/react").Easing }}
              className="lg:col-span-5 flex flex-col justify-between py-2"
            >
              <div>
                <div className="inline-flex items-center gap-3 text-[11px] font-mono tracking-[0.2em] text-[#7A6348] uppercase mb-4">
                  <span className="w-7 h-px bg-[#C9924A]" aria-hidden="true" />
                  <span>Tamil Nadu Heritage Collection</span>
                  <span className="w-7 h-px bg-[#C9924A]" aria-hidden="true" />
                </div>

                <h1
                  className="font-serif font-semibold text-[#18181B] leading-[1.05] tracking-tight"
                  style={{ fontSize: 'clamp(2.5rem, 4.2vw, 3.85rem)', textWrap: 'balance' }}
                >
                  Tamil Nadu<br />
                  Solid Wood Cots —<br />
                  <span className="italic font-medium text-[#2C241D]">Pure Timber. Built to Last.</span>
                </h1>

                <p className="mt-5 text-sm sm:text-base text-[#4B4237] leading-relaxed max-w-md">
                  Handcrafted in Tamil Nadu across 15 signature cot models in solid{' '}
                  <strong className="font-semibold text-[#18181B]">Teak Wood</strong> and{' '}
                  <strong className="font-semibold text-[#18181B]">Mahogany Wood</strong> — with
                  traditional joinery, exceptional strength, and timeless beauty.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <button
                    type="button"
                    onClick={onNavigateProducts}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#1F3A2E] text-white text-sm font-semibold border border-[#C9924A]/50 shadow-md hover:bg-[#162920] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Explore Wood Cots</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateAbout}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#18181B] hover:text-[#1F3A2E] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span className="w-7 h-7 rounded-full border border-[#8B7355]/50 flex items-center justify-center">
                      <Play className="w-3 h-3 fill-current ml-0.5" aria-hidden="true" />
                    </span>
                    <span className="underline underline-offset-4 decoration-[#C9924A]/60">Our Story</span>
                  </button>
                </div>
              </div>

              {/* 4-column Trust Strip */}
              <div className="mt-10 pt-6 border-t border-[#DED4C5] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <TreePine className="w-4 h-4 text-[#7A6348]" aria-hidden="true" />
                  <p className="font-semibold text-[#18181B]">100%</p>
                  <p className="text-[11px] text-[#57534E]">Hardwood Only</p>
                </div>
                <div className="flex flex-col gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#7A6348]" aria-hidden="true" />
                  <p className="font-semibold text-[#18181B]">25 Years</p>
                  <p className="text-[11px] text-[#57534E]">Frame Warranty</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Bug className="w-4 h-4 text-[#7A6348]" aria-hidden="true" />
                  <p className="font-semibold text-[#18181B]">Termite</p>
                  <p className="text-[11px] text-[#57534E]">Protection</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Truck className="w-4 h-4 text-[#7A6348]" aria-hidden="true" />
                  <p className="font-semibold text-[#18181B]">Pan-India</p>
                  <p className="text-[11px] text-[#57534E]">Free over ₹50,000</p>
                </div>
              </div>
            </motion.div>

            {/* Interactive 3D Solid Wood Bed Frame Viewport */}
            <div className="lg:col-span-7">
              <WoodBed3DViewer />
            </div>
          </div>
        </div>
      </section>

      {/* ── DIFFERENCE STRIP (MATCHING REFERENCE BOTTOM BAND) ── */}
      <section className="bg-[#FAF6EE] border-b border-[#E6DFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-3">
              <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] text-[#7A6348] uppercase mb-2">
                <span className="w-4 h-px bg-[#C9924A]" aria-hidden="true" />
                <span>More Than A Cot</span>
                <span className="w-4 h-px bg-[#C9924A]" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] leading-tight">
                The Teak-In-Furnitures Difference
              </h2>
            </div>

            <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DIFFERENCE_CARDS.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={onNavigateProducts}
                  className="group text-left bg-white rounded-2xl border border-[#E6DFD3] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-[#F3ECE1]">
                    <ResilientImage
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3.5 flex items-end justify-between gap-2 flex-1">
                    <div>
                      <p className="text-xs font-semibold text-[#18181B]">{card.title}</p>
                      <p className="text-[11px] text-[#57534E] mt-0.5 leading-snug">{card.body}</p>
                    </div>
                    <span className="w-6 h-6 rounded-full border border-[#E2D6C5] flex items-center justify-center text-[#18181B] group-hover:bg-[#1F3A2E] group-hover:text-white group-hover:border-[#1F3A2E] transition-colors shrink-0">
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ANIMATED HERITAGE STAT STRIP ─────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF6EE] via-[#FDFBF7] to-[#FAF6EE] border-b border-[#E6DFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                n: '62+',
                label: 'Years Crafting',
                sub: 'Three generations since 1962',
                icon: Award,
              },
              {
                n: '15',
                label: 'Teak & Mahogany Cots',
                sub: 'Solid hardwood frames only',
                icon: Layers,
              },
              {
                n: '400 kg',
                label: 'Load-Tested Joints',
                sub: 'Wedged mortise & tenon',
                icon: ShieldCheck,
              },
              {
                n: '0',
                label: 'Veneers Used — Ever',
                sub: '100% pure heartwood section',
                icon: Leaf,
              },
            ].map((s, idx) => (
              <motion.div
                key={s.label}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.08,
                  ease: 'easeOut' as import('motion/react').Easing,
                }}
                whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                className="group relative rounded-2xl bg-white/95 border border-[#E2CFA8] p-5 sm:p-6 shadow-xs hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Top animated gold accent bar */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#143326] via-[#D4A14A] to-[#143326] opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-sans text-3xl sm:text-4xl font-extrabold text-[#143326] tracking-tight tabular-nums lining-nums">
                      {s.n}
                    </p>
                    <p className="text-xs font-semibold text-[#18181B] uppercase tracking-wider mt-1.5">
                      {s.label}
                    </p>
                    <p className="text-[11px] text-[#57534E] mt-1">{s.sub}</p>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-[#FDF2DF] border border-[#EED9B3] flex items-center justify-center text-[#143326] group-hover:bg-[#143326] group-hover:text-[#F5C56B] transition-colors shrink-0">
                    <s.icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED BEDS ────────────────────────────────────── */}
      {!loading && featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 sm:py-28">
          <motion.div {...fade()} className="flex items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-mono tracking-[0.2em] text-[#C9924A] uppercase mb-2">
                Selected Frames
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-[#18181B]">
                Featured Collection
              </h2>
            </div>
            <button
              type="button"
              onClick={onNavigateProducts}
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-[#1F3A2E] hover:text-[#C9924A] transition-colors cursor-pointer whitespace-nowrap"
            >
              View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {featured.map((product, i) => (
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

          <div className="mt-10 text-center sm:hidden">
            <button
              type="button"
              onClick={onNavigateProducts}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-[#1F3A2E] text-sm font-semibold text-[#1F3A2E] hover:bg-[#1F3A2E] hover:text-white transition-colors cursor-pointer"
            >
              View all beds <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* ── COT ANATOMY & STRUCTURAL SPECS ──────────────────── */}
      <CotAnatomySection onExploreCollection={onNavigateProducts} />

      {/* ── CRAFT SPLIT ──────────────────────────────────────── */}
      <section className="bg-[#F3F2EE]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div {...fade()}>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <ResilientImage
                src={CRAFT_IMAGE}
                alt="Mortise and tenon joinery"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
          <motion.div {...fade(0.15)}>
            <p className="text-xs font-mono tracking-[0.2em] text-[#C9924A] uppercase mb-3">
              The Method
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-[#18181B] leading-tight">
              Built without<br />a single screw.
            </h2>
            <p className="mt-5 text-sm text-[#57534E] leading-relaxed max-w-md">
              Every joint is a wedged mortise and tenon — the same geometry that Tamil Nadu
              carpenters have used for three centuries. No metal fasteners, no wood glue from
              a tube. The wood moves, breathes, and locks tighter with every monsoon season.
            </p>
            <ul className="mt-6 space-y-3">
              {['14-step kiln seasoning process', 'Hand-planed to ±0.5 mm tolerance', 'Load-tested at 400 kg static before dispatch'].map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm text-[#57534E]">
                  <span className="w-5 h-5 rounded-full bg-[#1F3A2E]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-[#1F3A2E]" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {s}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onNavigateAbout}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1F3A2E] hover:text-[#C9924A] transition-colors cursor-pointer"
            >
              Learn our process <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── PILLARS ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 sm:py-28">
        <motion.div {...fade()} className="text-center mb-14">
          <p className="text-xs font-mono tracking-[0.2em] text-[#C9924A] uppercase mb-2">
            Our Guarantees
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-[#18181B]">
            Why Teak-In-Furnitures
          </h2>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
          {PILLARS.map((p, i) => (
            <motion.div key={p.title} {...fade(i * 0.1)} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#1F3A2E]/8 flex items-center justify-center mx-auto mb-5">
                <p.icon className="w-6 h-6 text-[#1F3A2E]" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#18181B] mb-2">{p.title}</h3>
              <p className="text-sm text-[#57534E] leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CUSTOMER REVIEWS MARQUEE ─────────────────────────── */}
      <section className="bg-[#1F3A2E] py-16 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 mb-10 text-center">
          <div className="inline-flex items-center gap-3 text-xs font-mono tracking-[0.2em] text-[#C9924A] uppercase mb-2.5">
            <span className="w-8 h-px bg-[#C9924A]" aria-hidden="true" />
            <span>Customer Reviews</span>
            <span className="w-8 h-px bg-[#C9924A]" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-white">
            Trusted Across Tamil Nadu Homes
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-white/60">
            Hover to pause · Verified solid Teak &amp; Mahogany cot owners
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div className="animate-marquee gap-6 px-3">
            {[...getHighlightReviews(), ...getHighlightReviews()].map((rev, i) => (
              <article
                key={`${rev.id}-${i}`}
                className="w-[320px] sm:w-[370px] shrink-0 bg-white/8 border border-white/12 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: rev.rating }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-[#C9924A] text-[#C9924A]" aria-hidden="true" />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-[#C9924A] uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white mb-1.5">{rev.title}</p>
                  <p className="font-serif text-base text-white/85 leading-snug line-clamp-3">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
                <p className="text-xs text-white/55 mt-4 pt-3 border-t border-white/10">
                  — {rev.author}, <span className="text-white/40">{rev.city}</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA SHOWCASE BANNER ────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#FAF6EE] via-[#FDFBF7] to-[#FAF3E6] border-t border-[#E6DFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Sunlit Solid Teak Cot Showcase */}
            <motion.div {...fade()} className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden border-2 border-white shadow-[0_20px_50px_-15px_rgba(31,24,16,0.16)] aspect-[16/10] bg-[#F5EFE4]">
                <ResilientImage
                  src="/src/assets/images/tn_burma_teak_cot_1795072557358.jpg"
                  alt="Solid Teak Wood cot crafted in Tamil Nadu"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Right: Editorial CTA */}
            <motion.div {...fade(0.1)} className="lg:col-span-6 text-center space-y-5">
              <div className="inline-flex items-center justify-center gap-3 text-[11px] font-mono tracking-[0.2em] text-[#5A4632] uppercase">
                <span className="w-8 h-px bg-[#D4A14A]" aria-hidden="true" />
                <span>Premium Teak Wood Collection</span>
                <span className="w-8 h-px bg-[#D4A14A]" aria-hidden="true" />
              </div>

              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#143326] leading-[1.08]">
                Timeless Frames for<br />
                a <span className="italic font-semibold text-[#A6752A]">More Beautiful Home</span>
              </h2>

              <p className="text-sm sm:text-base text-[#57534E] max-w-md mx-auto leading-relaxed">
                Crafted from solid teak &amp; mahogany wood for lasting strength, natural beauty,
                and everyday comfort.
              </p>

              {/* 4-Column Guarantee Strip */}
              <div className="pt-2 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E2D6C5]">
                {[
                  { icon: Leaf, line1: '100%', line2: 'Solid Teak Wood' },
                  { icon: ShieldCheck, line1: 'Long-Lasting', line2: 'Durability' },
                  { icon: Wrench, line1: 'Expert', line2: 'Craftsmanship' },
                  { icon: Truck, line1: 'Complimentary', line2: 'Delivery in TN' },
                ].map((item) => (
                  <div key={item.line2} className="flex flex-col items-center px-2 pt-2 sm:pt-0">
                    <item.icon className="w-5 h-5 text-[#A6752A] mb-1.5" aria-hidden="true" />
                    <p className="text-[11px] font-semibold text-[#18181B] leading-tight">{item.line1}</p>
                    <p className="text-[11px] text-[#57534E] leading-tight">{item.line2}</p>
                  </div>
                ))}
              </div>

              <div>
                <button
                  type="button"
                  onClick={onNavigateProducts}
                  className="inline-flex items-center gap-2.5 h-12 px-8 rounded-full bg-[#143326] text-white text-sm font-semibold border border-[#D4A14A]/80 shadow-md hover:bg-[#1E4735] transition-colors cursor-pointer"
                >
                  <span>Browse the Full Collection</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
