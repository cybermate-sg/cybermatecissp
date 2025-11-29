-- Direct SQL script to drop orphaned enums
-- Run this with: psql $DATABASE_URL -f drop-orphaned-enums.sql

\echo 'Listing current enums...'
SELECT typname FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public' AND t.typtype = 'e'
ORDER BY typname;

\echo ''
\echo 'Dropping orphaned enums...'

-- Using quoted identifiers for safety against SQL injection
DROP TYPE IF EXISTS public."test_status" CASCADE;
DROP TYPE IF EXISTS public."test_type" CASCADE;

\echo ''
\echo 'Verification - remaining enums:'
SELECT typname FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public' AND t.typtype = 'e'
ORDER BY typname;

\echo ''
\echo 'Done!'
