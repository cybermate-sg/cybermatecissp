-- Xata-compatible migration script
-- This script handles existing enums and tables gracefully
-- NOTE: This file is kept for reference but is no longer used directly.
-- The run-xata-fix.js script now uses programmatic SQL generation for better security.

-- Drop orphaned enums if they exist (using quoted identifiers for safety)
DROP TYPE IF EXISTS public."test_status" CASCADE;
DROP TYPE IF EXISTS public."test_type" CASCADE;

-- Create enums only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mastery_status') THEN
        CREATE TYPE public.mastery_status AS ENUM('new', 'learning', 'mastered');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM('succeeded', 'failed', 'pending');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
        CREATE TYPE public.plan_type AS ENUM('free', 'pro_monthly', 'pro_yearly', 'lifetime');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE public.subscription_status AS ENUM('active', 'canceled', 'past_due', 'trialing', 'inactive');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM('user', 'admin');
    END IF;
END $$;
