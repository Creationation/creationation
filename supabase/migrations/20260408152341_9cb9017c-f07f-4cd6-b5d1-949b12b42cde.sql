-- Add missing enum values
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'accounting';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'tools';

-- Add receipt_url column
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url text;