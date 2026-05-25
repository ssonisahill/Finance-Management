-- 1. Ensure Row Level Security is actually enabled (Supabase often enforces this)
ALTER TABLE public.assets_liabilities ENABLE ROW LEVEL SECURITY;

-- 2. Drop the policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own assets and liabilities" ON public.assets_liabilities;

-- 3. Create the proper RLS policy allowing you to insert, read, update, and delete your own records
CREATE POLICY "Users can manage their own assets and liabilities"
ON public.assets_liabilities
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
