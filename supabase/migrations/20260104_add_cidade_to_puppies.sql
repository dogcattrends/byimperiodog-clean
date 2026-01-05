-- Migration: add_cidade_to_puppies
-- Generated: 2026-01-04

BEGIN;

-- Add Portuguese column aliases to puppies table to support legacy payloads
ALTER TABLE IF EXISTS public.puppies
  ADD COLUMN IF NOT EXISTS cidade text;

ALTER TABLE IF EXISTS public.puppies
  ADD COLUMN IF NOT EXISTS estado text;

COMMIT;
