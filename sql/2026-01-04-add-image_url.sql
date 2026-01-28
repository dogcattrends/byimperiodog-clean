-- Migration: add image_url column to puppies (idempotent)
-- Run this in your Supabase SQL editor or via psql against the database

BEGIN;
ALTER TABLE IF EXISTS puppies
 ADD COLUMN IF NOT EXISTS image_url text;
COMMIT;

-- Optional: copy cover_url into image_url for existing rows where image_url is null
-- UPDATE puppies SET image_url = cover_url WHERE image_url IS NULL AND cover_url IS NOT NULL;
