-- =============================================================================
-- Migration V3: Response Workflow Storage
-- =============================================================================
-- Adds persistence for generated drafts, edited final replies, and delivery data.

ALTER TABLE classification_results
    ADD COLUMN IF NOT EXISTS draft_response_text TEXT;

ALTER TABLE classification_results
    ADD COLUMN IF NOT EXISTS final_response_text TEXT;

ALTER TABLE classification_results
    ADD COLUMN IF NOT EXISTS sent_to_email VARCHAR(255);

ALTER TABLE classification_results
    ADD COLUMN IF NOT EXISTS delivery_mode VARCHAR(20)
        NOT NULL DEFAULT 'pending'
        CHECK (delivery_mode IN ('pending', 'simulate', 'smtp'));

CREATE INDEX IF NOT EXISTS idx_classification_delivery_mode
    ON classification_results(delivery_mode);

DO $$
BEGIN
    RAISE NOTICE 'Migration V3 applied successfully.';
    RAISE NOTICE 'New columns: draft_response_text, final_response_text, sent_to_email, delivery_mode';
END
$$;