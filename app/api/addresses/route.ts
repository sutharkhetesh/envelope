import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  try {
    const result = search
      ? await pool.query(
          `SELECT * FROM envelope_addresses
           WHERE first_name ILIKE $1 OR last_name ILIKE $1
              OR company_name ILIKE $1 OR address_line1 ILIKE $1
              OR city ILIKE $1 OR postal_code ILIKE $1
              OR phone_number ILIKE $1
           ORDER BY created_at DESC`,
          [`%${search}%`]
        )
      : await pool.query('SELECT * FROM envelope_addresses ORDER BY created_at DESC');

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      first_name, last_name, company_name,
      phone_country_code, phone_number,
      address_line1, address_line2,
      city, state, postal_code, country,
    } = await req.json();

    const result = await pool.query(
      `INSERT INTO envelope_addresses
         (first_name, last_name, company_name, phone_country_code, phone_number,
          address_line1, address_line2, city, state, postal_code, country)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        first_name, last_name, company_name || null,
        phone_country_code, phone_number,
        address_line1, address_line2 || null,
        city, state || null, postal_code || null, country || null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}
