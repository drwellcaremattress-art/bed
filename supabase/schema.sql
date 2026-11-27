-- Alder & Mortise (Tamil Nadu Solid Wood Cots) — Supabase PostgreSQL Schema
-- Run this script in your Supabase SQL Editor to provision the database.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Products (Solid Wood Cot Models — Frame Only)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  collection TEXT NOT NULL CHECK (collection IN ('Platform', 'Canopy', 'Storage', 'Headboard')),
  wood_species TEXT NOT NULL,
  timber_origin TEXT NOT NULL,
  joinery_method TEXT NOT NULL,
  finish_type TEXT NOT NULL,
  lead_time_days INTEGER NOT NULL DEFAULT 10,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  specs JSONB,
  is_featured BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Product Variants (Cot Sizes & Live Stock Quantities, Price in INR Paise)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  size_label TEXT NOT NULL CHECK (size_label IN ('Single', 'Diwan', 'Queen', 'King', 'Super King')),
  dimensions_in TEXT NOT NULL,
  weight_lbs INTEGER NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reorder_threshold INTEGER NOT NULL DEFAULT 3 CHECK (reorder_threshold >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Customer Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Card', 'UPI', 'Cash on Delivery')),
  status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'In Joinery', 'Dispatched', 'Delivered', 'Cancelled')),
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  delivery_cents INTEGER NOT NULL DEFAULT 0 CHECK (delivery_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Order Line Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  product_name TEXT NOT NULL,
  size_label TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0)
);

-- 5. Auditable Inventory Stock Movements Ledger
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  size_label TEXT NOT NULL,
  delta INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_movements_variant ON public.stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON public.stock_movements(created_at DESC);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Authenticated read orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read order items" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read stock movements" ON public.stock_movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write products" ON public.products FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write variants" ON public.product_variants FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert movements" ON public.stock_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Atomic Checkout RPC (Free delivery across Tamil Nadu >= ₹50,000)
CREATE OR REPLACE FUNCTION public.place_bed_order(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address TEXT,
  p_postal_code TEXT,
  p_payment_method TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal INTEGER := 0;
  v_delivery INTEGER := 0;
  v_total INTEGER := 0;
  v_item JSONB;
  v_variant RECORD;
  v_qty INTEGER;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one solid wood frame';
  END IF;

  v_order_number := 'AM-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::INTEGER;
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    SELECT pv.*, p.name AS prod_name
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = (v_item->>'variant_id')::UUID
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant not found';
    END IF;

    IF v_variant.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for % (%) — only % available',
        v_variant.prod_name, v_variant.size_label, v_variant.stock_quantity;
    END IF;

    v_subtotal := v_subtotal + (v_variant.price_cents * v_qty);
  END LOOP;

  IF v_subtotal < 5000000 THEN
    v_delivery := 180000;
  END IF;
  v_total := v_subtotal + v_delivery;

  INSERT INTO public.orders (
    order_number, customer_name, customer_email, customer_phone,
    shipping_address, postal_code, payment_method,
    subtotal_cents, delivery_cents, total_cents, notes
  )
  VALUES (
    v_order_number, p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, p_postal_code, p_payment_method,
    v_subtotal, v_delivery, v_total, COALESCE(p_notes, '')
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::INTEGER;

    SELECT pv.*, p.name AS prod_name
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = (v_item->>'variant_id')::UUID;

    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_qty
    WHERE id = v_variant.id;

    INSERT INTO public.order_items (
      order_id, product_id, variant_id, product_name,
      size_label, sku, quantity, unit_price_cents
    )
    VALUES (
      v_order_id, v_variant.product_id, v_variant.id, v_variant.prod_name,
      v_variant.size_label, v_variant.sku, v_qty, v_variant.price_cents
    );

    INSERT INTO public.stock_movements (
      variant_id, sku, product_name, size_label,
      delta, previous_stock, new_stock, reason, reference_id
    )
    VALUES (
      v_variant.id, v_variant.sku, v_variant.prod_name, v_variant.size_label,
      -v_qty, v_variant.stock_quantity, v_variant.stock_quantity - v_qty,
      'Customer Order Sale', v_order_number
    );
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'total_cents', v_total
  );
END;
$$;
