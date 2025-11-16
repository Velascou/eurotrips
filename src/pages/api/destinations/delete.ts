// src/pages/api/destinations/delete.ts
import type { APIRoute } from 'astro';
import { pool } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId = Number(params.get('tripId'));
  const destinationId = Number(params.get('destinationId'));

  if (!tripId || Number.isNaN(tripId) || !destinationId || Number.isNaN(destinationId)) {
    return new Response('Datos inválidos', { status: 400 });
  }

  try {
    // Primero borramos vuelos ligados a ese destino en este viaje
    await pool.query(
      'DELETE FROM flight_day_options WHERE trip_id = $1 AND destination_id = $2',
      [tripId, destinationId]
    );

    // Aquí en el futuro podrías borrar votos u otras tablas relacionadas

    // Finalmente borramos el destino
    await pool.query(
      'DELETE FROM destinations WHERE id = $1 AND trip_id = $2',
      [destinationId, tripId]
    );
  } catch (err) {
    console.error('Error borrando destino:', err);
    return new Response('Error borrando el destino.', { status: 500 });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/trips/${tripId}`,
    },
  });
};
