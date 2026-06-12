import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Create table if it doesn't exist (new installs)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS envelope_addresses (
        id                 SERIAL PRIMARY KEY,
        name               VARCHAR(200) NOT NULL,
        company_name       VARCHAR(200),
        phone_country_code VARCHAR(10)  NOT NULL DEFAULT '+91',
        phone_number       VARCHAR(30)  NOT NULL DEFAULT '',
        address_line1      VARCHAR(200) NOT NULL,
        address_line2      VARCHAR(200),
        city               VARCHAR(100) NOT NULL,
        state              VARCHAR(100),
        postal_code        VARCHAR(20),
        country            VARCHAR(100),
        created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrate first_name + last_name → name (only if first_name column still exists)
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'envelope_addresses' AND column_name = 'first_name'
        ) THEN
          ALTER TABLE envelope_addresses ADD COLUMN IF NOT EXISTS name VARCHAR(200);
          UPDATE envelope_addresses
            SET name = TRIM(CONCAT(first_name, ' ', last_name))
            WHERE name IS NULL OR name = '';
          ALTER TABLE envelope_addresses DROP COLUMN IF EXISTS first_name;
          ALTER TABLE envelope_addresses DROP COLUMN IF EXISTS last_name;
        END IF;
      END $$;
    `);

    // Fix rows where name ended up NULL or empty (e.g. saved before the field was wired up)
    await pool.query(`
      UPDATE envelope_addresses
      SET name = COALESCE(NULLIF(TRIM(company_name), ''), city, 'Unknown')
      WHERE name IS NULL OR TRIM(name) = ''
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DB init error:', error);
    return NextResponse.json({ error: 'DB init failed' }, { status: 500 });
  }
}
