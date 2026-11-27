import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownUp,
  Boxes,
  ClipboardList,
  Download,
  History,
  Minus,
  PackagePlus,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type {
  BedVariant,
  CreateBedPayload,
  Order,
  OrderStatus,
  StockMovement,
  WoodBedProduct,
} from '../types/inventory.ts';
import { formatCurrency, formatDateTime, storeApi } from '../lib/storeApi.ts';
import { ResilientImage } from './ResilientImage.tsx';
import { StockAdjustModal } from './StockAdjustModal.tsx';
import { AddBedModal } from './AddBedModal.tsx';

type InventoryTab = 'stock' | 'catalog' | 'orders' | 'ledger';

interface InventoryWorkspaceProps {
  products: WoodBedProduct[];
  orders: Order[];
  movements: StockMovement[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

const RESTOCK_ALERT_THRESHOLD = 5;

const ORDER_STATUSES: OrderStatus[] = [
  'Confirmed',
  'In Joinery',
  'Dispatched',
  'Delivered',
  'Cancelled',
];

export function InventoryWorkspace({
  products,
  orders,
  movements,
  loading,
  onRefresh,
}: InventoryWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<InventoryTab>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'restock5' | 'low' | 'out'>('all');
  const [catalogRestockOnly, setCatalogRestockOnly] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<{
    productName: string;
    variant: BedVariant;
  } | null>(null);
  const [addBedOpen, setAddBedOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const allVariantRows = useMemo(() => {
    return products.flatMap((product) =>
      product.variants.map((variant) => ({
        product,
        variant,
      }))
    );
  }, [products]);

  const restockVariantsByProductId = useMemo(() => {
    const map = new Map<string, BedVariant[]>();
    for (const product of products) {
      const below = product.variants.filter((v) => v.stockQuantity < RESTOCK_ALERT_THRESHOLD);
      if (below.length > 0) {
        map.set(product.id, below);
      }
    }
    return map;
  }, [products]);

  const metrics = useMemo(() => {
    const totalUnits = allVariantRows.reduce((s, r) => s + r.variant.stockQuantity, 0);
    const totalValuationCents = allVariantRows.reduce(
      (s, r) => s + r.variant.stockQuantity * r.variant.priceCents,
      0
    );
    const lowStockCount = allVariantRows.filter(
      (r) => r.variant.stockQuantity > 0 && r.variant.stockQuantity <= r.variant.reorderThreshold
    ).length;
    const outOfStockCount = allVariantRows.filter((r) => r.variant.stockQuantity === 0).length;
    const belowFiveVariantsCount = allVariantRows.filter(
      (r) => r.variant.stockQuantity < RESTOCK_ALERT_THRESHOLD
    ).length;
    const productsNeedingRestockCount = restockVariantsByProductId.size;
    const openOrders = orders.filter(
      (o) => o.status !== 'Delivered' && o.status !== 'Cancelled'
    ).length;

    return {
      totalUnits,
      totalValuationCents,
      attentionSkus: lowStockCount + outOfStockCount,
      lowStockCount,
      outOfStockCount,
      belowFiveVariantsCount,
      productsNeedingRestockCount,
      openOrders,
      totalSkus: allVariantRows.length,
    };
  }, [allVariantRows, orders, restockVariantsByProductId]);

  const filteredVariantRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allVariantRows.filter(({ product, variant }) => {
      if (stockFilter === 'restock5') {
        if (variant.stockQuantity >= RESTOCK_ALERT_THRESHOLD) return false;
      } else if (stockFilter === 'low') {
        if (!(variant.stockQuantity > 0 && variant.stockQuantity <= variant.reorderThreshold)) {
          return false;
        }
      } else if (stockFilter === 'out') {
        if (variant.stockQuantity !== 0) return false;
      }

      if (!q) return true;
      const hay = `${product.name} ${product.woodSpecies} ${variant.sku} ${variant.sizeLabel}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allVariantRows, searchQuery, stockFilter]);

  const filteredCatalogProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (catalogRestockOnly && !restockVariantsByProductId.has(product.id)) {
        return false;
      }
      if (!q) return true;
      const hay = `${product.name} ${product.woodSpecies} ${product.collection} ${product.joineryMethod}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, searchQuery, catalogRestockOnly, restockVariantsByProductId]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const filteredMovements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return movements;
    return movements.filter(
      (m) =>
        m.sku.toLowerCase().includes(q) ||
        m.productName.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.referenceId.toLowerCase().includes(q)
    );
  }, [movements, searchQuery]);

  const handleQuickAdjust = async (variantId: string, delta: number) => {
    setActionError('');
    setBusyId(variantId);
    try {
      await storeApi.adjustStock({
        variantId,
        delta,
        reason: delta > 0 ? 'Quick Warehouse Restock' : 'Quick Warehouse Deduction',
        referenceId: 'CONSOLE',
      });
      await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to adjust stock.');
    } finally {
      setBusyId(null);
    }
  };

  const handleModalAdjust = async (params: {
    variantId: string;
    delta?: number;
    exactQuantity?: number;
    reason: string;
    referenceId: string;
  }) => {
    await storeApi.adjustStock(params);
    await onRefresh();
  };

  const handleCreateBed = async (payload: CreateBedPayload) => {
    await storeApi.createProduct(payload);
    await onRefresh();
  };

  const handleDeleteBed = async (product: WoodBedProduct) => {
    setActionError('');
    setBusyId(product.id);
    try {
      await storeApi.deleteProduct(product.id);
      await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete bed model.');
    } finally {
      setBusyId(null);
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    setActionError('');
    setBusyId(orderId);
    try {
      await storeApi.updateOrderStatus(orderId, status);
      await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update order status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCsv = () => {
    const header = ['SKU', 'Cot Frame Model', 'Species', 'Size', 'Price INR', 'Stock', 'Reorder At', 'Status'];
    const rows = allVariantRows.map(({ product, variant }) => {
      const status =
        variant.stockQuantity === 0
          ? 'Out of Stock'
          : variant.stockQuantity <= variant.reorderThreshold
            ? 'Low Stock'
            : 'Nominal';
      return [
        variant.sku,
        `"${product.name.replace(/"/g, '""')}"`,
        `"${product.woodSpecies.replace(/"/g, '""')}"`,
        variant.sizeLabel,
        (variant.priceCents / 100).toFixed(2),
        String(variant.stockQuantity),
        String(variant.reorderThreshold),
        status,
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teak-in-furnitures-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const navTabs: Array<{ id: InventoryTab; label: string; icon: typeof Boxes }> = [
    { id: 'stock', label: 'Overview & Stock', icon: Boxes },
    { id: 'catalog', label: 'Wood Bed Models', icon: ArrowDownUp },
    { id: 'orders', label: 'Orders & Fulfillment', icon: ClipboardList },
    { id: 'ledger', label: 'Stock Ledger', icon: History },
  ];

  const tabTitles: Record<InventoryTab, string> = {
    stock: 'Overview & Stock',
    catalog: 'Wood Bed Models',
    orders: 'Orders & Fulfillment',
    ledger: 'Stock Ledger',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-[#E6E4DE] rounded-xl overflow-hidden flex flex-col lg:flex-row min-h-[680px]">
        {/* Workspace Sidebar (240px desktop) */}
        <aside className="lg:w-60 shrink-0 bg-[#FAFAF8] border-b lg:border-b-0 lg:border-r border-[#E6E4DE] p-4 flex flex-col justify-between gap-6">
          <div>
            <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#57534E] mb-2">
              Inventory Console
            </p>
            <nav aria-label="Inventory sections" className="flex lg:flex-col gap-1 overflow-x-auto">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#1F3A2E] text-white font-semibold'
                        : 'text-[#57534E] hover:bg-[#F3F2EE] hover:text-[#18181B]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden lg:block pt-4 border-t border-[#E6E4DE] px-2 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#57534E]">
              <span>Active SKUs</span>
              <span className="font-mono font-medium text-[#18181B] tabular-nums">
                {metrics.totalSkus}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#57534E]">
              <span>Models &lt; 5 Stock</span>
              <span
                className={`inline-flex items-center gap-1 font-mono font-semibold tabular-nums ${
                  metrics.productsNeedingRestockCount > 0 ? 'text-[#B45309]' : 'text-[#1F3A2E]'
                }`}
              >
                {metrics.productsNeedingRestockCount > 0 && (
                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                )}
                <span>{metrics.productsNeedingRestockCount}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[#57534E]">
              <span>Needs Reorder</span>
              <span
                className={`font-mono font-medium tabular-nums ${
                  metrics.attentionSkus > 0 ? 'text-[#B45309]' : 'text-[#1F3A2E]'
                }`}
              >
                {metrics.attentionSkus}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Inventory Viewport */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Workspace Header */}
          <div className="px-6 py-4 border-b border-[#E6E4DE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#57534E]">
                Inventory <span aria-hidden="true">/</span> {tabTitles[activeTab]}
              </p>
              <h1 className="font-serif text-2xl font-semibold text-[#18181B]">
                {tabTitles[activeTab]}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 text-[#57534E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter SKU, bed, order..."
                  aria-label="Filter inventory records"
                  className="h-9 pl-8 pr-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-xs w-48 focus:outline-none focus:border-[#1F3A2E]"
                />
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E6E4DE] bg-white text-xs font-semibold text-[#18181B] hover:bg-[#F3F2EE] whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setAddBedOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#1F3A2E] text-white text-xs font-semibold hover:bg-[#162920] whitespace-nowrap cursor-pointer"
              >
                <PackagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Wood Bed</span>
              </button>
            </div>
          </div>

          {actionError && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
              {actionError}
            </div>
          )}

          {/* Tab Content */}
          <div className="p-6 space-y-6 flex-1 overflow-x-auto">
            {activeTab === 'stock' && (
              <>
                {/* 4-column Tabular KPI Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E6E4DE] rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-[#E6E4DE] bg-[#FAFAF8]">
                  <div className="p-4">
                    <p className="text-xs text-[#57534E]">Total Bed Units</p>
                    <p className="font-mono text-2xl font-semibold text-[#18181B] tabular-nums mt-1">
                      {metrics.totalUnits}
                    </p>
                    <p className="text-[11px] text-[#57534E] mt-0.5 tabular-nums">
                      Across {metrics.totalSkus} size SKUs
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#57534E]">Stock Valuation</p>
                    <p className="font-mono text-2xl font-semibold text-[#18181B] tabular-nums mt-1">
                      {formatCurrency(metrics.totalValuationCents)}
                    </p>
                    <p className="text-[11px] text-[#57534E] mt-0.5">Retail timber value</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#57534E]">Restock Watch (&lt; 5)</p>
                    <p
                      className={`font-mono text-2xl font-semibold tabular-nums mt-1 ${
                        metrics.productsNeedingRestockCount > 0 ? 'text-[#B45309]' : 'text-[#1F3A2E]'
                      }`}
                    >
                      {metrics.productsNeedingRestockCount}
                    </p>
                    <p className="text-[11px] text-[#57534E] mt-0.5 tabular-nums">
                      {metrics.belowFiveVariantsCount} variants under 5 · {metrics.outOfStockCount} out
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#57534E]">Active Orders</p>
                    <p className="font-mono text-2xl font-semibold text-[#18181B] tabular-nums mt-1">
                      {metrics.openOrders}
                    </p>
                    <p className="text-[11px] text-[#57534E] mt-0.5">Awaiting delivery</p>
                  </div>
                </div>

                {/* Restock Alert Callout for Products Having Any Variant Below 5 */}
                {metrics.productsNeedingRestockCount > 0 && (
                  <div className="px-4 py-3 rounded-xl bg-[#FFFBEB] border border-[#FCD34D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2.5 text-xs text-[#92400E]">
                      <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
                      <p>
                        <span className="font-semibold text-[#78350F]">
                          Restock Alert ({metrics.productsNeedingRestockCount}{' '}
                          {metrics.productsNeedingRestockCount === 1 ? 'model' : 'models'}):
                        </span>{' '}
                        {metrics.belowFiveVariantsCount}{' '}
                        {metrics.belowFiveVariantsCount === 1 ? 'variant has' : 'variants have'} fewer
                        than 5 units on hand and are highlighted below.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setStockFilter((prev) => (prev === 'restock5' ? 'all' : 'restock5'))
                      }
                      className="px-3 py-1.5 rounded-lg border border-[#F59E0B]/50 bg-white text-xs font-semibold text-[#92400E] hover:bg-[#FEF3C7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {stockFilter === 'restock5' ? 'Show All SKUs' : 'Filter Below 5'}
                    </button>
                  </div>
                )}

                {/* Stock Status Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F3F2EE] rounded-lg border border-[#E6E4DE]">
                    {(
                      [
                        { id: 'all', label: `All SKUs (${metrics.totalSkus})` },
                        { id: 'restock5', label: `Below 5 (${metrics.belowFiveVariantsCount})` },
                        { id: 'low', label: `Low Stock (${metrics.lowStockCount})` },
                        { id: 'out', label: `Out of Stock (${metrics.outOfStockCount})` },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setStockFilter(f.id)}
                        className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer ${
                          stockFilter === f.id
                            ? 'bg-white text-[#18181B] shadow-xs'
                            : 'text-[#57534E] hover:text-[#18181B]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-[#57534E] tabular-nums">
                    Showing {filteredVariantRows.length} variants
                  </span>
                </div>

                {/* High-Density Variant Stock Table */}
                <div className="border border-[#E6E4DE] rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E6E4DE] bg-[#FAFAF8] text-[#57534E]">
                        <th className="py-2.5 px-4 font-semibold">SKU</th>
                        <th className="py-2.5 px-4 font-semibold">Bed Model &amp; Species</th>
                        <th className="py-2.5 px-4 font-semibold">Size</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Price</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Reorder At</th>
                        <th className="py-2.5 px-4 font-semibold text-right">On Hand</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E4DE]">
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-[#57534E]">
                            Loading inventory...
                          </td>
                        </tr>
                      ) : filteredVariantRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-[#57534E]">
                            No SKU variants match the active filter.
                          </td>
                        </tr>
                      ) : (
                        filteredVariantRows.map(({ product, variant }) => {
                          const isOut = variant.stockQuantity === 0;
                          const isBelowFive = variant.stockQuantity < RESTOCK_ALERT_THRESHOLD;
                          const isLow =
                            !isOut && variant.stockQuantity <= variant.reorderThreshold;
                          const productHasLowVariant = restockVariantsByProductId.has(product.id);
                          const busy = busyId === variant.id;

                          return (
                            <tr
                              key={variant.id}
                              className={`transition-colors ${
                                isOut
                                  ? 'bg-[#FEF2F2]/75 hover:bg-[#FEE2E2]/65'
                                  : isBelowFive
                                    ? 'bg-[#FFFBEB]/85 hover:bg-[#FEF3C7]/65'
                                    : 'hover:bg-[#FAFAF8]'
                              }`}
                            >
                              <td className="py-2.5 px-4 font-mono text-[#18181B] whitespace-nowrap">
                                {variant.sku}
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  {productHasLowVariant && (
                                    <AlertTriangle
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        isOut ? 'text-[#B91C1C]' : 'text-[#B45309]'
                                      }`}
                                      aria-label="Product has a variant with fewer than 5 units in stock"
                                    />
                                  )}
                                  <p className="font-semibold text-[#18181B]">{product.name}</p>
                                </div>
                                <p className="text-[11px] text-[#57534E]">{product.woodSpecies}</p>
                              </td>
                              <td className="py-2.5 px-4 font-medium text-[#18181B] whitespace-nowrap">
                                {variant.sizeLabel}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#18181B]">
                                {formatCurrency(variant.priceCents)}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#57534E]">
                                {variant.reorderThreshold}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 ${
                                    isOut
                                      ? 'text-[#B91C1C]'
                                      : isBelowFive
                                        ? 'text-[#B45309]'
                                        : 'text-[#18181B]'
                                  }`}
                                >
                                  {isBelowFive && (
                                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                                  )}
                                  <span>{variant.stockQuantity}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                <span
                                  className={`font-medium ${
                                    isOut
                                      ? 'text-[#B91C1C]'
                                      : isBelowFive || isLow
                                        ? 'text-[#B45309]'
                                        : 'text-[#1F3A2E]'
                                  }`}
                                >
                                  {isOut
                                    ? 'Out of Stock'
                                    : isBelowFive
                                      ? 'Restock (< 5)'
                                      : isLow
                                        ? 'Low Stock'
                                        : 'Nominal'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={busy || variant.stockQuantity === 0}
                                    onClick={() => handleQuickAdjust(variant.id, -1)}
                                    aria-label={`Deduct 1 unit from ${variant.sku}`}
                                    className="w-7 h-7 rounded border border-[#E6E4DE] bg-white inline-flex items-center justify-center text-[#18181B] hover:bg-[#F3F2EE] disabled:opacity-35 cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleQuickAdjust(variant.id, 1)}
                                    aria-label={`Add 1 unit to ${variant.sku}`}
                                    className="w-7 h-7 rounded border border-[#E6E4DE] bg-white inline-flex items-center justify-center text-[#18181B] hover:bg-[#F3F2EE] disabled:opacity-35 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAdjustTarget({ productName: product.name, variant })
                                    }
                                    className={`ml-1 px-2.5 h-7 rounded border text-[11px] font-semibold cursor-pointer ${
                                      isBelowFive
                                        ? 'border-[#F59E0B]/60 bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]'
                                        : 'border-[#E6E4DE] bg-white text-[#18181B] hover:bg-[#F3F2EE]'
                                    }`}
                                  >
                                    {isBelowFive ? 'Restock' : 'Batch'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'catalog' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#57534E]">
                    {metrics.productsNeedingRestockCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#92400E]">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" aria-hidden="true" />
                        <span>
                          {metrics.productsNeedingRestockCount} of {products.length} wood bed models
                          have a size variant below 5 units
                        </span>
                      </span>
                    ) : (
                      <span>All wood bed models have 5+ units across every size variant.</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCatalogRestockOnly((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      catalogRestockOnly
                        ? 'border-[#F59E0B] bg-[#FFFBEB] text-[#92400E]'
                        : 'border-[#E6E4DE] bg-white text-[#18181B] hover:bg-[#F3F2EE]'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" aria-hidden="true" />
                    <span>
                      {catalogRestockOnly
                        ? 'Showing Restock Models Only'
                        : `Highlight Restock (< 5) (${metrics.productsNeedingRestockCount})`}
                    </span>
                  </button>
                </div>

                <div className="border border-[#E6E4DE] rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E6E4DE] bg-[#FAFAF8] text-[#57534E]">
                        <th className="py-2.5 px-4 font-semibold">Bed Frame</th>
                        <th className="py-2.5 px-4 font-semibold">Collection</th>
                        <th className="py-2.5 px-4 font-semibold">Timber &amp; Joinery</th>
                        <th className="py-2.5 px-4 font-semibold">Restock Check (&lt; 5)</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Total Stock</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E4DE]">
                      {filteredCatalogProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#57534E]">
                            No wood bed models match the active filter.
                          </td>
                        </tr>
                      ) : (
                        filteredCatalogProducts.map((product) => {
                          const units = product.variants.reduce((s, v) => s + v.stockQuantity, 0);
                          const lowVariants = restockVariantsByProductId.get(product.id) || [];
                          const needsRestock = lowVariants.length > 0;
                          const lowestVariant = needsRestock
                            ? [...lowVariants].sort((a, b) => a.stockQuantity - b.stockQuantity)[0]
                            : null;

                          return (
                            <tr
                              key={product.id}
                              className={`transition-colors ${
                                needsRestock
                                  ? 'bg-[#FFFBEB]/85 hover:bg-[#FEF3C7]/65'
                                  : 'hover:bg-[#FAFAF8]'
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-10 rounded overflow-hidden border border-[#E6E4DE] bg-[#F3F2EE] shrink-0">
                                    <ResilientImage
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      {needsRestock && (
                                        <AlertTriangle
                                          className="w-3.5 h-3.5 text-[#B45309] shrink-0"
                                          aria-label="Needs restock"
                                        />
                                      )}
                                      <p className="font-semibold text-[#18181B]">{product.name}</p>
                                    </div>
                                    <p className="font-mono text-[11px] text-[#57534E]">
                                      {product.variants.length} sizes · Lead time {product.leadTimeDays}d
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-[#18181B]">{product.collection}</td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-[#18181B]">{product.woodSpecies}</p>
                                <p className="text-[11px] text-[#57534E]">{product.joineryMethod}</p>
                              </td>
                              <td className="py-3 px-4">
                                {needsRestock ? (
                                  <div className="space-y-0.5">
                                    <p className="inline-flex items-center gap-1 font-semibold text-[#B45309]">
                                      <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                                      <span>Restock Needed</span>
                                    </p>
                                    <p className="font-mono text-[11px] text-[#92400E] tabular-nums">
                                      {lowVariants
                                        .map((v) => `${v.sizeLabel}: ${v.stockQuantity}`)
                                        .join(' · ')}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="font-medium text-[#1F3A2E]">
                                    Healthy (All ≥ 5)
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#18181B]">
                                {units}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  {lowestVariant && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAdjustTarget({
                                          productName: product.name,
                                          variant: lowestVariant,
                                        })
                                      }
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#F59E0B]/60 bg-[#FEF3C7] text-[#92400E] font-semibold hover:bg-[#FDE68A] cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" aria-hidden="true" />
                                      <span>Restock {lowestVariant.sizeLabel}</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={busyId === product.id}
                                    onClick={() => handleDeleteBed(product)}
                                    aria-label={`Delete ${product.name}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#E6E4DE] bg-white text-[#57534E] hover:text-[#B91C1C] hover:border-[#FECACA] cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="border border-[#E6E4DE] rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E4DE] bg-[#FAFAF8] text-[#57534E]">
                      <th className="py-2.5 px-4 font-semibold">Order #</th>
                      <th className="py-2.5 px-4 font-semibold">Customer</th>
                      <th className="py-2.5 px-4 font-semibold">Line Items</th>
                      <th className="py-2.5 px-4 font-semibold">Payment</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                      <th className="py-2.5 px-4 font-semibold">Fulfillment Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E4DE]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#57534E]">
                          No matching orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-[#FAFAF8]">
                          <td className="py-3 px-4 font-mono font-semibold text-[#18181B] whitespace-nowrap">
                            <div>{order.orderNumber}</div>
                            <div className="font-sans font-normal text-[11px] text-[#57534E]">
                              {formatDateTime(order.createdAt)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#18181B]">{order.customerName}</p>
                            <p className="text-[11px] text-[#57534E]">{order.shippingAddress}</p>
                          </td>
                          <td className="py-3 px-4">
                            {order.items.map((item) => (
                              <div key={item.id} className="text-[#18181B]">
                                {item.quantity}× {item.productName}{' '}
                                <span className="font-mono text-[#57534E]">({item.sizeLabel})</span>
                              </div>
                            ))}
                          </td>
                          <td className="py-3 px-4 text-[#57534E] whitespace-nowrap">
                            {order.paymentMethod}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#18181B]">
                            {formatCurrency(order.totalCents)}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={order.status}
                              disabled={busyId === order.id}
                              onChange={(e) =>
                                handleOrderStatusChange(order.id, e.target.value as OrderStatus)
                              }
                              aria-label={`Order status for ${order.orderNumber}`}
                              className="h-8 px-2.5 rounded-lg border border-[#E6E4DE] bg-white text-xs font-medium text-[#18181B] focus:outline-none focus:border-[#1F3A2E] cursor-pointer"
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="border border-[#E6E4DE] rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E4DE] bg-[#FAFAF8] text-[#57534E]">
                      <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                      <th className="py-2.5 px-4 font-semibold">SKU</th>
                      <th className="py-2.5 px-4 font-semibold">Wood Bed &amp; Size</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Delta</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Prev → New</th>
                      <th className="py-2.5 px-4 font-semibold">Reason</th>
                      <th className="py-2.5 px-4 font-semibold">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E4DE]">
                    {filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#57534E]">
                          No stock ledger movements recorded yet.
                        </td>
                      </tr>
                    ) : (
                      filteredMovements.map((mov) => (
                        <tr key={mov.id} className="hover:bg-[#FAFAF8]">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#57534E] whitespace-nowrap">
                            {formatDateTime(mov.createdAt)}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[#18181B] whitespace-nowrap">
                            {mov.sku}
                          </td>
                          <td className="py-2.5 px-4 text-[#18181B]">
                            {mov.productName} ({mov.sizeLabel})
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right font-mono font-semibold tabular-nums ${
                              mov.delta > 0
                                ? 'text-[#1F3A2E]'
                                : mov.delta < 0
                                  ? 'text-[#B45309]'
                                  : 'text-[#57534E]'
                            }`}
                          >
                            {mov.delta > 0 ? `+${mov.delta}` : mov.delta}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#57534E]">
                            {mov.previousStock} → {mov.newStock}
                          </td>
                          <td className="py-2.5 px-4 text-[#18181B]">{mov.reason}</td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#57534E]">
                            {mov.referenceId || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <StockAdjustModal
        target={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onSubmit={handleModalAdjust}
      />

      <AddBedModal
        isOpen={addBedOpen}
        onClose={() => setAddBedOpen(false)}
        onCreate={handleCreateBed}
      />
    </div>
  );
}
