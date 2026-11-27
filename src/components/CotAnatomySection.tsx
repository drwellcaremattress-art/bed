import { ArrowRight, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import mainCotImg from '../assets/images/section view/Tufted Teak Bed with Quilted Mattress.png';
import sideBarImg from '../assets/images/section view/Teak Wood Rail with Measurement Arrow.png';
import legPostImg from '../assets/images/section view/Wooden Post with Width Measurement Arrow.png';
import undersideImg from '../assets/images/section view/Wooden Bed Base Underside Supports.png';
import plywoodImg from '../assets/images/section view/Layered Plywood Corner Close-Up.png';

interface CotAnatomySectionProps {
  onExploreCollection?: () => void;
}

const DETAIL_CARDS = [
  {
    image: sideBarImg,
    label: 'Side Bar',
    value: '5" × 2"',
    alt: 'Teak wood side bar rail measuring 5 by 2 inches',
  },
  {
    image: legPostImg,
    label: 'Leg Thickness',
    value: '4" × 4"',
    alt: 'Solid wooden post leg thickness measuring 4 by 4 inches',
  },
  {
    image: undersideImg,
    label: '2 Center',
    value: 'Supporting Bars',
    valueSmall: true,
    alt: 'Wooden bed base underside showing 2 center supporting bars',
  },
  {
    image: plywoodImg,
    label: '18 mm',
    value: 'Plywood (Base)',
    valueSmall: true,
    alt: '18 mm layered plywood base corner close-up',
  },
];

const CENTER_BAR_RULES = [
  { size: '4 ft Bed', rule: 'No Center Bar' },
  { size: '5 ft Bed', rule: '1 Center Bar' },
  { size: '6 ft Bed', rule: '2 Center Bars' },
];

export function CotAnatomySection({ onExploreCollection }: CotAnatomySectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const fade = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: {
            duration: 0.5,
            delay,
            ease: 'easeOut' as import('motion/react').Easing,
          },
        };

  const handleExplore = () => {
    if (onExploreCollection) {
      onExploreCollection();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section
      aria-label="Solid Wood Cot Structural Specifications"
      className="bg-gradient-to-b from-[#FAF6EE] to-[#F3ECE1] border-t border-[#E6DFD3] py-14 sm:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Heading */}
        <motion.div {...fade()} className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-3 text-xs font-mono tracking-[0.2em] text-[#7A6348] uppercase mb-2.5">
            <span className="w-8 h-px bg-[#C9924A]" aria-hidden="true" />
            <span>Structural Anatomy</span>
            <span className="w-8 h-px bg-[#C9924A]" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#18181B] leading-tight">
            Built for Decades of Everyday Strength
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#57534E]">
            Full-section side rails, 4&quot; × 4&quot; solid corner posts, and an 18 mm bottom-supported base engineered for zero creaks.
          </p>
        </motion.div>

        {/* Top 2-Column Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left: Tufted Teak Cot with Dimension Arrows & Badges */}
          <motion.div {...fade()} className="lg:col-span-7 relative">
            <div className="relative rounded-3xl overflow-hidden border-2 border-white bg-[#F6EFE5] shadow-[0_20px_50px_-15px_rgba(31,24,16,0.16)]">
              <img
                src={mainCotImg}
                alt="Premium Teak Wood solid wood cot with quilted mattress"
                className="w-full h-auto object-cover block"
                loading="lazy"
                decoding="async"
              />

              {/* Crisp SVG Dimension Lines & Arrows (exact 1536x1024 3:2 image space) */}
              <svg
                viewBox="0 0 1536 1024"
                className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  <marker id="dim-arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                    <path d="M 8 2 L 2 5 L 8 8 z" fill="#18181B" />
                  </marker>
                  <marker id="dim-arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                    <path d="M 2 2 L 8 5 L 2 8 z" fill="#18181B" />
                  </marker>
                </defs>

                {/* Left vertical Head Side Height line */}
                <line
                  x1="120" y1="115" x2="120" y2="830"
                  stroke="#18181B" strokeWidth="3"
                  markerStart="url(#dim-arrow-start)" markerEnd="url(#dim-arrow-end)"
                />
                {/* Right vertical Leg Side Height line */}
                <line
                  x1="1410" y1="485" x2="1410" y2="845"
                  stroke="#18181B" strokeWidth="3"
                  markerStart="url(#dim-arrow-start)" markerEnd="url(#dim-arrow-end)"
                />
                {/* Side Bar pointer dot & stem */}
                <circle cx="385" cy="705" r="7" fill="#1F3A2E" stroke="#FFFFFF" strokeWidth="2.5" />
                <line x1="385" y1="712" x2="385" y2="800" stroke="#18181B" strokeWidth="3" />
                {/* Leg Thickness horizontal double arrow & pointer */}
                <line
                  x1="518" y1="885" x2="606" y2="885"
                  stroke="#FFFFFF" strokeWidth="3.5"
                  markerStart="url(#dim-arrow-start)" markerEnd="url(#dim-arrow-end)"
                />
                <line x1="606" y1="900" x2="665" y2="900" stroke="#18181B" strokeWidth="3" />
              </svg>

              {/* Callout: Head Side Height 38" */}
              <div className="hidden sm:flex flex-col items-center absolute left-[2.8%] top-[44%] -translate-y-1/2 pointer-events-none">
                <div className="px-2.5 py-1.5 rounded-lg bg-[#1F3A2E] text-white text-center shadow-md border border-[#C9924A]/60">
                  <p className="text-[9px] leading-tight text-white/85">Head Side</p>
                  <p className="text-[9px] leading-tight text-white/85">Height</p>
                  <p className="font-mono text-sm font-bold text-[#F5C56B] leading-tight mt-0.5">38&quot;</p>
                </div>
              </div>

              {/* Callout: Side Bar 5" x 2" */}
              <div className="hidden sm:block absolute left-[19.5%] bottom-[10%] pointer-events-none">
                <div className="px-3 py-1 rounded-lg bg-[#1F3A2E] text-white text-center shadow-md border border-[#C9924A]/60">
                  <p className="text-[9px] text-white/85 leading-tight">Side Bar</p>
                  <p className="font-mono text-xs font-bold text-[#F5C56B] leading-tight">5&quot; × 2&quot;</p>
                </div>
              </div>

              {/* Callout: Leg Thickness 4" x 4" */}
              <div className="hidden sm:block absolute left-[43%] bottom-[5%] pointer-events-none">
                <div className="px-3 py-1 rounded-lg bg-[#1F3A2E] text-white text-center shadow-md border border-[#C9924A]/60">
                  <p className="text-[9px] text-white/85 leading-tight">Leg Thickness</p>
                  <p className="font-mono text-xs font-bold text-[#F5C56B] leading-tight">4&quot; × 4&quot;</p>
                </div>
              </div>

              {/* Callout: Leg Side Height 20" */}
              <div className="hidden sm:block absolute right-[2%] top-[63%] -translate-y-1/2 pointer-events-none">
                <div className="px-2.5 py-1.5 rounded-lg bg-[#1F3A2E] text-white text-center shadow-md border border-[#C9924A]/60">
                  <p className="text-[9px] leading-tight text-white/85">Leg Side</p>
                  <p className="text-[9px] leading-tight text-white/85">Height</p>
                  <p className="font-mono text-sm font-bold text-[#F5C56B] leading-tight mt-0.5">20&quot;</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Editorial Spec Summary */}
          <motion.div
            {...fade(0.1)}
            className="lg:col-span-5 lg:border-l lg:border-[#E5DCCF] lg:pl-10 space-y-5"
          >
            <div className="inline-flex items-center gap-3 text-xs font-mono tracking-[0.2em] text-[#7A6348] uppercase">
              <span>Premium Teak Wood</span>
              <span className="w-10 h-px bg-[#C9924A]" aria-hidden="true" />
            </div>

            <div>
              <h3 className="font-serif text-4xl sm:text-5xl font-semibold text-[#18181B] leading-[1.08]">
                Solid Wood Cot
              </h3>
              <p className="mt-2 text-base font-medium text-[#3F3A34] tracking-wide">
                Strong <span className="text-[#C9924A]">•</span> Durable{' '}
                <span className="text-[#C9924A]">•</span> Elegant
              </p>
            </div>

            <p className="text-sm sm:text-base text-[#57534E] leading-relaxed max-w-md">
              Tamil Nadu crafted solid wood cot with heavy-duty structure and lasting strength
              for your home.
            </p>

            <button
              type="button"
              onClick={handleExplore}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1F3A2E] text-white text-sm font-semibold shadow-md hover:bg-[#162920] transition-colors cursor-pointer"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </motion.div>
        </div>

        {/* 4-Card Detail Strip (Image top + clean label footer below) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DETAIL_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              {...fade(i * 0.06)}
              className="rounded-2xl overflow-hidden border-2 border-white bg-[#FAF6EE] shadow-sm flex flex-col"
            >
              <div className="h-36 sm:h-40 w-full overflow-hidden bg-[#F7F2E8] flex items-center justify-center">
                <img
                  src={card.image}
                  alt={card.alt}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="py-3 px-3 text-center bg-gradient-to-b from-white to-[#FAF6EE]">
                <p className="text-xs font-semibold text-[#18181B] leading-tight">
                  {card.label}
                </p>
                <p
                  className={
                    card.valueSmall
                      ? 'text-xs font-semibold text-[#18181B] leading-tight mt-0.5'
                      : 'font-mono text-base font-bold text-[#18181B] leading-tight mt-0.5'
                  }
                >
                  {card.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Full-Width Green Spec Banner */}
        <motion.div
          {...fade(0.1)}
          className="rounded-full bg-[#1F3A2E] text-white px-5 py-3 flex items-center justify-center gap-2.5 text-center shadow-sm"
        >
          <span className="w-5 h-5 rounded-full border border-[#F5C56B]/60 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-[#F5C56B]" aria-hidden="true" />
          </span>
          <p className="text-xs sm:text-sm font-semibold tracking-wide">
            Full Bed Base: 18 mm Plywood with Bottom Cross Support (4 Cross Bars)
          </p>
        </motion.div>

        {/* Bottom 3-Column Bed Size & Center Bar Rule */}
        <motion.div
          {...fade(0.15)}
          className="rounded-full border border-[#D8CBB8] bg-[#FAF6EE] px-4 py-2.5 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#D8CBB8]"
        >
          {CENTER_BAR_RULES.map((item) => (
            <div
              key={item.size}
              className="flex items-center justify-center gap-2 py-2 sm:py-0 px-3 text-xs sm:text-sm"
            >
              <span className="px-3 py-1 rounded-full bg-[#1F3A2E] text-white font-semibold">
                {item.size}
              </span>
              <span className="text-[#7A6348]">—</span>
              <span className="font-semibold text-[#B91C1C]">{item.rule}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
