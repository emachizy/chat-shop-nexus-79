-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create vendors table
CREATE TABLE public.vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  store_name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policies for vendors
CREATE POLICY "Anyone can view verified vendors" ON public.vendors
  FOR SELECT USING (is_verified = TRUE);

CREATE POLICY "Vendors can manage own store" ON public.vendors
  FOR ALL USING (auth.uid() = user_id);

-- Create products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Vendors can manage own products" ON public.products
  FOR ALL USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Create orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_reference TEXT,
  paystack_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Insert some sample vendors and products
INSERT INTO public.vendors (name, email, store_name, description, is_verified) VALUES
  ('TechStore', 'tech@example.com', 'Tech Electronics', 'Quality electronics and gadgets', TRUE),
  ('FashionHub', 'fashion@example.com', 'Fashion Central', 'Trendy clothing and accessories', TRUE),
  ('HomeGoods', 'home@example.com', 'Home & Garden', 'Everything for your home', TRUE);

-- Insert sample products
INSERT INTO public.products (vendor_id, name, description, price, category, images, stock) 
SELECT 
  v.id,
  p.name,
  p.description,
  p.price,
  p.category,
  p.images,
  p.stock
FROM public.vendors v
CROSS JOIN (
  VALUES 
    ('Wireless Bluetooth Headphones', 'High-quality wireless headphones with noise cancellation', 79.99, 'Electronics', ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'], 50),
    ('Smart Fitness Watch', 'Track your fitness goals with this advanced smartwatch', 199.99, 'Electronics', ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'], 30),
    ('Vintage Leather Jacket', 'Classic leather jacket perfect for any occasion', 149.99, 'Fashion', ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'], 20),
    ('Cozy Throw Blanket', 'Soft and warm blanket for your living room', 39.99, 'Home', ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500'], 40),
    ('Wireless Gaming Mouse', 'Precision gaming mouse with RGB lighting', 59.99, 'Electronics', ARRAY['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500'], 35),
    ('Designer Sunglasses', 'Stylish sunglasses with UV protection', 89.99, 'Fashion', ARRAY['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500'], 25)
) AS p(name, description, price, category, images, stock)
WHERE v.store_name = CASE 
  WHEN p.category = 'Electronics' THEN 'Tech Electronics'
  WHEN p.category = 'Fashion' THEN 'Fashion Central'
  WHEN p.category = 'Home' THEN 'Home & Garden'
END;