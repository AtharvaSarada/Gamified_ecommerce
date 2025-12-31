-- Reviews System Production Migration
-- Senior Developer Edition: Robust, Transactional, and Idempotent.

-- WRAP IN TRANSACTION to ensure all-or-nothing execution.
BEGIN;

-- ==============================================================================
-- 1. CLEANUP (Aggressive Reset)
-- ==============================================================================
-- We drop objects in dependency order to prevent foreign key errors.
-- This ensures that if the script runs, we are 100% sure of the final state.
-- WARNING: This will DELETE all existing reviews/votes data. This is necessary to fix schema mismatches.
DROP TRIGGER IF EXISTS set_edited_at ON reviews;
DROP TRIGGER IF EXISTS refresh_rating_cache_trigger ON reviews;
DROP FUNCTION IF EXISTS update_edited_at();
DROP FUNCTION IF EXISTS refresh_product_rating_cache();
DROP FUNCTION IF EXISTS check_rate_limit(uuid);
DROP FUNCTION IF EXISTS check_user_purchased_product(uuid, uuid);
DROP FUNCTION IF EXISTS get_product_rating_summary(uuid);

DROP TABLE IF EXISTS review_responses CASCADE;
DROP TABLE IF EXISTS review_reports CASCADE;
DROP TABLE IF EXISTS review_votes CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP MATERIALIZED VIEW IF EXISTS product_rating_cache CASCADE;

-- ==============================================================================
-- 2. SCHEMA DEFINITION
-- ==============================================================================

-- A. Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100), 
  comment TEXT NOT NULL CHECK (char_length(comment) BETWEEN 10 AND 2000), 
  images TEXT[] DEFAULT ARRAY[]::TEXT[], 
  verified_purchase BOOLEAN DEFAULT false, 
  is_published BOOLEAN DEFAULT true, 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ 
);

-- Performance Indexes
CREATE INDEX idx_reviews_product_published ON reviews(product_id) WHERE is_published = true; 
CREATE INDEX idx_reviews_user_id ON reviews(user_id); 
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC); 

-- B. Review Votes (Helpful/Unhelpful)
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')), 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id) 
);

CREATE INDEX idx_review_votes_review ON review_votes(review_id);

-- C. Review Reports (Moderation)
CREATE TABLE review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- D. Review Responses (Admin/Seller replies)
CREATE TABLE review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  responder_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. Profile Admin Flag (Idempotent Check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- F. Materialized View for Analytics/Aggregates
CREATE MATERIALIZED VIEW product_rating_cache AS
SELECT 
  product_id,
  COALESCE(AVG(rating), 0) as avg_rating,
  COUNT(*) as review_count,
  COUNT(*) FILTER (WHERE rating = 5) as five_star,
  COUNT(*) FILTER (WHERE rating = 4) as four_star,
  COUNT(*) FILTER (WHERE rating = 3) as three_star,
  COUNT(*) FILTER (WHERE rating = 2) as two_star,
  COUNT(*) FILTER (WHERE rating = 1) as one_star
FROM reviews
WHERE is_published = true
GROUP BY product_id;

CREATE UNIQUE INDEX idx_product_rating_cache_id ON product_rating_cache(product_id);

-- ==============================================================================
-- 3. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- A. Refresh Cache
CREATE FUNCTION refresh_product_rating_cache()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_rating_cache;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_rating_cache_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_product_rating_cache();

-- B. Auto-update `edited_at`
CREATE FUNCTION update_edited_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.edited_at = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_edited_at
BEFORE UPDATE ON reviews
FOR EACH ROW
WHEN (OLD.comment IS DISTINCT FROM NEW.comment 
      OR OLD.title IS DISTINCT FROM NEW.title 
      OR OLD.rating IS DISTINCT FROM NEW.rating)
EXECUTE FUNCTION update_edited_at();

-- C. Rate Limiting Check (Security)
CREATE FUNCTION check_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM reviews
  WHERE user_id = p_user_id
  AND created_at > NOW() - INTERVAL '24 hours';
  RETURN recent_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Verified Purchase Check (Business Logic)
CREATE FUNCTION check_user_purchased_product(u_id UUID, p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = u_id
    AND oi.product_id = p_id
    AND o.status = 'delivered'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Aggregate Helper (Fallback)
CREATE FUNCTION get_product_rating_summary(p_id UUID)
RETURNS TABLE (
  avg_rating NUMERIC,
  review_count BIGINT,
  five_star BIGINT,
  four_star BIGINT,
  three_star BIGINT,
  two_star BIGINT,
  one_star BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 5),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 1)
  FROM reviews
  WHERE product_id = p_id
  AND is_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- Reviews
CREATE POLICY "Public Read" ON reviews FOR SELECT USING (is_published = true);
CREATE POLICY "Own Read" ON reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Verified Insert" ON reviews FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND check_user_purchased_product(auth.uid(), product_id)
  AND check_rate_limit(auth.uid())
);
CREATE POLICY "Owner Edit (48h)" ON reviews FOR UPDATE TO authenticated USING (
  user_id = auth.uid() AND created_at > NOW() - INTERVAL '48 hours'
) WITH CHECK (
  user_id = auth.uid() AND created_at > NOW() - INTERVAL '48 hours'
);
CREATE POLICY "Owner Delete (48h)" ON reviews FOR DELETE TO authenticated USING (
  user_id = auth.uid() AND created_at > NOW() - INTERVAL '48 hours'
);

-- Votes
CREATE POLICY "Vote Read" ON review_votes FOR SELECT USING (true);
CREATE POLICY "Vote Insert" ON review_votes FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (SELECT 1 FROM reviews WHERE id = review_id AND user_id = auth.uid()) 
);
CREATE POLICY "Vote Delete" ON review_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reports
CREATE POLICY "Report Insert" ON review_reports FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = reporter_user_id
  AND NOT EXISTS (SELECT 1 FROM review_reports WHERE review_id = review_reports.review_id AND reporter_user_id = auth.uid()) 
);

-- Responses
CREATE POLICY "Admin Response Insert" ON review_responses FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin Response Update" ON review_responses FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Response Read" ON review_responses FOR SELECT USING (true);

-- ==============================================================================
-- 5. STORAGE POLICIES (Review Images)
-- ==============================================================================
DO $$
BEGIN
    DROP POLICY IF EXISTS "Review Images Select" ON storage.objects;
    DROP POLICY IF EXISTS "Review Images Insert" ON storage.objects;
    DROP POLICY IF EXISTS "Review Images Delete" ON storage.objects;

    CREATE POLICY "Review Images Select" ON storage.objects FOR SELECT
    USING ( bucket_id = 'review-images' );

    CREATE POLICY "Review Images Insert" ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (
        bucket_id = 'review-images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Review Images Delete" ON storage.objects FOR DELETE 
    TO authenticated 
    USING (
        bucket_id = 'review-images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Storage extension schema not found. Please setup storage manually.';
END $$;

COMMIT;
