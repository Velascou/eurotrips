// src/pages/api/destination-rankings.ts
import type { APIRoute } from 'astro';
import { pool } from '../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId        = Number(params.get('tripId'));
  const participantId = Number(params.get('participantId'));
  const destinationId = Number(params.get('destinationId'));
  const priority      = Number(params.get('priority'));
  const shareCode     = (params.get('shareCode') ?? '').trim();

  if (
    !tripId || Number.isNaN(tripId) ||
    !participantId || Number.isNaN(participantId) ||
    !destinationId || Number.isNaN(destinationId) ||
    !priority || Number.isNaN(priority) ||
    !shareCode
  ) {
    return new Response('Datos inválidos', { status: 400 });
  }

  try {
    await pool.query(
      `
      INSERT INTO destination_rankings (trip_id, participant_id, destination_id, priority)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (trip_id, participant_id, destination_id)
      DO UPDATE SET
        priority   = EXCLUDED.priority,
        updated_at = now()
      `,
      [tripId, participantId, destinationId, priority]
    );

    return new Response(null, {
      status: 303,
      headers: {
        Location: `/join/${encodeURIComponent(shareCode)}?participantId=${participantId}`,
      },
    });
  } catch (err) {
    console.error('Error guardando destination_rankings:', err);
    return new Response('Error guardando prioridad', { status: 500 });
  }
};
