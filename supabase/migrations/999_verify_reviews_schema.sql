-- VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to confirm your database is 100% correct.

DO $$
DECLARE
    missing_items TEXT[] := ARRAY[]::TEXT[];
    t_exists BOOLEAN;
    c_exists BOOLEAN;
BEGIN
    -- 1. Check REVIEWS Table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') INTO t_exists;
    IF NOT t_exists THEN missing_items := array_append(missing_items, 'Table: reviews'); END IF;

    -- 2. Check EDITED_AT Column (The critical fix)
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'edited_at') INTO c_exists;
    IF NOT c_exists THEN missing_items := array_append(missing_items, 'Column: reviews.edited_at'); END IF;

    -- 3. Check RATING Column & Type
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'rating' AND data_type = 'integer') INTO c_exists;
    IF NOT c_exists THEN missing_items := array_append(missing_items, 'Column: reviews.rating (integer)'); END IF;

    -- 4. Check REVIEW_VOTES Table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_votes') INTO t_exists;
    IF NOT t_exists THEN missing_items := array_append(missing_items, 'Table: review_votes'); END IF;

    -- 5. Check REVIEW_REPORTS Table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_reports') INTO t_exists;
    IF NOT t_exists THEN missing_items := array_append(missing_items, 'Table: review_reports'); END IF;

    -- 6. Check REVIEW_RESPONSES Table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_responses') INTO t_exists;
    IF NOT t_exists THEN missing_items := array_append(missing_items, 'Table: review_responses'); END IF;

    -- 7. Check MATERIALIZED VIEW
    -- Mat views are in pg_matviews, not information_schema.tables usually, or require specific check.
    IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'product_rating_cache') THEN
         missing_items := array_append(missing_items, 'Materialized View: product_rating_cache');
    END IF;

    -- REPORT
    IF array_length(missing_items, 1) > 0 THEN
        RAISE EXCEPTION '❌ VERIFICATION FAILED. Missing items: %', array_to_string(missing_items, ', ');
    ELSE
        RAISE NOTICE '✅ SUCCESS! All tables, columns, and views are present. The schema is correct.';
    END IF;
END $$;
