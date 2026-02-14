-- PostgreSQL Schema for Consumer Complaints ML + GenAI System
-- Database Schema for AI-Based Consumer Complaints Classification
-- This schema defines tables for users, complaints, classification results, and AI explanations

-- Drop existing tables if they exist (development only)
DROP TABLE IF EXISTS ai_explanations CASCADE;
DROP TABLE IF EXISTS classification_results CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- Users Table
-- ============================================================================
-- Stores user authentication information and role-based access control
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient user lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- Complaints Table
-- ============================================================================
-- Stores submitted consumer complaints
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    complaint_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint with SET NULL on delete
    CONSTRAINT fk_complaints_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- Indexes for efficient complaint queries
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);

-- ============================================================================
-- Classification Results Table
-- ============================================================================
-- Stores ML classification predictions for complaints
CREATE TABLE classification_results (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL,
    confidence FLOAT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint with cascade delete
    CONSTRAINT fk_classification_complaint
        FOREIGN KEY (complaint_id)
        REFERENCES complaints(id)
        ON DELETE CASCADE
);

-- Indexes for efficient classification queries
CREATE INDEX idx_classification_complaint_id ON classification_results(complaint_id);
CREATE INDEX idx_classification_category ON classification_results(category);
CREATE INDEX idx_classification_created_at ON classification_results(created_at DESC);

-- ============================================================================
-- AI Explanations Table
-- ============================================================================
-- Stores GenAI-generated explanations for classifications
CREATE TABLE ai_explanations (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint with cascade delete
    CONSTRAINT fk_explanation_complaint
        FOREIGN KEY (complaint_id)
        REFERENCES complaints(id)
        ON DELETE CASCADE
);

-- Indexes for efficient explanation queries
CREATE INDEX idx_explanations_complaint_id ON ai_explanations(complaint_id);
CREATE INDEX idx_explanations_created_at ON ai_explanations(created_at DESC);

-- ============================================================================
-- Comments
-- ============================================================================

-- Users Table:
--   - id: Auto-incrementing primary key
--   - username: Unique username for login (indexed for fast lookup)
--   - email: Unique email address for login and recovery
--   - password_hash: Securely stored password hash
--   - role: USER or ADMIN for role-based access control
--   - created_at: Timestamp of account creation

-- Complaints Table:
--   - id: Auto-incrementing primary key
--   - user_id: Foreign key to users (SET NULL: when user is deleted, complaints remain but user_id is nullified)
--   - complaint_text: Raw text of the consumer complaint
--   - created_at: Timestamp when complaint was submitted

-- Classification Results Table:
--   - id: Auto-incrementing primary key
--   - complaint_id: Foreign key to complaints (CASCADE DELETE: when complaint is deleted, classification is also deleted)
--   - category: Predicted complaint category (e.g., 'Billing Issue', 'Service Quality', 'Delivery Problem')
--   - confidence: ML prediction confidence score (0.0 to 1.0)
--   - created_at: Timestamp of classification

-- AI Explanations Table:
--   - id: Auto-incrementing primary key
--   - complaint_id: Foreign key to complaints (CASCADE DELETE: when complaint is deleted, explanation is also deleted)
--   - explanation: GenAI-generated human-readable explanation
--   - created_at: Timestamp of explanation generation

-- ============================================================================
-- Access Patterns
-- ============================================================================

-- 1. User Complaint History (most common query):
--    SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC;
--    -> Optimized by idx_complaints_user_id and idx_complaints_created_at

-- 2. Get Classification for Complaint:
--    SELECT * FROM classification_results WHERE complaint_id = ?;
--    -> Optimized by idx_classification_complaint_id

-- 3. Get Explanation for Complaint:
--    SELECT * FROM ai_explanations WHERE complaint_id = ?;
--    -> Optimized by idx_explanations_complaint_id

-- 4. View Complaints by Category:
--    SELECT c.*, cr.category FROM complaints c
--    JOIN classification_results cr ON c.id = cr.complaint_id
--    WHERE cr.category = ?;
--    -> Optimized by idx_classification_category

-- 5. Admin View All Recent Complaints:
--    SELECT * FROM complaints ORDER BY created_at DESC;
--    -> Optimized by idx_complaints_created_at

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data:
/*
-- Insert sample user
INSERT INTO users (username, role)
VALUES ('testuser', 'USER');

-- Insert sample complaint
INSERT INTO complaints (user_id, complaint_text)
VALUES (1, 'I was charged twice for the same transaction on my credit card.');

-- Insert sample classification result
INSERT INTO classification_results (complaint_id, category, confidence)
VALUES (1, 'Billing Issue', 0.91);

-- Insert sample AI explanation
INSERT INTO ai_explanations (complaint_id, explanation)
VALUES (1, 'The complaint was classified as a Billing Issue because it mentions duplicate charges and credit card transactions, which are commonly associated with billing problems.');
*/


-- ============================================================================
-- End of Schema
-- ============================================================================
