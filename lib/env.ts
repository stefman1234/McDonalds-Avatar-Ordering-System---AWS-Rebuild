function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  OPENAI_API_KEY: () => required("OPENAI_API_KEY"),
  DATABASE_URL: () => required("DATABASE_URL"),
  NEXT_PUBLIC_KLLEON_SDK_KEY:
    process.env.NEXT_PUBLIC_KLLEON_SDK_KEY ?? "",
  NEXT_PUBLIC_KLLEON_AVATAR_ID:
    process.env.NEXT_PUBLIC_KLLEON_AVATAR_ID ?? "",
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  // DynamoDB (optional — local dev works without these)
  DYNAMODB_TABLE_SESSIONS:
    process.env.DYNAMODB_TABLE_SESSIONS ?? "",
  DYNAMODB_TABLE_CACHE:
    process.env.DYNAMODB_TABLE_CACHE ?? "",
  AWS_REGION: process.env.AWS_REGION ?? "",
};
