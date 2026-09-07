-- ===================================================
-- CEYLONBITE SUPABASE COMPLETE DATABASE SCHEMA
-- ===================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------
-- 1. PROFILES TABLE
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------
-- 2. CATEGORIES TABLE
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  icon_name TEXT DEFAULT 'fast-food-outline',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------
-- 3. FOODS TABLE
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  image_url TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  rating NUMERIC(3, 2) DEFAULT 4.5,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  calories TEXT,
  prep_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------
-- 4. ORDERS TABLE
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  order_type TEXT NOT NULL DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'wallet')),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  delivery_address TEXT NOT NULL,
  delivery_instructions TEXT,
  scheduled_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------
-- 5. ORDER ITEMS TABLE
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  base_price NUMERIC(10, 2) NOT NULL,
  selected_spice TEXT,
  extras JSONB DEFAULT '[]'::jsonb,
  unit_total NUMERIC(10, 2) NOT NULL,
  line_total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------
-- 6. FAVORITES TABLE
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, food_id)
);

-- ---------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- CATEGORIES POLICIES
CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- FOODS POLICIES
CREATE POLICY "Anyone can view available foods" ON public.foods
  FOR SELECT USING (is_available = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage foods" ON public.foods
  FOR ALL USING (public.is_admin());

-- FAVORITES POLICIES
CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- ORDERS POLICIES
CREATE POLICY "Users can view own orders or admin all" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins or owners can update order status" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- ORDER ITEMS POLICIES
CREATE POLICY "Users can view own order items or admin all" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
      AND (public.orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Authenticated users can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
      AND (public.orders.user_id = auth.uid() OR auth.uid() IS NOT NULL)
    )
  );

-- ---------------------------------------------------
-- SEED INITIAL CATEGORIES & FOODS
-- ---------------------------------------------------

INSERT INTO public.categories (id, name, slug, icon_name, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Burgers', 'burgers', 'fast-food-outline', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Fried Chicken', 'chicken', 'restaurant-outline', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Rice & Kottu', 'rice', 'nutrition-outline', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Pizza', 'pizza', 'pizza-outline', 4),
  ('c1000000-0000-0000-0000-000000000005', 'Wraps & Sides', 'wraps', 'flame-outline', 5),
  ('c1000000-0000-0000-0000-000000000006', 'Drinks', 'drinks', 'beer-outline', 6),
  ('c1000000-0000-0000-0000-000000000007', 'Desserts', 'desserts', 'ice-cream-outline', 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.foods (id, name, description, price, image_url, category_id, rating, is_available, is_popular, calories, prep_time) VALUES
  (
    'f1000000-0000-0000-0000-000000000001',
    'Ceylon Crunch Burger',
    'Crispy spiced chicken fillet topped with spicy sambal mayo, lettuce & melted cheddar on a toasted sesame bun.',
    1490.00,
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
    'c1000000-0000-0000-0000-000000000001',
    4.9,
    TRUE,
    TRUE,
    '650 kcal',
    '15 min'
  ),
  (
    'f1000000-0000-0000-0000-000000000002',
    'Spicy Chicken Bucket (6 Pcs)',
    '6 pieces of signature double-crunch fried chicken seasoned with roasted Sri Lankan chili spices.',
    3850.00,
    'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=800',
    'c1000000-0000-0000-0000-000000000002',
    4.8,
    TRUE,
    TRUE,
    '1250 kcal',
    '20 min'
  ),
  (
    'f1000000-0000-0000-0000-000000000003',
    'Hot Butter Chicken Rice',
    'Fragrant basmati rice served with crunchy hot butter chicken, chili paste & fried egg.',
    1890.00,
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800',
    'c1000000-0000-0000-0000-000000000003',
    4.9,
    TRUE,
    TRUE,
    '780 kcal',
    '15 min'
  ),
  (
    'f1000000-0000-0000-0000-000000000004',
    'BBQ Chicken Pizza',
    'Hand-tossed pizza crust loaded with smokey BBQ chicken, red onion, mozzarella & sweet chili drizzle.',
    2650.00,
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800',
    'c1000000-0000-0000-0000-000000000004',
    4.7,
    TRUE,
    TRUE,
    '920 kcal',
    '22 min'
  ),
  (
    'f1000000-0000-0000-0000-000000000005',
    'Crispy Chicken Wrap',
    'Crispy tender strips wrapped in warm tortilla with fresh slaw and fiery garlic aioli.',
    1250.00,
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800',
    'c1000000-0000-0000-0000-000000000005',
    4.6,
    TRUE,
    FALSE,
    '510 kcal',
    '12 min'
  ),
  (
    'f1000000-0000-0000-0000-000000000006',
    'Loaded Ceylon Fries',
    'Golden crinkle-cut fries smothered in cheese sauce, devilled chicken bits & spring onions.',
    950.00,
    'https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=800',
    'c1000000-0000-0000-0000-000000000005',
    4.8,
    TRUE,
    FALSE,
    '610 kcal',
    '10 min'
  ),
  (
    'f1000000-0000-0000-0000-000000000007',
    'Chocolate Lava Cake',
    'Warm rich dark chocolate cake with a molten liquid center, served warm.',
    850.00,
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800',
    'c1000000-0000-0000-0000-000000000007',
    4.9,
    TRUE,
    FALSE,
    '420 kcal',
    '8 min'
  ),
  (
    'f1000000-0000-0000-0000-000000000008',
    'Lime Mojito',
    'Refreshing crushed mint and fresh island lime soda served iced.',
    650.00,
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800',
    'c1000000-0000-0000-0000-000000000006',
    4.7,
    TRUE,
    FALSE,
    '180 kcal',
    '5 min'
  )
ON CONFLICT (id) DO NOTHING;
