import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      first_name, last_name, company_name,
      phone_country_code, phone_number,
      address_line1, address_line2,
      city, state, postal_code, country,
    } = await req.json();

    const result = await pool.query(
      `UPDATE envelope_addresses SET
         first_name=$1, last_name=$2, company_name=$3,
         phone_country_code=$4, phone_number=$5,
         address_line1=$6, address_line2=$7,
         city=$8, state=$9, postal_code=$10, country=$11,
         updated_at=CURRENT_TIMESTAMP
       WHERE id=$12
       RETURNING *`,
      [
        first_name, last_name, company_name || null,
        phone_country_code, phone_number,
        address_line1, address_line2 || null,
        city, state || null, postal_code || null, country || null,
        params.id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await pool.query('DELETE FROM envelope_addresses WHERE id=$1', [params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
