-- Clean up orphaned test_status enum
-- Using quoted identifier for safety against SQL injection
DROP TYPE IF EXISTS public."test_status" CASCADE;
