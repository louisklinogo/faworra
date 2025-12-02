import 'dotenv/config';
import { readFileSync } from 'fs';
import path from 'path';
import { Client } from 'pg';

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL or SUPABASE_DB_URL is required in env');
    process.exit(1);
  }

  const sqlPath = path.resolve(
    __dirname,
    '..',
    'drizzle',
    'manual-migrations',
    '0046_communication_thread_tags.sql',
  );
  const sql = readFileSync(sqlPath, 'utf8');

  const client = new Client({ connectionString: dbUrl, application_name: 'faworra-migrate' });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration applied: communication_thread_tags');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
