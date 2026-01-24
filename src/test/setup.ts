// Set dummy connection string to prevent db/index.ts from throwing during imports
process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_dummy';
process.env.CLERK_SECRET_KEY = 'sk_test_dummy';

// Global mocks if needed, but per-file mocks are safer for now to avoid pollution
