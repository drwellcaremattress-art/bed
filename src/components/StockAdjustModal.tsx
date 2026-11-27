import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { BedVariant } from '../types/inventory.ts';

interface StockAdjustModalProps {
  target: { productName: string; variant: BedVariant } | null;
  onClose: () => void;
  onSubmit: (params: {
    variantId: string;
    delta?: number;
    exactQuantity?: number;
    reason: string;
    referenceId: string;
  }) => Promise<void>;
}

export function StockAdjustModal({ target, onClose, onSubmit }: StockAdjustModalProps) {
  const [mode, setMode] = useState<'add' | 'set'>('add');
  const [amount, setAmount] = useState('5');
  const [reason, setReason] = useState('Kiln Batch Restock');
  const [referenceId, setReferenceId] = useState('MILL-B48');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  if (!target) return null;

  const numericAmount = Math.max(0, Math.floor(Number(amount) || 0));
  const previewNext =
    mode === 'add' ? target.variant.stockQuantity + numericAmount : numericAmount;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await onSubmit({
        variantId: target.variant.id,
        ...(mode === 'add' ? { delta: numericAmount } : { exactQuantity: numericAmount }),
        reason,
        referenceId,
      });
      onClose();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Stock update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-modal-title"
    >
      <div className="w-full max-w-md bg-white border border-[#E6E4DE] rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-[#E6E4DE] flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-[#57534E]">{target.variant.sku}</p>
            <h2 id="stock-modal-title" className="text-base font-semibold text-[#18181B]">
              Adjust Stock · {target.productName} ({target.variant.sizeLabel})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close stock adjustment"
            className="p-1.5 rounded-lg hover:bg-[#F3F2EE] text-[#57534E] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {err && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
              {err}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F3F2EE] rounded-lg border border-[#E6E4DE]">
            <button
              type="button"
              onClick={() => {
                setMode('add');
                setReason('Kiln Batch Restock');
              }}
              className={`py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                mode === 'add' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#57534E]'
              }`}
            >
              Add Units (+Batch)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('set');
                setAmount(String(target.variant.stockQuantity));
                setReason('Physical Cycle Count');
              }}
              className={`py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                mode === 'set' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#57534E]'
              }`}
            >
              Set Exact Count
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                {mode === 'add' ? 'Units Received' : 'New Exact Stock'}
              </label>
              <input
                type="number"
                min={0}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] font-mono text-sm tabular-nums focus:outline-none focus:border-[#1F3A2E]"
              />
            </div>
            <div className="p-2.5 rounded-lg bg-[#FAFAF8] border border-[#E6E4DE] flex flex-col justify-center">
              <span className="text-[11px] text-[#57534E]">Resulting Stock</span>
              <span className="font-mono text-sm font-semibold text-[#18181B] tabular-nums">
                {target.variant.stockQuantity} → {previewNext} units
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Movement Reason
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] text-sm focus:outline-none focus:border-[#1F3A2E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Batch / Audit Reference
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] font-mono text-sm focus:outline-none focus:border-[#1F3A2E]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-[#E6E4DE] text-xs font-semibold text-[#18181B] hover:bg-[#F3F2EE] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-lg bg-[#1F3A2E] text-white text-xs font-semibold hover:bg-[#162920] disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Updating...' : 'Save Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
