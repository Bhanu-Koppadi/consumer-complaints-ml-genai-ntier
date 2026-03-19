-- =============================================================================
-- Migration V2: Advanced Intelligence Fields
-- AI-Driven Consumer Complaint Intelligence System
-- =============================================================================
-- Adds severity, priority, routing decision, and response-status tracking
-- to the classification_results table.
--
-- Run ONCE against the existing database. Safe to re-run (uses IF NOT EXISTS).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. severity — HIGH / MEDIUM / LOW (rule-based detector)
-- ---------------------------------------------------------------------------
ALTER TABLE classification_results
    ADD COLUMN IF NOT EXISTS severity VARCHAR(10)
        NOT NULL DEFAULT 'Low'
        CHECK (severity IN ('High', 'Medium', 'Low'));

-- ---------------------------------------------------------------------------
-- 2. priority — P1 / P2 / P3 (mapped from severity)
-- ---------------------------------------------------------------------------
ALTER TABLE classification_results
    ADD COLUMN IF NOT EXISTS priority VARCHAR(5)
        NOT NULL DEFAULT 'P3'
        CHECK (priority IN ('P1', 'P2', 'P3'));

-- ---------------------------------------------------------------------------
-- 3. recommended_action — routing decision from the decision engine
-- ---------------------------------------------------------------------------
ALTER TABLE classification_results
    ADD COLUMN IF NOT EXISTS recommended_action VARCHAR(20)
        NOT NULL DEFAULT 'review_required'
        CHECK (recommended_action IN ('auto_send', 'review_required', 'escalate'));

-- ---------------------------------------------------------------------------
-- 4. response_status — tracks where the response is in its lifecycle
-- ---------------------------------------------------------------------------
ALTER TABLE classification_results
    ADD COLUMN IF NOT EXISTS response_status VARCHAR(20)
        NOT NULL DEFAULT 'pending'
        CHECK (response_status IN ('pending', 'auto_sent', 'approved', 'escalated', 'overridden'));

-- ---------------------------------------------------------------------------
-- 5. auto_sent_at — timestamp when an auto-send was triggered
-- ---------------------------------------------------------------------------
ALTER TABLE classification_results
    ADD COLUMN IF NOT EXISTS auto_sent_at TIMESTAMP DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- 6. override_by_user_id — admin who manually overrode the routing decision
-- ---------------------------------------------------------------------------
ALTER TABLE classification_results
    ADD COLUMN IF NOT EXISTS override_by_user_id INTEGER DEFAULT NULL
        REFERENCES users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 7. override_at — when the override was applied
-- ---------------------------------------------------------------------------
ALTER TABLE classification_results
    ADD COLUMN IF NOT EXISTS override_at TIMESTAMP DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- Supporting indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_classification_severity
    ON classification_results(severity);

CREATE INDEX IF NOT EXISTS idx_classification_recommended_action
    ON classification_results(recommended_action);

CREATE INDEX IF NOT EXISTS idx_classification_response_status
    ON classification_results(response_status);

-- ---------------------------------------------------------------------------
-- Verify migration
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE 'Migration V2 applied successfully.';
    RAISE NOTICE 'New columns: severity, priority, recommended_action, response_status, auto_sent_at, override_by_user_id, override_at';
END
$$;
