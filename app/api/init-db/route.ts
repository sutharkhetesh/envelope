import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS envelope_addresses (
        id                SERIAL PRIMARY KEY,
        name              VARCHAR(200) NOT NULL,
        company_name      VARCHAR(200),
        phone_country_code VARCHAR(10) NOT NULL DEFAULT '+91',
        phone_number      VARCHAR(30) NOT NULL,
        address_line1     VARCHAR(200) NOT NULL,
        address_line2     VARCHAR(200),
        city              VARCHAR(100) NOT NULL,
        state             VARCHAR(100),
        postal_code       VARCHAR(20),
        country           VARCHAR(100),
        created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrate: add name column, backfill from first/last, drop old columns
    await pool.query(`ALTER TABLE envelope_addresses ADD COLUMN IF NOT EXISTS name VARCHAR(200)`);
    await pool.query(`
      UPDATE envelope_addresses
      SET name = CONCAT(first_name, ' ', last_name)
      WHERE name IS NULL AND first_name IS NOT NULL
    `);
    await pool.query(`ALTER TABLE envelope_addresses ALTER COLUMN name SET NOT NULL`).catch(() => null);
    await pool.query(`ALTER TABLE envelope_addresses DROP COLUMN IF EXISTS first_name`);
    await pool.query(`ALTER TABLE envelope_addresses DROP COLUMN IF EXISTS last_name`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DB init error:', error);
    return NextResponse.json({ error: 'DB init failed' }, { status: 500 });
  }
}
