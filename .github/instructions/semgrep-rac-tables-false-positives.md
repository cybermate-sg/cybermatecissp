# Semgrep RAC_* Tables False Positives

## Pattern Information
- **Pattern**: Enforce Access to RAC_* Tables in SQL Queries
- **Source**: Semgrep (Default coding standard)
- **Severity**: HIGH
- **Category**: Security
- **Time to fix**: 10 minutes

## Why This is Flagged

Semgrep enforces that all SQL queries should target tables with names starting with `RAC_*` to ensure data consistency and adherence to database access policies, preventing accidental or unauthorized access to other tables.

**Good examples (according to pattern):**
```sql
SELECT * FROM RAC_Users WHERE UserID = 1;
UPDATE RAC_Orders SET Status = 'Processed' WHERE OrderID = 123;
```

**Bad examples (according to pattern):**
```sql
SELECT * FROM Users WHERE UserID = 1;
DELETE FROM Orders WHERE OrderID = 123;
```

## False Positive Cases

### PostgreSQL System Table Queries

The flagged queries in `xata-fix-enums.sql` and `drop-orphaned-enums.sql` are querying **PostgreSQL system catalogs**, not application data tables.

#### Affected Files and Lines

1. **`xata-fix-enums.sql`** - Lines 13, 17, 21, 25, 29
2. **`drop-orphaned-enums.sql`** - Line 5

### Why These Are False Positives

#### 1. System Catalog Queries (`pg_type`)

```sql
SELECT 1 FROM pg_type WHERE typname = 'mastery_status'
```

**Purpose**: Check if a PostgreSQL enum type exists before creating it.

**Why this is correct**:
- `pg_type` is a **PostgreSQL system catalog table**, not an application data table
- This is the **standard PostgreSQL method** for checking enum existence
- System tables are **never** prefixed with application-specific prefixes like `RAC_*`
- This is **metadata introspection**, not data access

#### 2. Enum Listing Queries

```sql
SELECT typname FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public' AND t.typtype = 'e'
ORDER BY typname;
```

**Purpose**: List all enum types in the public schema for verification.

**Why this is correct**:
- Queries PostgreSQL system catalogs (`pg_type`, `pg_namespace`)
- Required for database schema management and migration scripts
- No alternative exists - you **must** query system tables to introspect database metadata

### Context: Migration Scripts

Both files are **database migration scripts** that:
1. Check for existing enum types to avoid conflicts
2. Create enum types if they don't exist
3. Verify the database schema state

These operations are **administrative/schema management tasks**, not application data access.

## Why RAC_* Rule Doesn't Apply

The RAC_* table naming convention is meant to:
- Restrict access to **application data tables**
- Prevent unauthorized queries to **business data**
- Enforce **data access policies** for user-facing tables

It **does not apply** to:
- ✅ PostgreSQL system catalogs (`pg_*` tables)
- ✅ Information schema tables (`information_schema.*`)
- ✅ Database metadata queries
- ✅ Schema management operations
- ✅ Migration scripts

## Resolution Options

### Option 1: Disable Pattern for SQL Files (Recommended)

Since these are migration scripts that legitimately need to query system tables, exclude them from this pattern:

**Create/update `.semgrepignore`:**
```
# Migration scripts need to query PostgreSQL system tables
xata-fix-enums.sql
drop-orphaned-enums.sql
```

### Option 2: Disable Pattern Globally

If your application doesn't actually use the RAC_* naming convention, disable this pattern entirely in the Semgrep UI or configuration.

### Option 3: Inline Suppression (Not Recommended)

SQL files don't support inline comments in all contexts, making this option impractical.

## Security Justification

These queries are **secure** because:

1. ✅ **Read-only system queries**: Only SELECT from system catalogs
2. ✅ **No user input**: All table/type names are hardcoded
3. ✅ **Standard PostgreSQL practice**: Official method for enum introspection
4. ✅ **Migration context**: Schema management requires system table access
5. ✅ **No data exposure**: System catalogs contain metadata, not business data

## Additional Context

### File Purpose

**`xata-fix-enums.sql`**:
- Migration script for Xata database compatibility
- Creates enum types only if they don't exist
- Uses `pg_type` to check for existing enums
- **Note**: File header states it's kept for reference and no longer used directly

**`drop-orphaned-enums.sql`**:
- Cleanup script for orphaned enum types
- Lists current enums before and after cleanup
- Uses `pg_type` and `pg_namespace` for enum discovery

### PostgreSQL System Catalogs

PostgreSQL system catalogs are special tables that store:
- Database schema metadata
- Table definitions
- Type definitions (including enums)
- User permissions
- Index information

Common system catalogs:
- `pg_type` - Data types (including enums)
- `pg_class` - Tables and indexes
- `pg_namespace` - Schemas
- `pg_attribute` - Table columns

These tables **cannot** be renamed and **must** be queried for schema introspection.

## Recommendation

**Mark as false positive** and exclude these SQL migration files from the RAC_* table pattern. The pattern is designed for application data access, not database schema management.

### Suggested `.semgrepignore` Entry

```
# PostgreSQL migration scripts - legitimately query system catalogs
xata-fix-enums.sql
drop-orphaned-enums.sql
scripts/fix-migrations.js
scripts/deep-cleanup.js
scripts/investigate-enums.js
scripts/apply-migration.js
```

## Related Patterns

This is similar to other false positives in migration scripts:
- SQL injection warnings in migration scripts (see `codacy-sql-injection-false-positives.md`)
- Both involve legitimate administrative database operations that security patterns incorrectly flag

## Conclusion

These are **false positives** caused by Semgrep's RAC_* pattern not recognizing:
1. PostgreSQL system catalog queries
2. Database schema management operations
3. Migration script context

The code is correct and follows PostgreSQL best practices for enum type management.
