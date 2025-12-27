-- migrations/003_add_hero_flag.sql

-- 1. Add is_hero column to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_hero BOOLEAN DEFAULT FALSE;

-- 2. Create RPC function to safely set a single hero product
CREATE OR REPLACE FUNCTION set_hero_product(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Reset all products to false
  UPDATE products SET is_hero = FALSE WHERE is_hero = TRUE;
  
  -- Set the specific product to true
  UPDATE products SET is_hero = TRUE WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
