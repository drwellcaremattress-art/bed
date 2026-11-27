export type BedCollection = 'Platform' | 'Canopy' | 'Storage' | 'Headboard';

export type BedSize = 'Single' | 'Diwan' | 'Queen' | 'King' | 'Super King';

export type OrderStatus =
  | 'Confirmed'
  | 'In Joinery'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'Card' | 'UPI' | 'Cash on Delivery';

export interface BedVariant {
  id: string;
  productId: string;
  sku: string;
  sizeLabel: BedSize;
  dimensionsIn: string;
  weightLbs: number;
  priceCents: number;
  stockQuantity: number;
  reorderThreshold: number;
}

export interface StructuralSpecs {
  headSideHeightIn: string;
  legSideHeightIn: string;
  sideBarSize: string;
  legThickness: string;
  baseSpec: string;
  crossBarsCount: number;
}

export interface WoodBedProduct {
  id: string;
  slug: string;
  name: string;
  collection: BedCollection;
  woodSpecies: string;
  timberOrigin: string;
  joineryMethod: string;
  finishType: string;
  leadTimeDays: number;
  description: string;
  imageUrl: string;
  isFeatured: boolean;
  createdAt: string;
  specs?: StructuralSpecs;
  variants: BedVariant[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  sizeLabel: BedSize;
  sku: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  subtotalCents: number;
  deliveryCents: number;
  totalCents: number;
  notes: string;
  createdAt: string;
  items: OrderItem[];
}

export interface StockMovement {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  sizeLabel: BedSize;
  delta: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  woodSpecies: string;
  sizeLabel: BedSize;
  sku: string;
  imageUrl: string;
  unitPriceCents: number;
  quantity: number;
}

export interface CreateBedPayload {
  name: string;
  collection: BedCollection;
  woodSpecies: string;
  timberOrigin: string;
  joineryMethod: string;
  finishType: string;
  leadTimeDays: number;
  description: string;
  imageUrl: string;
  specs?: StructuralSpecs;
  variants: Array<{
    sku: string;
    sizeLabel: BedSize;
    dimensionsIn: string;
    weightLbs: number;
    priceCents: number;
    stockQuantity: number;
    reorderThreshold: number;
  }>;
}

export interface PlaceOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
}
