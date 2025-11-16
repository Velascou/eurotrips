// src/pages/api/trips/delete.ts
import type { APIRoute } from 'astro';
import { pool } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId = Number(params.get('tripId'));

  if (!tripId || Number.isNaN(tripId)) {
    return new Response('ID de viaje inválido', { status: 400 });
  }

  try {
    // Borramos en orden para evitar problemas de FK si no tienes ON DELETE CASCADE
    await pool.query('DELETE FROM flight_day_options WHERE trip_id = $1', [tripId]);
    await pool.query('DELETE FROM weekends WHERE trip_id = $1', [tripId]);
    await pool.query('DELETE FROM destinations WHERE trip_id = $1', [tripId]);

    // Aquí podrías borrar también votes/participants cuando los tengamos

    await pool.query('DELETE FROM trips WHERE id = $1', [tripId]);
  } catch (err) {
    console.error('Error borrando viaje:', err);
    return new Response('Error borrando el viaje.', { status: 500 });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: '/trips',
    },
  });
};
