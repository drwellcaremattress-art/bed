import { useState, type FormEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { BedCollection, BedSize, CreateBedPayload } from '../types/inventory.ts';

interface AddBedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateBedPayload) => Promise<void>;
}

const STUDIO_IMAGES = [
  { label: 'Teak Wood Carved Cot (Frame Only)', url: '/src/assets/images/tn_burma_teak_cot_1795072557358.jpg' },
  { label: 'Teak Wood Canopy Cot (Frame Only)', url: '/src/assets/images/tn_chettinad_canopy_1795072558017.jpg' },
  { label: 'Teak Wood Storage Cot (Frame Only)', url: '/src/assets/images/bed_solis_storage_1795071996680.jpg' },
  { label: 'Mahogany Spindle Cot (Frame Only)', url: '/src/assets/images/tn_mahogany_diwan_1795072558300.jpg' },
  { label: 'Mahogany Platform Cot (Frame Only)', url: '/src/assets/images/tn_rosewood_platform_1795072558502.jpg' },
  { label: 'Mahogany Storage Cot (Frame Only)', url: '/src/assets/images/bed_kyoto_walnut_1795072016344.jpg' },
];

interface DraftVariant {
  sku: string;
  sizeLabel: BedSize;
  dimensionsIn: string;
  weightLbs: string;
  priceRupees: string;
  stockQuantity: string;
  reorderThreshold: string;
}

