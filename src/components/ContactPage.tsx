import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Mail, MapPin, Phone, Clock, CheckCircle2 } from 'lucide-react';

const OFFICES = [
  {
    city: 'Pollachi Workshop',
    address: 'No. 14, Timber Guild Road, Pollachi — 642 001',
    phone: '+91 94430 00011',
    email: 'pollachi@teakinfurnitures.in',
    hours: 'Mon–Sat 8am–6pm',
  },
  {
    city: 'Karaikudi Studio',
    address: '7, Semponnar Nagar, Karaikudi — 630 002',
    phone: '+91 94430 00022',
    email: 'karaikudi@teakinfurnitures.in',
    hours: 'Mon–Sat 9am–5pm',
  },
];

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const fade = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.55, delay, ease: "easeOut" as import("motion/react").Easing } };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // shortcut: form submission is a UI demo (no backend endpoint yet)
    setSubmitted(true);
    setName(''); setEmail(''); setPhone(''); setMessage('');
  };

  return (
    <div className="bg-[#FAFAF8]">
      {/* Page header */}
      <div className="bg-[#1F3A2E] text-white py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.p {...fade()} className="text-xs font-mono tracking-[0.2em] text-[#C9924A] uppercase mb-3">
            Get in Touch
          </motion.p>
          <motion.h1 {...fade(0.1)} className="font-serif text-4xl sm:text-6xl font-semibold leading-tight max-w-xl">
            Visit the workshop, or write to us.
          </motion.h1>
          <motion.p {...fade(0.2)} className="mt-5 text-sm text-white/60 max-w-lg">
            Custom dimensions, special wood species, bespoke carving — we answer every enquiry
            personally. Response within one business day.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-24 grid lg:grid-cols-2 gap-14 lg:gap-24">
        {/* Form */}
        <motion.div {...fade()}>
          <h2 className="font-serif text-2xl font-semibold text-[#18181B] mb-7">Send an enquiry</h2>

          {submitted ? (
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#F0FFF4] border border-[#86EFAC]">
              <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#15803D]">Thank you for reaching out!</p>
                <p className="text-sm text-[#166534] mt-1">
                  We'll get back to you within one business day. For urgent enquiries, call either
                  workshop directly.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-medium text-[#18181B] mb-1.5">
                    Full name <span aria-hidden="true" className="text-[#B91C1C]">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Meenakshi Rajan"
                    className="w-full h-11 px-4 rounded-xl border border-[#E6E4DE] bg-white text-sm focus:outline-none focus:border-[#1F3A2E] transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-xs font-medium text-[#18181B] mb-1.5">
                    Phone number
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-11 px-4 rounded-xl border border-[#E6E4DE] bg-white text-sm focus:outline-none focus:border-[#1F3A2E] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-xs font-medium text-[#18181B] mb-1.5">
                  Email address <span aria-hidden="true" className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="meenakshi@example.com"
                  className="w-full h-11 px-4 rounded-xl border border-[#E6E4DE] bg-white text-sm focus:outline-none focus:border-[#1F3A2E] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-medium text-[#18181B] mb-1.5">
                  Message <span aria-hidden="true" className="text-[#B91C1C]">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about the frame you have in mind — dimensions, wood species, delivery location, timeline…"
                  className="w-full px-4 py-3 rounded-xl border border-[#E6E4DE] bg-white text-sm focus:outline-none focus:border-[#1F3A2E] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#1F3A2E] text-white text-sm font-semibold hover:bg-[#162920] transition-colors cursor-pointer"
              >
                Send Enquiry
              </button>
            </form>
          )}
        </motion.div>

        {/* Info */}
        <div className="space-y-10">
          {OFFICES.map((office, i) => (
            <motion.div key={office.city} {...fade(i * 0.1)} className="bg-[#F3F2EE] rounded-2xl p-7 space-y-4">
              <h3 className="font-serif text-xl font-semibold text-[#18181B]">{office.city}</h3>
              <div className="space-y-3 text-sm text-[#57534E]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C9924A] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{office.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#C9924A] shrink-0" aria-hidden="true" />
                  <a href={`tel:${office.phone.replace(/\s/g, '')}`} className="hover:text-[#1F3A2E] transition-colors">
                    {office.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#C9924A] shrink-0" aria-hidden="true" />
                  <a href={`mailto:${office.email}`} className="hover:text-[#1F3A2E] transition-colors">
                    {office.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#C9924A] shrink-0" aria-hidden="true" />
                  <span>{office.hours}</span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Quick facts */}
          <motion.div {...fade(0.2)} className="border border-[#E6E4DE] rounded-2xl p-7">
            <h3 className="font-semibold text-[#18181B] text-sm mb-5">Frequently asked</h3>
            <div className="space-y-4 text-sm text-[#57534E]">
              {[
                ['How long does delivery take?', '10–14 working days workshop lead time. White-glove delivery across India.'],
                ['Can I order custom dimensions?', 'Yes. Standard surcharge applies for sizes beyond Super King. Contact us with your room measurements.'],
                ['Do you deliver outside Tamil Nadu?', 'Yes — all of India. Free delivery for orders above ₹50,000 within Tamil Nadu.'],
              ].map(([q, a]) => (
                <div key={q}>
                  <p className="font-semibold text-[#18181B] mb-1">{q}</p>
                  <p className="leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
