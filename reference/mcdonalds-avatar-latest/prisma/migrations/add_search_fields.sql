-- Add tags and search_terms columns for fuzzy search
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS search_terms TEXT[] DEFAULT '{}';

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN index for tags (fast array searches)
CREATE INDEX IF NOT EXISTS idx_menu_items_tags
  ON menu_items USING gin(tags);

-- Add trigram indexes for fuzzy name search
CREATE INDEX IF NOT EXISTS idx_menu_items_name_trgm
  ON menu_items USING gin(name gin_trgm_ops);

-- Add trigram indexes for fuzzy description search
CREATE INDEX IF NOT EXISTS idx_menu_items_description_trgm
  ON menu_items USING gin(description gin_trgm_ops);
