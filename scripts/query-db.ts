#!/usr/bin/env bun
/**
 * Simple database query script for CLI usage
 * Usage: bun scripts/query-db.ts "<query>"
 *
 * Examples:
 *   bun scripts/query-db.ts "SELECT * FROM \"User\" LIMIT 5"
 *   bun scripts/query-db.ts "SELECT COUNT(*) FROM \"Transaction\""
 */

import pg from "pg";
const { Client } = pg;
import type { Client as PgClient } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:devonly@localhost:5432/postgres?schema=public",
});

const query = process.argv[2];

if (!query) {
  console.log("Usage: bun scripts/query-db.ts \"<SQL_QUERY>\"");
  console.log("\nExamples:");
  console.log('  bun scripts/query-db.ts "SELECT * FROM \\"User\\" LIMIT 5"');
  console.log('  bun scripts/query-db.ts "SELECT COUNT(*) FROM \\"Transaction\\""');
  process.exit(1);
}

try {
  await client.connect();
  console.log("Executing query:", query);
  console.log("-".repeat(60));

  const result = await client.query(query);

  if (result.rows.length === 0) {
    console.log("No results found.");
  } else {
    console.table(result.rows);
    console.log(`\n${result.rows.length} row(s) returned.`);
  }
} catch (error) {
  console.error("Query error:", error instanceof Error ? error.message : String(error));
} finally {
  await client.end();
}
