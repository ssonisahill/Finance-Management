CREATE TABLE IF NOT EXISTS public.assets_liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('asset', 'liability')),
    category TEXT NOT NULL,
    value NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (value >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assets_liabilities DISABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assets_liabilities;
