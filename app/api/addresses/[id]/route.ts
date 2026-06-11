import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      name, company_name,
      phone_country_code, phone_number,
      address_line1, address_line2,
      city, state, postal_code, country,
    } = await req.json();

    const result = await pool.query(
      `UPDATE envelope_addresses SET
         name=$1, company_name=$2,
         phone_country_code=$3, phone_number=$4,
         address_line1=$5, address_line2=$6,
         city=$7, state=$8, postal_code=$9, country=$10,
         updated_at=CURRENT_TIMESTAMP
       WHERE id=$11
       RETURNING *`,
      [
        name, company_name || null,
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
