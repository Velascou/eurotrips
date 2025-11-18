// src/pages/api/participants/delete.ts
import type { APIRoute } from 'astro';
import { pool } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId        = Number(params.get('tripId'));
  const participantId = Number(params.get('participantId'));

  if (!tripId || !participantId || Number.isNaN(tripId) || Number.isNaN(participantId)) {
    return new Response('Datos inválidos', { status: 400 });
  }

  try {
    await pool.query(
      'DELETE FROM participants WHERE id = $1 AND trip_id = $2',
      [participantId, tripId]
    );
  } catch (err) {
    console.error('Error borrando participante:', err);
    return new Response('Error borrando participante', { status: 500 });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/trips/${tripId}`,
    },
  });
};
