// src/pages/api/weekend-votes.ts
import type { APIRoute } from 'astro';
import { pool } from '../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId        = Number(params.get('tripId'));
  const participantId = Number(params.get('participantId'));
  const weekendId     = Number(params.get('weekendId'));
  const availability  = (params.get('availability') ?? '').trim(); // 'yes' | 'maybe' | 'no'
  const outboundDate  = (params.get('outboundDate') ?? '').trim();
  const returnDate    = (params.get('returnDate') ?? '').trim();
  const shareCode     = (params.get('shareCode') ?? '').trim();

  if (
    !tripId || Number.isNaN(tripId) ||
    !participantId || Number.isNaN(participantId) ||
    !weekendId || Number.isNaN(weekendId) ||
    !['yes', 'maybe', 'no'].includes(availability) ||
    !shareCode
  ) {
    return new Response('Datos inválidos', { status: 400 });
  }

  // Si marca "no", ignoramos días de ida/vuelta
  const outbound = availability === 'no' || !outboundDate ? null : outboundDate;
  const ret      = availability === 'no' || !returnDate   ? null : returnDate;

  try {
    await pool.query(
      `
      INSERT INTO weekend_votes (trip_id, participant_id, weekend_id, availability, outbound_date, return_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (trip_id, participant_id, weekend_id)
      DO UPDATE SET
        availability  = EXCLUDED.availability,
        outbound_date = EXCLUDED.outbound_date,
        return_date   = EXCLUDED.return_date,
        updated_at    = now()
      `,
      [tripId, participantId, weekendId, availability, outbound, ret]
    );

    return new Response(null, {
      status: 303,
      headers: {
        Location: `/join/${encodeURIComponent(shareCode)}?participantId=${participantId}`,
      },
    });
  } catch (err) {
    console.error('Error guardando weekend_vote:', err);
    return new Response('Error guardando disponibilidad', { status: 500 });
  }
};
