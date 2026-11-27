import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDownRight, ArrowRight, Check } from 'lucide-react';
import { ResilientImage } from './ResilientImage.tsx';

interface TimberSpeciesSpec {
  id: string;
  speciesFilterValue: string;
  productId: string;
  name: string;
  tamilName: string;
  region: string;
  densityKgM3: number;
  oilFinish: string;
  climateNote: string;
  bestFor: string;
  imageUrl: string;
  headSideHeightIn: string;
  legSideHeightIn: string;
  sideBarSize: string;
  legThickness: string;
  baseSpec: string;
  crossBarsCount: number;
  swatchPrimary: string;
  swatchGrain: string;
  swatchHighlight: string;
}

const TAMIL_NADU_TIMBERS: TimberSpeciesSpec[] = [
  {
    id: 'teak',
    speciesFilterValue: 'Teak Wood (Burma Thekku)',
    productId: 'prod-chettinad-teak',
    name: 'Burma Teak Wood',
    tamilName: 'Thekku',
    region: 'Karaikudi & Pollachi Guilds',
    densityKgM3: 660,
    oilFinish: 'Cold-pressed linseed & beeswax',
    climateNote:
      'Naturally rich in tectoquinone oil, making it impervious to coastal Chennai humidity and wood-borers for 50+ years.',
    bestFor: 'Carved Chettinad Headboards & Four-Poster Canopies',
    imageUrl: '/src/assets/images/tn_burma_teak_cot_1795072557358.jpg',
    headSideHeightIn: '44"',
    legSideHeightIn: '20"',
    sideBarSize: '5" × 2"',
    legThickness: '4" × 4"',
    baseSpec: '18 mm Solid Teak Slats / Deck Base',
    crossBarsCount: 4,
    swatchPrimary: '#9C662B',
    swatchGrain: '#4E2B0C',
    swatchHighlight: '#C9924A',
  },
  {
    id: 'mahogany',
    speciesFilterValue: 'Mahogany Wood',
    productId: 'prod-madurai-mahogany',
    name: 'Indian Mahogany Wood',
    tamilName: 'Mahogany Maram',
    region: 'Madurai & Salem Seasoning Yards',
    densityKgM3: 720,
    oilFinish: 'Deep reddish-amber French polish',
    climateNote:
      'Straight-grained reddish-brown heartwood prized for heirloom spindle headboards, platform frames, and storage cots.',
    bestFor: 'Spindle Headboards, Platform Frames & Captain Storage Cots',
    imageUrl: '/src/assets/images/tn_mahogany_diwan_1795072558300.jpg',
    headSideHeightIn: '39"',
    legSideHeightIn: '18"',
    sideBarSize: '4.5" × 2"',
    legThickness: '3.5" × 3.5"',
    baseSpec: '18 mm Solid Mahogany Slats',
    crossBarsCount: 4,
    swatchPrimary: '#6E2B20',
    swatchGrain: '#38120B',
    swatchHighlight: '#9A4837',
  },
];

interface TimberAtelierSectionProps {
  onFilterBySpecies: (speciesName: string) => void;
  onInspectProductById: (productId: string) => void;
}

