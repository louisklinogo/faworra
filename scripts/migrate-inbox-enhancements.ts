import 'dotenv/config';
import { readFileSync } from 'fs';
import path from 'path';
import { Client } from 'pg';

async function apply(file: string, client: Client) {
  const sql = readFileSync(file, 'utf8');
  await client.query(sql);
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL or SUPABASE_DB_URL is required');
    process.exit(1);
  }
  const client = new Client({ connectionString: dbUrl, application_name: 'faworra-migrate' });
  await client.connect();
  try {
    await client.query('BEGIN');
    const file = path.resolve(
      __dirname,
      '..',
      'drizzle',
      'manual-migrations',
      '0047_inbox_views_macros_assignment_fts.sql',
    );
    await apply(file, client);
    await client.query('COMMIT');
    console.log('Migration applied: 0047_inbox_views_macros_assignment_fts');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
