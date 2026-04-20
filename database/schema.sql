-- 1. Create Profiles Table
-- This table stores metadata for each user, linked to Supabase Auth.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  username TEXT,
  learning_goal TEXT,
  experience_level TEXT,
  interest_areas TEXT[],
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Learning Paths Table
-- Stores the curriculum data. We use JSONB for daily_tasks to maintain flexibility.
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan_id TEXT UNIQUE NOT NULL,
  module_id TEXT NOT NULL,
  level TEXT NOT NULL,
  pace TEXT NOT NULL,
  start_date TEXT NOT NULL,
  target_end_date TEXT,
  actual_end_date TEXT,
  total_days INTEGER NOT NULL,
  total_hours FLOAT DEFAULT 0.0,
  completed_days INTEGER DEFAULT 0,
  completion_percentage FLOAT DEFAULT 0.0,
  daily_tasks JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 5. Create Policies for Learning Paths
CREATE POLICY "Users can view own learning paths" 
ON public.learning_paths FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own learning paths" 
ON public.learning_paths FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning paths" 
ON public.learning_paths FOR UPDATE 
USING (auth.uid() = user_id);

-- 6. Trigger for profile creation on signup
-- This automatically creates a row in 'profiles' when a user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
