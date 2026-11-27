import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import type { Order } from '../types/inventory.ts';
import { formatCurrency, formatDateTime, storeApi } from '../lib/storeApi.ts';

interface OrderTrackerViewProps {
  initialOrders: Order[];
  initialLookupNumber?: string;
}

const PROGRESS_STEPS = ['Confirmed', 'In Joinery', 'Dispatched', 'Delivered'] as const;

export function OrderTrackerView({ initialOrders, initialLookupNumber = '' }: OrderTrackerViewProps) {
  const [query, setQuery] = useState(initialLookupNumber);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    initialLookupNumber
      ? initialOrders.find(
          (o) => o.orderNumber.toUpperCase() === initialLookupNumber.toUpperCase()
        ) || initialOrders[0] || null
      : initialOrders[0] || null
  );
  const [searching, setSearching] = useState(false);
  const [notFoundError, setNotFoundError] = useState('');

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setNotFoundError('');
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return;
    setSearching(true);
    try {
      const results = await storeApi.listOrders(trimmed);
      if (results.length === 0) {
        setNotFoundError(`No order found matching "${trimmed}".`);
        setSelectedOrder(null);
      } else {
        setSelectedOrder(results[0]);
      }
    } catch (err) {
      setNotFoundError(err instanceof Error ? err.message : 'Unable to look up order.');
    } finally {
      setSearching(false);
    }
  };

  const activeStepIdx = selectedOrder
    ? PROGRESS_STEPS.indexOf(selectedOrder.status as (typeof PROGRESS_STEPS)[number])
    : -1;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <div>
        <p className="text-xs font-medium text-[#57534E]">Customer Fulfillment</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#18181B] mt-1">
          Track Your Wood Bed Order
        </h1>
        <p className="text-sm text-[#57534E] mt-2">
          Enter your order reference (such as <span className="font-mono text-[#18181B]">AM-1041</span> or{' '}
          <span className="font-mono text-[#18181B]">AM-1042</span>) to check workshop joinery and white-glove dispatch status.
        </p>
      </div>

      <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-[#57534E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter order number (e.g. AM-1041)"
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E6E4DE] bg-white text-sm font-mono focus:outline-none focus:border-[#1F3A2E]"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="h-11 px-6 rounded-lg bg-[#1F3A2E] text-white text-sm font-semibold hover:bg-[#162920] disabled:opacity-60 cursor-pointer whitespace-nowrap"
        >
          {searching ? 'Checking...' : 'Check Status'}
        </button>
      </form>

      {initialOrders.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#57534E]">
          <span>Recent orders:</span>
          {initialOrders.slice(0, 4).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setNotFoundError('');
                setQuery(o.orderNumber);
                setSelectedOrder(o);
              }}
              className={`font-mono underline underline-offset-4 cursor-pointer ${
                selectedOrder?.id === o.id
                  ? 'text-[#1F3A2E] font-semibold'
                  : 'text-[#18181B] hover:text-[#1F3A2E]'
              }`}
            >
              {o.orderNumber}
            </button>
          ))}
        </div>
      )}

      {notFoundError && (
        <div className="p-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-sm text-[#B91C1C]">
          {notFoundError}
        </div>
      )}

      {selectedOrder && (
        <div className="bg-white border border-[#E6E4DE] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#E6E4DE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#57534E]">
                <span className="font-mono font-semibold text-[#18181B]">
                  Order #{selectedOrder.orderNumber}
                </span>
                <span aria-hidden="true">·</span>
                <span>Placed {formatDateTime(selectedOrder.createdAt)}</span>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-[#18181B] mt-1">
                {selectedOrder.status === 'Cancelled'
                  ? 'Order Cancelled — Stock Returned'
                  : `Status: ${selectedOrder.status}`}
              </h2>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-[#57534E]">{selectedOrder.paymentMethod}</p>
              <p className="font-mono text-lg font-semibold text-[#18181B] tabular-nums">
                {formatCurrency(selectedOrder.totalCents)}
              </p>
            </div>
          </div>

          {selectedOrder.status !== 'Cancelled' && (
            <div className="px-6 py-5 border-b border-[#E6E4DE] bg-[#FAFAF8]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {PROGRESS_STEPS.map((step, idx) => {
                  const completed = activeStepIdx >= idx;
                  return (
                    <div key={step} className="space-y-2">
                      <div
                        className={`h-1.5 rounded-full ${
                          completed ? 'bg-[#1F3A2E]' : 'bg-[#E6E4DE]'
                        }`}
                      />
                      <p
                        className={`text-xs font-medium ${
                          completed ? 'text-[#18181B] font-semibold' : 'text-[#57534E]'
                        }`}
                      >
                        0{idx + 1}. {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E6E4DE]">
            <div className="md:col-span-7 p-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                Bed Frames in Order
              </h3>
              <div className="divide-y divide-[#E6E4DE]">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-[#18181B]">{item.productName}</p>
                      <p className="text-xs text-[#57534E] font-mono mt-0.5">
                        {item.sizeLabel} · {item.sku} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono font-medium tabular-nums text-[#18181B]">
                      {formatCurrency(item.unitPriceCents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 p-6 space-y-3 text-xs">
              <h3 className="font-semibold uppercase tracking-wider text-[#57534E]">
                Delivery Destination
              </h3>
              <p className="font-semibold text-sm text-[#18181B]">{selectedOrder.customerName}</p>
              <p className="text-[#57534E]">
                {selectedOrder.shippingAddress}, {selectedOrder.postalCode}
              </p>
              <p className="text-[#57534E] font-mono">{selectedOrder.customerPhone}</p>
              {selectedOrder.notes && (
                <p className="pt-2 border-t border-[#E6E4DE] text-[#57534E]">
                  Notes: {selectedOrder.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
