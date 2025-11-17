// src/pages/api/votes.ts
import type { APIRoute } from 'astro';
import { pool } from '../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId = Number(params.get('tripId'));
  const participantId = Number(params.get('participantId'));
  const destinationId = Number(params.get('destinationId'));
  const weekendId = Number(params.get('weekendId'));
  const shareCode = (params.get('shareCode') ?? '').trim();

  if (
    !tripId ||
    Number.isNaN(tripId) ||
    !participantId ||
    Number.isNaN(participantId) ||
    !destinationId ||
    Number.isNaN(destinationId) ||
    !weekendId ||
    Number.isNaN(weekendId) ||
    !shareCode
  ) {
    return new Response('Datos inválidos para votar', { status: 400 });
  }

  try {
    await pool.query(
      `
      INSERT INTO votes (trip_id, participant_id, destination_id, weekend_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (trip_id, participant_id)
      DO UPDATE
      SET destination_id = EXCLUDED.destination_id,
          weekend_id = EXCLUDED.weekend_id,
          created_at = now()
      `,
      [tripId, participantId, destinationId, weekendId]
    );
  } catch (err) {
    console.error('Error guardando voto:', err);
    return new Response('Error guardando voto.', { status: 500 });
  }

  const redirectUrl = `/join/${encodeURIComponent(
    shareCode
  )}?participantId=${participantId}`;

  return new Response(null, {
    status: 303,
    headers: {
      Location: redirectUrl,
    },
  });
};
