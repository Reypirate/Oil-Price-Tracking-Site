-- Oil Price Tracker Database Schema

-- 1. Profiles (extending auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Portfolios (tracked assets)
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  asset_code TEXT NOT NULL, -- e.g., 'WTI_USD', 'BRENT'
  quantity DECIMAL(18, 4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Alerts
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  asset_code TEXT NOT NULL, -- canonical code, e.g. 'WTI_USD'
  threshold_price DECIMAL(18, 4) NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
  is_active BOOLEAN DEFAULT TRUE,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3b. Backfill legacy WTI code to canonical value
UPDATE portfolios
SET asset_code = 'WTI_USD'
WHERE upper(asset_code) = 'WTI';

UPDATE alerts
SET asset_code = 'WTI_USD'
WHERE upper(asset_code) = 'WTI';

-- 4. Automated Profile Creation on Signup
-- This function will be triggered whenever a new user is created in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger itself
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Portfolios: Users can only see/edit their own portfolio items
CREATE POLICY "Users can view own portfolio" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own portfolio" ON portfolios FOR ALL USING (auth.uid() = user_id);

-- Alerts: Users can only see/edit their own alerts
CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own alerts" ON alerts FOR ALL USING (auth.uid() = user_id);

-- 7. Performance indexes for cron alert matching
CREATE INDEX IF NOT EXISTS idx_alerts_trigger_above
  ON alerts (asset_code, threshold_price)
  WHERE condition = 'above' AND is_active = TRUE AND triggered_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_alerts_trigger_below
  ON alerts (asset_code, threshold_price)
  WHERE condition = 'below' AND is_active = TRUE AND triggered_at IS NULL;