export function TimberAtelierSection({
  onFilterBySpecies,
  onInspectProductById,
}: TimberAtelierSectionProps) {
  const [selectedId, setSelectedId] = useState<string>('teak');
  const shouldReduceMotion = useReducedMotion();

  const active = TAMIL_NADU_TIMBERS.find((t) => t.id === selectedId) || TAMIL_NADU_TIMBERS[0];

  return (
    <section className="bg-[#161513] text-[#F5F3EE] py-16 lg:py-22 border-y border-[#2A2723] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#C9924A]">
              Tamil Nadu Timber Blueprint · Solid Wood Frame Specifications
            </p>
            <h2
              className="font-serif text-3xl sm:text-5xl font-semibold text-[#FAFAF8] mt-2 leading-[1.08]"
              style={{ textWrap: 'balance' }}
            >
              Exact timber dimensions &amp; heartwood engineering.
            </h2>
          </div>
          <p className="text-sm text-[#B8B2A8] max-w-md leading-relaxed">
            Inspect headboard height, leg side height, 5&quot; × 2&quot; side bars, 4&quot; × 4&quot;
            corner legs, and width-matched center support bars—built from bare solid wood only.
          </p>
        </div>

        {/* Interactive Blueprint + Tamil Nadu Timber Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Cols: Reference-Style Annotated Product Dimension Blueprint */}
          <div className="lg:col-span-7 space-y-4">
            <motion.div
              key={active.id}
              initial={shouldReduceMotion ? false : { opacity: 0.7, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-xl border border-white/15 bg-[#F3F2EE] overflow-hidden"
            >
              <div className="aspect-[4/3] w-full relative">
                <ResilientImage
                  src={active.imageUrl}
                  alt={`${active.name} solid wood cot frame architectural specification`}
                  fallbackLabel={active.name}
                  className="w-full h-full object-cover"
                />

                {/* Dimension Overlay Callouts matching the Reference Blueprint */}
                <div className="absolute inset-0 pointer-events-none select-none">
                  {/* Left Vertical Callout: Head Side Height */}
                  <div className="hidden sm:flex absolute left-4 top-[14%] bottom-[22%] items-center gap-2">
                    <div className="h-full w-4 flex flex-col items-center justify-between py-1">
                      <span className="w-3 h-px bg-[#18181B]" />
                      <span className="w-px flex-1 bg-[#18181B]/85" />
                      <span className="w-3 h-px bg-[#18181B]" />
                    </div>
                    <div className="px-2.5 py-2 rounded-lg bg-[#162920]/95 text-white border border-white/20 shadow-md text-center">
                      <p className="text-[10px] leading-tight text-white/85">Head Side</p>
                      <p className="text-[10px] leading-tight text-white/85">Height</p>
                      <p className="font-mono text-sm font-bold text-[#E6B86A] tabular-nums mt-0.5">
                        {active.headSideHeightIn}
                      </p>
                    </div>
                  </div>

                  {/* Right Vertical Callout: Leg Side Height */}
                  <div className="hidden sm:flex absolute right-4 top-[48%] bottom-[12%] items-center gap-2">
                    <div className="px-2.5 py-2 rounded-lg bg-[#162920]/95 text-white border border-white/20 shadow-md text-center">
                      <p className="text-[10px] leading-tight text-white/85">Leg Side</p>
                      <p className="text-[10px] leading-tight text-white/85">Height</p>
                      <p className="font-mono text-sm font-bold text-[#E6B86A] tabular-nums mt-0.5">
                        {active.legSideHeightIn}
                      </p>
                    </div>
                    <div className="h-full w-4 flex flex-col items-center justify-between py-1">
                      <span className="w-3 h-px bg-[#18181B]" />
                      <span className="w-px flex-1 bg-[#18181B]/85" />
                      <span className="w-3 h-px bg-[#18181B]" />
                    </div>
                  </div>

                  {/* Bottom Left Callout: Side Bar */}
                  <div className="absolute left-4 sm:left-[20%] bottom-3 flex flex-col items-center">
                    <div className="w-px h-4 bg-[#18181B]/85" />
                    <div className="px-3 py-1.5 rounded-lg bg-[#162920]/95 text-white border border-white/20 shadow-md text-center">
                      <p className="text-[10px] text-white/85">Side Bar</p>
                      <p className="font-mono text-xs font-bold text-[#E6B86A] tabular-nums">
                        {active.sideBarSize}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Right Callout: Leg Thickness */}
                  <div className="absolute right-4 sm:right-[22%] bottom-3 flex flex-col items-center">
                    <div className="w-px h-4 bg-[#18181B]/85" />
                    <div className="px-3 py-1.5 rounded-lg bg-[#162920]/95 text-white border border-white/20 shadow-md text-center">
                      <p className="text-[10px] text-white/85">Leg Thickness</p>
                      <p className="font-mono text-xs font-bold text-[#E6B86A] tabular-nums">
                        {active.legThickness}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Height Strip */}
              <div className="sm:hidden grid grid-cols-2 divide-x divide-[#E6E4DE] border-t border-[#E6E4DE] bg-[#162920] text-white text-center text-xs">
                <div className="py-2 px-3">
                  <span className="text-white/80">Head Side: </span>
                  <span className="font-mono font-bold text-[#E6B86A] tabular-nums">
                    {active.headSideHeightIn}
                  </span>
                </div>
                <div className="py-2 px-3">
                  <span className="text-white/80">Leg Side: </span>
                  <span className="font-mono font-bold text-[#E6B86A] tabular-nums">
                    {active.legSideHeightIn}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* 4 Structural Close-Up Detail Boxes (Directly Below Photo) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Detail 1: Side Bar */}
              <div className="rounded-xl border border-white/15 bg-[#FAFAF8] overflow-hidden flex flex-col">
                <div className="h-24 bg-[#F3F2EE] flex items-center justify-center p-3 border-b border-[#E6E4DE]">
                  <svg viewBox="0 0 120 70" className="w-full h-full" aria-hidden="true">
                    <polygon points="10,22 105,12 110,44 15,56" fill={active.swatchPrimary} stroke={active.swatchGrain} strokeWidth="1.5" />
                    <polygon points="10,22 105,12 95,8 5,18" fill={active.swatchHighlight} stroke={active.swatchGrain} strokeWidth="1" />
                    <line x1="62" y1="16" x2="64" y2="50" stroke="#FAFAF8" strokeWidth="2" />
                    <polygon points="62,15 59,21 65,21" fill="#FAFAF8" />
                    <polygon points="64,51 61,45 67,45" fill="#FAFAF8" />
                  </svg>
                </div>
                <div className="p-2.5 text-center bg-[#162920] text-white">
                  <p className="text-[11px] text-white/85">Side Bar</p>
                  <p className="font-mono text-xs font-bold text-[#E6B86A] tabular-nums">
                    {active.sideBarSize}
                  </p>
                </div>
              </div>

              {/* Detail 2: Leg Thickness */}
              <div className="rounded-xl border border-white/15 bg-[#FAFAF8] overflow-hidden flex flex-col">
                <div className="h-24 bg-[#F3F2EE] flex items-center justify-center p-3 border-b border-[#E6E4DE]">
                  <svg viewBox="0 0 120 70" className="w-full h-full" aria-hidden="true">
                    <rect x="42" y="8" width="32" height="50" fill={active.swatchPrimary} stroke={active.swatchGrain} strokeWidth="1.5" />
                    <rect x="74" y="8" width="12" height="46" fill={active.swatchGrain} stroke={active.swatchGrain} strokeWidth="1.2" />
                    <line x1="40" y1="63" x2="76" y2="63" stroke="#18181B" strokeWidth="1.75" />
                    <polygon points="39,63 45,60 45,66" fill="#18181B" />
                    <polygon points="77,63 71,60 71,66" fill="#18181B" />
                  </svg>
                </div>
                <div className="p-2.5 text-center bg-[#162920] text-white">
                  <p className="text-[11px] text-white/85">Leg Thickness</p>
                  <p className="font-mono text-xs font-bold text-[#E6B86A] tabular-nums">
                    {active.legThickness}
                  </p>
                </div>
              </div>

              {/* Detail 3: 2 Center Supporting Bars */}
              <div className="rounded-xl border border-white/15 bg-[#FAFAF8] overflow-hidden flex flex-col">
                <div className="h-24 bg-[#F3F2EE] flex items-center justify-center p-3 border-b border-[#E6E4DE]">
                  <svg viewBox="0 0 120 70" className="w-full h-full" aria-hidden="true">
                    <polygon points="15,14 105,14 114,56 6,56" fill="#D4B48C" stroke={active.swatchGrain} strokeWidth="1.5" />
                    <line x1="12" y1="28" x2="108" y2="28" stroke={active.swatchGrain} strokeWidth="1.5" />
                    <line x1="9" y1="42" x2="111" y2="42" stroke={active.swatchGrain} strokeWidth="1.5" />
                    <rect x="41" y="14" width="6" height="42" fill={active.swatchPrimary} stroke="#2A1708" strokeWidth="1" />
                    <rect x="73" y="14" width="6" height="42" fill={active.swatchPrimary} stroke="#2A1708" strokeWidth="1" />
                  </svg>
                </div>
                <div className="p-2.5 text-center bg-[#162920] text-white">
                  <p className="text-[11px] text-white/85">2 Center</p>
                  <p className="font-mono text-xs font-bold text-[#E6B86A]">
                    Supporting Bars
                  </p>
                </div>
              </div>

              {/* Detail 4: 18 mm Base */}
              <div className="rounded-xl border border-white/15 bg-[#FAFAF8] overflow-hidden flex flex-col">
                <div className="h-24 bg-[#F3F2EE] flex items-center justify-center p-3 border-b border-[#E6E4DE]">
                  <svg viewBox="0 0 120 70" className="w-full h-full" aria-hidden="true">
                    <polygon points="16,32 76,14 108,30 48,48" fill={active.swatchHighlight} stroke={active.swatchGrain} strokeWidth="1.3" />
                    <polygon points="16,32 48,48 48,58 16,42" fill={active.swatchPrimary} stroke={active.swatchGrain} strokeWidth="1.3" />
                    <polygon points="48,48 108,30 108,40 48,58" fill={active.swatchGrain} stroke={active.swatchGrain} strokeWidth="1.3" />
                  </svg>
                </div>
                <div className="p-2.5 text-center bg-[#162920] text-white">
                  <p className="text-[11px] text-white/85">18 mm Solid</p>
                  <p className="font-mono text-xs font-bold text-[#E6B86A]">
                    Timber Base Deck
                  </p>
                </div>
              </div>
            </div>

            {/* Full Bed Base Banner */}
            <div className="px-4 py-3 rounded-xl bg-[#162920] text-white flex items-center justify-center gap-2.5 text-xs sm:text-sm font-medium text-center border border-white/15">
              <Check className="w-4 h-4 text-[#E6B86A] shrink-0" aria-hidden="true" />
              <span>
                Full Bed Base: {active.baseSpec} with Bottom Cross Support ({active.crossBarsCount} Cross Bars)
              </span>
            </div>

            {/* 3-Column Width Support Rule Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 rounded-xl border border-[#E6E4DE] bg-white text-[#18181B] divide-y sm:divide-y-0 sm:divide-x divide-[#E6E4DE] text-xs">
              <div className="px-4 py-3 flex items-center justify-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#162920] text-white font-mono text-[11px]">
                  4 ft Bed
                </span>
                <span className="text-[#57534E]">—</span>
                <span className="font-semibold text-[#9A3412]">No Center Bar</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#162920] text-white font-mono text-[11px]">
                  5 ft Bed
                </span>
                <span className="text-[#57534E]">—</span>
                <span className="font-semibold text-[#9A3412]">1 Center Bar</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#162920] text-white font-mono text-[11px]">
                  6 ft Bed
                </span>
                <span className="text-[#57534E]">—</span>
                <span className="font-semibold text-[#9A3412]">2 Center Bars</span>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Tamil Nadu Heartwood Selector & Direct Full View Launch */}
          <div className="lg:col-span-5 space-y-6">
            <div className="divide-y divide-white/10 border-y border-white/10">
              {TAMIL_NADU_TIMBERS.map((timber, idx) => {
                const isSelected = timber.id === active.id;
                return (
                  <button
                    key={timber.id}
                    type="button"
                    onClick={() => setSelectedId(timber.id)}
                    className={`group w-full text-left py-4 px-4 transition-colors flex items-center justify-between gap-4 cursor-pointer ${
                      isSelected ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-11 h-11 rounded-lg border border-white/15 shrink-0 transition-transform duration-200 group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${timber.swatchPrimary} 0%, ${timber.swatchGrain} 100%)`,
                        }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#9E978D]">
                          <span className="font-mono">0{idx + 1}.</span>
                          <span className="truncate">{timber.region}</span>
                        </div>
                        <p className="font-serif text-xl font-semibold text-[#FAFAF8] mt-0.5">
                          {timber.name}{' '}
                          <span className="text-sm font-normal text-[#B8B2A8]">
                            · {timber.tamilName}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-xs text-[#FAFAF8] tabular-nums">
                        {timber.densityKgM3} kg/m³
                      </p>
                      <p className="text-[11px] text-[#C9924A] mt-0.5">
                        {isSelected ? 'Active Spec' : 'Inspect'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-[#1F1D1A] border border-white/10 rounded-xl p-6 space-y-5">
              <div>
                <p className="text-xs font-medium text-[#C9924A]">
                  {active.name} ({active.tamilName}) · {active.region}
                </p>
                <p className="text-sm text-[#E5E1D8] leading-relaxed mt-2">
                  {active.climateNote}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <p className="text-[#9E978D]">Recommended Frame</p>
                  <p className="font-medium text-[#FAFAF8] mt-1">{active.bestFor}</p>
                </div>
                <div>
                  <p className="text-[#9E978D]">Oil &amp; Wax Finish</p>
                  <p className="font-medium text-[#FAFAF8] mt-1">{active.oilFinish}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onInspectProductById(active.productId)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#FAFAF8] text-[#161513] text-xs font-semibold hover:bg-[#E6E4DE] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Open Full Product View</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onFilterBySpecies(active.speciesFilterValue)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-white/20 text-[#FAFAF8] text-xs font-semibold hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Filter {active.name}</span>
                  <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
