// src/pages/api/destination-suggestions.ts
import type { APIRoute } from 'astro';
import { pool } from '../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId        = Number(params.get('tripId'));
  const participantId = Number(params.get('participantId'));
  const name          = (params.get('name') ?? '').trim();
  const country       = (params.get('country') ?? '').trim();
  const shareCode     = (params.get('shareCode') ?? '').trim();

  if (!tripId || !participantId || !name || !shareCode) {
    return new Response('Datos inválidos', { status: 400 });
  }

  try {
    // limitar a 3 sugerencias
    const countRes = await pool.query(
      'SELECT COUNT(*)::int AS c FROM participant_destination_suggestions WHERE trip_id = $1 AND participant_id = $2',
      [tripId, participantId]
    );
    const count = countRes.rows[0].c as number;
    if (count >= 3) {
      return new Response('Ya has sugerido el máximo de 3 destinos.', { status: 400 });
    }

    await pool.query(
      `
      INSERT INTO participant_destination_suggestions (trip_id, participant_id, name, country)
      VALUES ($1, $2, $3, $4)
      `,
      [tripId, participantId, name, country || null]
    );

    return new Response(null, {
      status: 303,
      headers: {
        Location: `/join/${encodeURIComponent(shareCode)}`
      }
    });
  } catch (err) {
    console.error('Error guardando sugerencia destino:', err);
    return new Response('Error guardando sugerencia', { status: 500 });
  }
};
