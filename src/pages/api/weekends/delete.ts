// src/pages/api/weekends/delete.ts
import type { APIRoute } from 'astro';
import { pool } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId = Number(params.get('tripId'));
  const weekendId = Number(params.get('weekendId'));

  if (!tripId || Number.isNaN(tripId) || !weekendId || Number.isNaN(weekendId)) {
    return new Response('Datos inválidos', { status: 400 });
  }

  try {
    // 1) Borrar vuelos ligados a ese finde
    await pool.query(
      'DELETE FROM flight_day_options WHERE trip_id = $1 AND weekend_id = $2',
      [tripId, weekendId]
    );

    // 2) Borrar el propio finde
    await pool.query(
      'DELETE FROM weekends WHERE id = $1 AND trip_id = $2',
      [weekendId, tripId]
    );
  } catch (err) {
    console.error('Error borrando fin de semana:', err);
    return new Response('Error borrando el fin de semana.', { status: 500 });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/trips/${tripId}`,
    },
  });
};
