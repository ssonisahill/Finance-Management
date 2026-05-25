CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disable RLS
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- Enable Realtime Sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
