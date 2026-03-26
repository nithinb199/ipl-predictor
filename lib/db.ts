import postgres from "postgres";

let sqlClient: postgres.Sql | null = null;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!sqlClient) {
    sqlClient = postgres(process.env.DATABASE_URL, {
      ssl: process.env.NODE_ENV === "production" ? "require" : "prefer",
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10
    });
  }

  return sqlClient;
}
