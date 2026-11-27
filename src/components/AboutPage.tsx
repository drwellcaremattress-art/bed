import { motion, useReducedMotion } from 'motion/react';
import { ResilientImage } from './ResilientImage.tsx';

const HERO_IMAGE = '/src/assets/images/craft_wood_joinery_1795071999133.jpg';
const BED1_IMAGE = '/src/assets/images/bed_atelier_canopy_1795071997221.jpg';
const BED2_IMAGE = '/src/assets/images/bed_nordic_oak_1795071997764.jpg';

const MILESTONES = [
  { year: '1962', event: 'Founded in Pollachi by M. Subramaniam, a master carpenter trained in Chettinad joinery.' },
  { year: '1978', event: 'Expanded to Karaikudi workshop. Introduced kiln-seasoning chambers for all timber stock.' },
  { year: '1995', event: 'Partnered with Tamil Nadu Timber Guild — 100% traceable sourcing of all hardwoods.' },
  { year: '2008', event: 'Standardized our 15 signature cot models exclusively in Teak Wood and Mahogany Wood.' },
  { year: '2024', event: 'Launched white-glove pan-India delivery. Same joinery. No veneers. Never.' },
];

const TEAM = [
  { name: 'Karthik Subramaniam', role: 'Master Carpenter, 3rd Generation', note: 'Trained under his grandfather in wedged mortise and tenon at age 12.' },
  { name: 'Saranya Murugan', role: 'Timber Sourcing & Guild Relations', note: 'Personally inspects every kiln batch from Pollachi and Karaikudi suppliers.' },
  { name: 'Vignesh Palani', role: 'Quality & Load Testing', note: 'Oversees static load testing to 400 kg before any frame leaves the yard.' },
];

export function AboutPage() {
  const shouldReduceMotion = useReducedMotion();
  const fade = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay, ease: "easeOut" as import("motion/react").Easing } };

  return (
    <div className="bg-[#FAFAF8]">
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[380px] overflow-hidden">
        <ResilientImage
          src={HERO_IMAGE}
          alt="Craftsman working mortise and tenon joint"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1A14]/70 via-[#0E1A14]/20 to-transparent" />
        <div className="absolute bottom-10 left-6 sm:left-16">
          <motion.p {...fade()} className="text-xs font-mono tracking-[0.2em] text-[#C9924A] uppercase mb-2">
            Our Story
          </motion.p>
          <motion.h1 {...fade(0.1)} className="font-serif text-4xl sm:text-6xl font-semibold text-white leading-tight max-w-xl">
            Three generations.<br />One craft.
          </motion.h1>
        </div>
      </div>

      {/* Intro */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-20 sm:py-28">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20 items-start">
          <motion.div {...fade()}>
            <p className="text-xs font-mono tracking-[0.2em] text-[#C9924A] uppercase mb-3">Who we are</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#18181B] leading-snug">
              A workshop, not a factory.
            </h2>
          </motion.div>
          <motion.div {...fade(0.1)} className="space-y-4 text-sm text-[#57534E] leading-relaxed">
            <p>
              Teak-In-Furnitures was founded in 1962 in Pollachi, Tamil Nadu, by M. Subramaniam —
              a master carpenter who had spent two decades perfecting wedged mortise-and-tenon
              joinery in the Chettinad tradition. Every frame reflects two things he believed in
              absolutely: seasoned timber, and honest joints.
            </p>
            <p>
              Three generations later, nothing essential has changed. We still season every log
              in our own kilns, we still hand-plane every frame to ±0.5 mm, and we still refuse
              to glue, screw, or veneer our way past a problem. If a joint needs a shortcut, we
              remake it.
            </p>
            <p>
              Today we craft 15 signature cot models exclusively in solid Teak Wood and
              Mahogany Wood — all sourced from certified Tamil Nadu suppliers we have worked
              with for more than 25 years.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Images strip */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pb-20">
        <div className="grid sm:grid-cols-2 gap-5">
          <motion.div {...fade()} className="aspect-[4/3] rounded-2xl overflow-hidden">
            <ResilientImage src={BED1_IMAGE} alt="Canopy cot frame" className="w-full h-full object-cover" />
          </motion.div>
          <motion.div {...fade(0.1)} className="aspect-[4/3] rounded-2xl overflow-hidden mt-0 sm:mt-10">
            <ResilientImage src={BED2_IMAGE} alt="Nordic oak platform bed" className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-[#1F3A2E] py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
          <motion.div {...fade()} className="mb-14">
            <p className="text-xs font-mono tracking-[0.2em] text-[#C9924A] uppercase mb-3">Our History</p>
            <h2 className="font-serif text-4xl font-semibold text-white">Milestones</h2>
          </motion.div>
          <div className="relative border-l border-white/20 pl-10 space-y-10">
            {MILESTONES.map((m, i) => (
              <motion.div key={m.year} {...fade(i * 0.1)} className="relative">
                <div className="absolute -left-[41px] w-4 h-4 rounded-full border-2 border-[#C9924A] bg-[#1F3A2E]" />
                <p className="font-mono text-sm text-[#C9924A] mb-1">{m.year}</p>
                <p className="text-sm text-white/70 leading-relaxed">{m.event}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 sm:py-28">
        <motion.div {...fade()} className="mb-12">
          <p className="text-xs font-mono tracking-[0.2em] text-[#C9924A] uppercase mb-3">The People</p>
          <h2 className="font-serif text-4xl font-semibold text-[#18181B]">The Workshop Team</h2>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-8">
          {TEAM.map((member, i) => (
            <motion.div key={member.name} {...fade(i * 0.1)} className="bg-[#F3F2EE] rounded-2xl p-7">
              <div className="w-14 h-14 rounded-full bg-[#1F3A2E]/10 flex items-center justify-center mb-5">
                <span className="font-serif text-2xl font-semibold text-[#1F3A2E]">{member.name[0]}</span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#18181B]">{member.name}</h3>
              <p className="text-xs text-[#C9924A] font-mono tracking-wide mt-0.5 mb-3">{member.role}</p>
              <p className="text-sm text-[#57534E] leading-relaxed">{member.note}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
