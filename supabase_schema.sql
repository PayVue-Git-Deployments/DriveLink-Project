-- Supabase Schema for DriveLink

-- Create profiles table (Public)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table (Private)
CREATE TABLE user_settings (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_expiry TIMESTAMP WITH TIME ZONE,
  sheet_id TEXT,
  twilio_phone_number TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for user_settings
CREATE POLICY "Users can view own settings." ON user_settings
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own settings." ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own settings." ON user_settings
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, slug)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    LOWER(REGEXP_REPLACE(new.raw_user_meta_data->>'full_name', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(new.id::text FROM 1 FOR 6)
  );
  
  INSERT INTO public.user_settings (id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
