import { useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Minus, Plus, Trash2, X } from 'lucide-react';
import type { CartItem, Order, PaymentMethod, WoodBedProduct } from '../types/inventory.ts';
import { formatCurrency, storeApi } from '../lib/storeApi.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  products: WoodBedProduct[];
  onClose: () => void;
  onUpdateQty: (variantId: string, nextQty: number) => void;
  onRemoveItem: (variantId: string) => void;
  onOrderCompleted: (order: Order) => void;
  onViewOrderTracking: (orderNumber: string) => void;
}

export function CartDrawer({
  isOpen,
  cart,
  products,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onOrderCompleted,
  onViewOrderTracking,
}: CartDrawerProps) {
  const [step, setStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const getMaxStock = (variantId: string): number => {
    for (const p of products) {
      const v = p.variants.find((item) => item.id === variantId);
      if (v) return v.stockQuantity;
    }
    return 0;
  };

  const subtotalCents = cart.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  // Complimentary across Tamil Nadu for orders >= ₹50,000 (5,000,000 paise), else ₹1,800
  const deliveryCents = subtotalCents === 0 || subtotalCents >= 5000000 ? 0 : 180000;
  const totalCents = subtotalCents + deliveryCents;

  const handleClose = () => {
    if (step === 'confirmed') {
      setStep('bag');
      setConfirmedOrder(null);
    }
    setErrorMsg('');
    onClose();
  };

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const order = await storeApi.placeOrder({
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        postalCode,
        paymentMethod,
        notes,
        items: cart.map((c) => ({ variantId: c.variantId, quantity: c.quantity })),
      });
      setConfirmedOrder(order);
      setStep('confirmed');
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setShippingAddress('');
      setPostalCode('');
      setNotes('');
      onOrderCompleted(order);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to complete order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag and Tamil Nadu Checkout"
        className="w-full max-w-lg bg-[#FAFAF8] h-full border-l border-[#E6E4DE] flex flex-col justify-between shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-[#E6E4DE] bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setStep('bag');
                }}
                aria-label="Back to bag"
                className="p-1.5 rounded-lg hover:bg-[#F3F2EE] text-[#18181B] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-serif text-2xl font-semibold text-[#18181B]">
              {step === 'bag'
                ? 'Your Bag'
                : step === 'checkout'
                  ? 'Tamil Nadu Delivery'
                  : 'Order Confirmed'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close bag drawer"
            className="w-9 h-9 rounded-lg border border-[#E6E4DE] flex items-center justify-center text-[#18181B] hover:bg-[#F3F2EE] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'confirmed' && confirmedOrder ? (
            <div className="space-y-6">
              <div className="p-5 bg-white border border-[#E6E4DE] rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-[#1F3A2E]">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    Order #{confirmedOrder.orderNumber} Confirmed — Preparing Timber Dispatch
                  </span>
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Workshop stock has been reserved and deducted from our inventory ledger. Our Tamil Nadu carpenter team will reach out to{' '}
                  <span className="font-medium text-[#18181B]">{confirmedOrder.customerEmail}</span>.
                </p>
              </div>

              <div className="bg-white border border-[#E6E4DE] rounded-xl divide-y divide-[#E6E4DE]">
                <div className="px-4 py-3 text-xs font-semibold text-[#18181B]">
                  Order Summary
                </div>
                {confirmedOrder.items.map((item) => (
                  <div key={item.id} className="px-4 py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-[#18181B]">{item.productName}</p>
                      <p className="text-[#57534E] font-mono mt-0.5">
                        {item.sizeLabel} · {item.sku} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono font-medium tabular-nums text-[#18181B]">
                      {formatCurrency(item.unitPriceCents * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="px-4 py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#57534E]">
                    <span>Tamil Nadu Carpenter Delivery</span>
                    <span className="font-mono tabular-nums">
                      {confirmedOrder.deliveryCents === 0
                        ? 'Complimentary'
                        : formatCurrency(confirmedOrder.deliveryCents)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-sm text-[#18181B]">
                    <span>Total ({confirmedOrder.paymentMethod})</span>
                    <span className="font-mono tabular-nums">
                      {formatCurrency(confirmedOrder.totalCents)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const orderNo = confirmedOrder.orderNumber;
                    handleClose();
                    onViewOrderTracking(orderNo);
                  }}
                  className="flex-1 h-11 rounded-lg bg-[#1F3A2E] text-white text-xs font-semibold hover:bg-[#162920] cursor-pointer"
                >
                  Track Order #{confirmedOrder.orderNumber}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-11 px-4 rounded-lg border border-[#E6E4DE] bg-white text-xs font-semibold text-[#18181B] hover:bg-[#F3F2EE] cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <p className="font-serif text-2xl font-medium text-[#18181B]">Your bag is empty</p>
              <p className="text-sm text-[#57534E] mt-2 max-w-xs">
                Select a solid Tamil Nadu hardwood cot frame to reserve workshop stock.
              </p>
            </div>
          ) : step === 'bag' ? (
            <div className="space-y-4">
              {cart.map((item) => {
                const maxStock = getMaxStock(item.variantId);
                return (
                  <div
                    key={item.variantId}
                    className="p-3.5 bg-white border border-[#E6E4DE] rounded-xl flex gap-4"
                  >
                    <div className="w-24 h-20 rounded-lg overflow-hidden bg-[#F3F2EE] shrink-0 border border-[#E6E4DE]">
                      <ResilientImage
                        src={item.imageUrl}
                        alt={item.productName}
                        fallbackLabel={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-[#18181B] truncate">
                            {item.productName}
                          </h3>
                          <p className="text-xs text-[#57534E] mt-0.5">
                            {item.sizeLabel} · {item.woodSpecies}
                          </p>
                          <p className="font-mono text-[11px] text-[#57534E] mt-0.5">
                            {item.sku} · {maxStock} available
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.variantId)}
                          aria-label={`Remove ${item.productName}`}
                          className="p-1.5 text-[#57534E] hover:text-[#B91C1C] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="inline-flex items-center border border-[#E6E4DE] rounded-lg bg-[#FAFAF8]">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.variantId, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="w-8 h-8 flex items-center justify-center text-[#18181B] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-mono text-xs tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= maxStock}
                            onClick={() => onUpdateQty(item.variantId, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="w-8 h-8 flex items-center justify-center text-[#18181B] disabled:opacity-35 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-mono text-sm font-semibold tabular-nums text-[#18181B]">
                          {formatCurrency(item.unitPriceCents * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Aravindhan Natarajan"
                  className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] bg-white text-sm focus:outline-none focus:border-[#1F3A2E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="aravind@example.com"
                    className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] bg-white text-sm focus:outline-none focus:border-[#1F3A2E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] bg-white text-sm focus:outline-none focus:border-[#1F3A2E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                    Delivery Address (Tamil Nadu)
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="24 Anna Nagar East, Chennai, Tamil Nadu"
                    className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] bg-white text-sm focus:outline-none focus:border-[#1F3A2E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="600102"
                    className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] bg-white text-sm font-mono focus:outline-none focus:border-[#1F3A2E]"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#18181B] mb-1.5">
                  Payment Method
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Card', 'Cash on Delivery'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`h-10 px-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        paymentMethod === method
                          ? 'border-[#1F3A2E] bg-[#1F3A2E]/5 text-[#18181B]'
                          : 'border-[#E6E4DE] bg-white text-[#57534E] hover:text-[#18181B]'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                  Carpenter Assembly Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Floor access, preferred delivery window..."
                  className="w-full px-3 py-2 rounded-lg border border-[#E6E4DE] bg-white text-sm focus:outline-none focus:border-[#1F3A2E]"
                />
              </div>
            </form>
          )}
        </div>

        {step !== 'confirmed' && cart.length > 0 && (
          <div className="px-6 py-5 border-t border-[#E6E4DE] bg-white space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#57534E]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#18181B]">
                  {formatCurrency(subtotalCents)}
                </span>
              </div>
              <div className="flex justify-between text-[#57534E]">
                <span>TN Carpenter Delivery (Free over ₹50,000)</span>
                <span className="font-mono tabular-nums text-[#18181B]">
                  {deliveryCents === 0 ? 'Complimentary' : formatCurrency(deliveryCents)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[#18181B] pt-2 border-t border-[#E6E4DE]">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatCurrency(totalCents)}</span>
              </div>
            </div>

            {step === 'bag' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full h-11 rounded-lg bg-[#1F3A2E] text-white text-sm font-semibold hover:bg-[#162920] transition-colors cursor-pointer"
              >
                Proceed to Checkout
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-[#1F3A2E] text-white text-sm font-semibold hover:bg-[#162920] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Reserving Stock...'
                  : `Place Order · ${formatCurrency(totalCents)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
