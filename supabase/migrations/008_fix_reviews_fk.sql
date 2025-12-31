-- Fix Reviews -> Profiles Relationship
-- PostgREST requires an explicit Foreign Key to 'profiles' to allow embedding (joining) it in queries.

BEGIN;

-- 1. Link reviews to profiles
ALTER TABLE reviews
ADD CONSTRAINT reviews_user_id_fkey_profiles
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- 2. Link review_responses to profiles (for admin repies)
ALTER TABLE review_responses
ADD CONSTRAINT review_responses_responder_id_fkey_profiles
FOREIGN KEY (responder_user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- 3. Link review_votes to profiles (optional, but good for consistency)
ALTER TABLE review_votes
ADD CONSTRAINT review_votes_user_id_fkey_profiles
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

COMMIT;
