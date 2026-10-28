// Imported first by every test file: isolated in-memory database and fixed test secrets (never real ones).
process.env.BAYORA_DB_PATH = ":memory:";
process.env.NODE_ENV = "test";
process.env.TARGET_LLM_PROVIDER = "mock";
process.env.BAYORA_TOKEN_SECRET = "test-token-secret-0123456789abcdef";
process.env.BAYORA_ADMIN_KEY = "test-admin-key-0123456789abcdef";
process.env.BAYORA_RED_ENROLL_SECRET = "test-red-enroll-0123456789abcdef";
process.env.BAYORA_BLUE_ENROLL_SECRET = "test-blue-enroll-0123456789abcdef";
process.env.BLUE_FILTER_MODE = "local";
export {};
