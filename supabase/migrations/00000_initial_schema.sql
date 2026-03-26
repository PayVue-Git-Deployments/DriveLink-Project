-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Merchants Table
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Merchant Users Table (Maps Auth Users to Merchants)
CREATE TABLE merchant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References auth.users(id)
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(merchant_id, user_id)
);

-- 3. Assets (Inventory - Rooms/Cars)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('room', 'car', 'experience')),
    description TEXT,
    price_per_unit NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Payment Links
CREATE TABLE payment_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paid')),
    url_slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    payment_link_id UUID REFERENCES payment_links(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('pending', 'successful', 'failed', 'refunded')),
    provider TEXT NOT NULL, -- e.g., 'stripe', 'paygate', 'dpo', 'payfast'
    provider_transaction_id TEXT,
    customer_email TEXT,
    customer_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Provider Configurations (Only owners can manage)
CREATE TABLE provider_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paygate', 'dpo', 'payfast')),
    credentials JSONB NOT NULL, -- Encrypted or secure storage in real-world, JSONB for MVP
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(merchant_id, provider)
);

-- 7. Merchant Website Configurations (AI Website Builder)
CREATE TABLE merchant_website_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE UNIQUE,
    layout JSONB NOT NULL DEFAULT '{}'::jsonb,
    theme JSONB NOT NULL DEFAULT '{"primary_color": "#000000", "font": "inter"}'::jsonb,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_website_configurations ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user belongs to a merchant
CREATE OR REPLACE FUNCTION auth.user_belongs_to_merchant(merchant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.merchant_users
    WHERE merchant_users.merchant_id = $1
    AND merchant_users.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is an owner of a merchant
CREATE OR REPLACE FUNCTION auth.user_is_merchant_owner(merchant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.merchant_users
    WHERE merchant_users.merchant_id = $1
    AND merchant_users.user_id = auth.uid()
    AND merchant_users.role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Merchants Policies
CREATE POLICY "Users can view their own merchants" 
ON merchants FOR SELECT 
USING (auth.user_belongs_to_merchant(id));

CREATE POLICY "Owners can update their merchants" 
ON merchants FOR UPDATE 
USING (auth.user_is_merchant_owner(id));

CREATE POLICY "Authenticated users can create merchants" 
ON merchants FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 2. Merchant Users Policies
CREATE POLICY "Users can view users in their merchants" 
ON merchant_users FOR SELECT 
USING (auth.user_belongs_to_merchant(merchant_id));

CREATE POLICY "Owners can manage users" 
ON merchant_users FOR ALL 
USING (auth.user_is_merchant_owner(merchant_id));

CREATE POLICY "Authenticated users can create their own merchant user mapping" 
ON merchant_users FOR INSERT 
WITH CHECK (auth.uid() = user_id AND role = 'owner');

-- 3. Assets Policies
CREATE POLICY "Users can view assets for their merchants" 
ON assets FOR SELECT 
USING (auth.user_belongs_to_merchant(merchant_id));

CREATE POLICY "Users can manage assets for their merchants" 
ON assets FOR ALL 
USING (auth.user_belongs_to_merchant(merchant_id));

-- 4. Payment Links Policies
CREATE POLICY "Users can view payment links for their merchants" 
ON payment_links FOR SELECT 
USING (auth.user_belongs_to_merchant(merchant_id));

CREATE POLICY "Users can manage payment links for their merchants" 
ON payment_links FOR ALL 
USING (auth.user_belongs_to_merchant(merchant_id));

-- 5. Transactions Policies
CREATE POLICY "Users can view transactions for their merchants" 
ON transactions FOR SELECT 
USING (auth.user_belongs_to_merchant(merchant_id));

-- 6. Provider Configurations Policies (OWNERS ONLY)
CREATE POLICY "Owners can view provider configs" 
ON provider_configurations FOR SELECT 
USING (auth.user_is_merchant_owner(merchant_id));

CREATE POLICY "Owners can manage provider configs" 
ON provider_configurations FOR ALL 
USING (auth.user_is_merchant_owner(merchant_id));

-- 7. Merchant Website Configurations Policies
CREATE POLICY "Users can view website configs" 
ON merchant_website_configurations FOR SELECT 
USING (auth.user_belongs_to_merchant(merchant_id));

CREATE POLICY "Users can manage website configs" 
ON merchant_website_configurations FOR ALL 
USING (auth.user_belongs_to_merchant(merchant_id));

-- Public read access for published websites
CREATE POLICY "Public can view published websites" 
ON merchant_website_configurations FOR SELECT 
USING (published = TRUE);

CREATE POLICY "Public can view merchant details for published websites" 
ON merchants FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM merchant_website_configurations mwc
    WHERE mwc.merchant_id = merchants.id AND mwc.published = TRUE
  )
);