export function AddBedModal({ isOpen, onClose, onCreate }: AddBedModalProps) {
  const [name, setName] = useState('');
  const [collection, setCollection] = useState<BedCollection>('Platform');
  const [woodSpecies, setWoodSpecies] = useState('Burma Teak (Thekku)');
  const [timberOrigin, setTimberOrigin] = useState('Pollachi & Karaikudi Guild, Tamil Nadu');
  const [joineryMethod, setJoineryMethod] = useState('Wedged mortise & tenon');
  const [finishType, setFinishType] = useState('Cold-pressed linseed & beeswax');
  const [leadTimeDays, setLeadTimeDays] = useState('8');
  const [imageUrl, setImageUrl] = useState(STUDIO_IMAGES[0].url);
  const [description, setDescription] = useState('');
  const [headSideHeightIn, setHeadSideHeightIn] = useState('40"');
  const [legSideHeightIn, setLegSideHeightIn] = useState('20"');
  const [sideBarSize, setSideBarSize] = useState('5" × 2"');
  const [legThickness, setLegThickness] = useState('4" × 4"');
  const [baseSpec, setBaseSpec] = useState('18 mm Solid Hardwood Slats / Deck Base');
  const [crossBarsCount, setCrossBarsCount] = useState('4');
  const [variants, setVariants] = useState<DraftVariant[]>([
    {
      sku: 'TN-NEW-TEK-QN',
      sizeLabel: 'Queen',
      dimensionsIn: '60" W × 78" L × 40" H',
      weightLbs: '185',
      priceRupees: '64500',
      stockQuantity: '6',
      reorderThreshold: '3',
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: `TN-NEW-${(prev.length + 1).toString().padStart(2, '0')}`,
        sizeLabel: 'King',
        dimensionsIn: '72" W × 78" L × 40" H',
        weightLbs: '215',
        priceRupees: '78500',
        stockQuantity: '4',
        reorderThreshold: '2',
      },
    ]);
  };

  const updateVariant = (idx: number, field: keyof DraftVariant, val: string) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    try {
      await onCreate({
        name,
        collection,
        woodSpecies,
        timberOrigin,
        joineryMethod,
        finishType,
        leadTimeDays: Number(leadTimeDays) || 8,
        description:
          description.trim() ||
          `Pure solid ${woodSpecies} cot frame built with ${joineryMethod.toLowerCase()} in Tamil Nadu.`,
        imageUrl,
        specs: {
          headSideHeightIn: headSideHeightIn.trim() || '40"',
          legSideHeightIn: legSideHeightIn.trim() || '20"',
          sideBarSize: sideBarSize.trim() || '5" × 2"',
          legThickness: legThickness.trim() || '4" × 4"',
          baseSpec: baseSpec.trim() || '18 mm Solid Hardwood Slats / Deck Base',
          crossBarsCount: Math.max(2, Math.floor(Number(crossBarsCount) || 4)),
        },
        variants: variants.map((v) => ({
          sku: v.sku.trim().toUpperCase(),
          sizeLabel: v.sizeLabel,
          dimensionsIn: v.dimensionsIn,
          weightLbs: Number(v.weightLbs) || 175,
          priceCents: Math.max(10000, Math.round(Number(v.priceRupees) * 100)),
          stockQuantity: Math.max(0, Math.floor(Number(v.stockQuantity) || 0)),
          reorderThreshold: Math.max(0, Math.floor(Number(v.reorderThreshold) || 2)),
        })),
      });
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save wood cot.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-bed-title"
    >
      <div className="w-full max-w-3xl bg-white border border-[#E6E4DE] rounded-xl overflow-hidden shadow-xl my-auto">
        <div className="px-6 py-4 border-b border-[#E6E4DE] flex items-center justify-between">
          <h2 id="add-bed-title" className="font-serif text-2xl font-semibold text-[#18181B]">
            Add Solid Wood Cot Frame to Catalog
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg hover:bg-[#F3F2EE] text-[#57534E] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Cot Frame Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Coimbatore Teak Slatted Frame"
                className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] text-sm focus:outline-none focus:border-[#1F3A2E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Collection Category
              </label>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value as BedCollection)}
                className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] text-sm bg-white focus:outline-none focus:border-[#1F3A2E]"
              >
                <option value="Platform">Platform</option>
                <option value="Headboard">Headboard</option>
                <option value="Canopy">Canopy</option>
                <option value="Storage">Storage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Hardwood Species
              </label>
              <input
                type="text"
                required
                value={woodSpecies}
                onChange={(e) => setWoodSpecies(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] text-sm focus:outline-none focus:border-[#1F3A2E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Tamil Nadu Guild / Origin
              </label>
              <input
                type="text"
                required
                value={timberOrigin}
                onChange={(e) => setTimberOrigin(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] text-sm focus:outline-none focus:border-[#1F3A2E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Joinery Method
              </label>
              <input
                type="text"
                required
                value={joineryMethod}
                onChange={(e) => setJoineryMethod(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] text-sm focus:outline-none focus:border-[#1F3A2E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Bare Wood Frame Photo
              </label>
              <select
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] text-sm bg-white focus:outline-none focus:border-[#1F3A2E]"
              >
                {STUDIO_IMAGES.map((img) => (
                  <option key={img.url} value={img.url}>
                    {img.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Surface Finish
              </label>
              <input
                type="text"
                required
                value={finishType}
                onChange={(e) => setFinishType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] text-sm focus:outline-none focus:border-[#1F3A2E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Lead Time (Days)
              </label>
              <input
                type="number"
                min={1}
                required
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E6E4DE] font-mono text-sm tabular-nums focus:outline-none focus:border-[#1F3A2E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Craftsmanship Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe rail thickness, slat spacing, and solid wood character..."
              className="w-full px-3 py-2 rounded-lg border border-[#E6E4DE] text-sm focus:outline-none focus:border-[#1F3A2E]"
            />
          </div>

          <div className="pt-2 border-t border-[#E6E4DE] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
              Structural Blueprint Dimensions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#57534E] mb-1">
                  Head Side Height
                </label>
                <input
                  type="text"
                  value={headSideHeightIn}
                  onChange={(e) => setHeadSideHeightIn(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#E6E4DE] font-mono text-xs focus:outline-none focus:border-[#1F3A2E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#57534E] mb-1">
                  Leg Side Height
                </label>
                <input
                  type="text"
                  value={legSideHeightIn}
                  onChange={(e) => setLegSideHeightIn(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#E6E4DE] font-mono text-xs focus:outline-none focus:border-[#1F3A2E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#57534E] mb-1">
                  Side Bar
                </label>
                <input
                  type="text"
                  value={sideBarSize}
                  onChange={(e) => setSideBarSize(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#E6E4DE] font-mono text-xs focus:outline-none focus:border-[#1F3A2E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#57534E] mb-1">
                  Leg Thickness
                </label>
                <input
                  type="text"
                  value={legThickness}
                  onChange={(e) => setLegThickness(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#E6E4DE] font-mono text-xs focus:outline-none focus:border-[#1F3A2E]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-[#57534E] mb-1">
                  Full Bed Base Deck
                </label>
                <input
                  type="text"
                  value={baseSpec}
                  onChange={(e) => setBaseSpec(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#E6E4DE] text-xs focus:outline-none focus:border-[#1F3A2E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#57534E] mb-1">
                  Bottom Cross Bars
                </label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={crossBarsCount}
                  onChange={(e) => setCrossBarsCount(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#E6E4DE] font-mono text-xs tabular-nums focus:outline-none focus:border-[#1F3A2E]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E6E4DE] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                Cot Size Variants &amp; Opening Stock
              </h3>
              <button
                type="button"
                onClick={addVariantRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6E4DE] text-xs font-semibold text-[#18181B] hover:bg-[#F3F2EE] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Size</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {variants.map((variant, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end"
                >
                  <div>
                    <label className="block text-[11px] text-[#57534E] mb-1">Size</label>
                    <select
                      value={variant.sizeLabel}
                      onChange={(e) => updateVariant(idx, 'sizeLabel', e.target.value)}
                      className="w-full h-9 px-2 rounded border border-[#E6E4DE] bg-white text-xs"
                    >
                      <option value="Single">Single</option>
                      <option value="Diwan">Diwan</option>
                      <option value="Queen">Queen</option>
                      <option value="King">King</option>
                      <option value="Super King">Super King</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#57534E] mb-1">SKU</label>
                    <input
                      type="text"
                      required
                      value={variant.sku}
                      onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                      className="w-full h-9 px-2 rounded border border-[#E6E4DE] bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#57534E] mb-1">Price (₹)</label>
                    <input
                      type="number"
                      min={1000}
                      required
                      value={variant.priceRupees}
                      onChange={(e) => updateVariant(idx, 'priceRupees', e.target.value)}
                      className="w-full h-9 px-2 rounded border border-[#E6E4DE] bg-white font-mono text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#57534E] mb-1">Stock</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={variant.stockQuantity}
                      onChange={(e) => updateVariant(idx, 'stockQuantity', e.target.value)}
                      className="w-full h-9 px-2 rounded border border-[#E6E4DE] bg-white font-mono text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#57534E] mb-1">Reorder At</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={variant.reorderThreshold}
                      onChange={(e) => updateVariant(idx, 'reorderThreshold', e.target.value)}
                      className="w-full h-9 px-2 rounded border border-[#E6E4DE] bg-white font-mono text-xs tabular-nums"
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      disabled={variants.length === 1}
                      onClick={() =>
                        setVariants((prev) => prev.filter((_, rowIdx) => rowIdx !== idx))
                      }
                      aria-label="Remove variant"
                      className="h-9 px-2.5 rounded border border-[#E6E4DE] bg-white text-[#57534E] hover:text-[#B91C1C] disabled:opacity-35 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E6E4DE] flex justify-end gap-3">
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
              {saving ? 'Saving Cot...' : 'Create Cot & Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
