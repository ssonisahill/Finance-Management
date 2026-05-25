-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create USER_PREFERENCES Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    financial_month_start_day INTEGER NOT NULL DEFAULT 18 CHECK (financial_month_start_day BETWEEN 1 AND 28),
    currency TEXT NOT NULL DEFAULT '₹',
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);

-- 2. Create ACCOUNTS Table
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'wallet',
    color TEXT NOT NULL,
    initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create CATEGORIES Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'tag',
    color TEXT NOT NULL,
    budget_limit NUMERIC(15, 2) DEFAULT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create TRANSACTIONS Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    linked_transfer_id UUID DEFAULT NULL, -- Will link paired transfer transactions
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Self-reference FK for transactions to support transfer tracking
ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_linked_transfer_id_fkey 
    FOREIGN KEY (linked_transfer_id) REFERENCES public.transactions(id) ON DELETE CASCADE;

-- 5. Create Transfer RPC Function
CREATE OR REPLACE FUNCTION public.create_transfer(
  p_user_id UUID,
  p_source_account_id UUID,
  p_dest_account_id UUID,
  p_amount NUMERIC,
  p_date DATE,
  p_description TEXT
) RETURNS VOID AS $$
DECLARE
  v_tx_out_id UUID := gen_random_uuid();
  v_tx_in_id UUID := gen_random_uuid();
  v_source_name TEXT;
  v_dest_name TEXT;
BEGIN
  -- Get account names for nice descriptions
  SELECT name INTO v_source_name FROM public.accounts WHERE id = p_source_account_id;
  SELECT name INTO v_dest_name FROM public.accounts WHERE id = p_dest_account_id;

  -- Insert Outgoing Transaction (Expense side of transfer)
  INSERT INTO public.transactions (
    id, user_id, account_id, type, description, amount, category_id, date, linked_transfer_id
  ) VALUES (
    v_tx_out_id, p_user_id, p_source_account_id, 'transfer', 
    COALESCE(NULLIF(p_description, ''), 'Transfer') || ' to ' || v_dest_name, 
    p_amount, NULL, p_date, v_tx_in_id
  );

  -- Insert Incoming Transaction (Income side of transfer)
  INSERT INTO public.transactions (
    id, user_id, account_id, type, description, amount, category_id, date, linked_transfer_id
  ) VALUES (
    v_tx_in_id, p_user_id, p_dest_account_id, 'transfer', 
    COALESCE(NULLIF(p_description, ''), 'Transfer') || ' from ' || v_source_name, 
    p_amount, NULL, p_date, v_tx_out_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable Realtime Syncing
-- Drop publication if exists is not directly supported in Supabase easily, 
-- but we can safely add tables to it.
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
