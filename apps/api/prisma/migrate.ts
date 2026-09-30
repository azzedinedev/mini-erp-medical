import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const migrationName = '0001_init';
const migrationPath = path.resolve(__dirname, '../../../prisma/migrations', migrationName, 'migration.sql');

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL est requis pour appliquer les migrations.');

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_mediflow_migrations" (
        "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        "migration_name" VARCHAR(255) NOT NULL UNIQUE,
        "applied_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const existing = await client.query<{ migration_name: string }>(
      'SELECT "migration_name" FROM "_mediflow_migrations" WHERE "migration_name" = $1',
      [migrationName],
    );
    if (existing.rowCount) {
      console.log(`Migration ${migrationName} déjà appliquée.`);
      await client.query('COMMIT');
      return;
    }

    const availableExtensions = await client.query<{ name: string }>(
      'SELECT name FROM pg_available_extensions WHERE name = ANY($1::text[])',
      [['pgcrypto', 'pg_trgm']],
    );
    const available = new Set(availableExtensions.rows.map(({ name }) => name));
    let migrationSql = await fs.readFile(migrationPath, 'utf8');
    for (const extension of ['pgcrypto', 'pg_trgm']) {
      if (!available.has(extension)) {
        migrationSql = migrationSql.replace(new RegExp(`^CREATE EXTENSION IF NOT EXISTS "${extension}";\\n`, 'm'), '');
        console.warn(`Extension PostgreSQL ${extension} indisponible : les fonctionnalités optionnelles associées sont ignorées.`);
      }
    }

    let plpgsqlAvailable = true;
    await client.query('SAVEPOINT plpgsql_probe');
    try {
      await client.query("CREATE FUNCTION _mediflow_plpgsql_probe() RETURNS integer LANGUAGE plpgsql AS $$ BEGIN RETURN 1; END; $$");
      await client.query('DROP FUNCTION _mediflow_plpgsql_probe()');
    } catch {
      plpgsqlAvailable = false;
      await client.query('ROLLBACK TO SAVEPOINT plpgsql_probe');
    }
    await client.query('RELEASE SAVEPOINT plpgsql_probe');
    if (!plpgsqlAvailable) {
      migrationSql = migrationSql.replace(/\n-- Immutable patient workflow:[\s\S]*$/, '\n');
      console.warn('Le langage PostgreSQL plpgsql est indisponible : le trigger d’audit optionnel est ignoré.');
    }

    await client.query(migrationSql);
    await client.query('INSERT INTO "_mediflow_migrations" ("migration_name") VALUES ($1)', [migrationName]);
    await client.query('COMMIT');
    console.log(`Migration ${migrationName} appliquée.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
