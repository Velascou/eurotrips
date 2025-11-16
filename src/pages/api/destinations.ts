// src/pages/api/destinations.ts
import type { APIRoute } from 'astro';
import { pool } from '../../lib/db';
import { guessAirportCodeFromCity } from '../../lib/airports';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId = Number(params.get('tripId'));
  const name = (params.get('name') ?? '').trim();
  const country = (params.get('country') ?? '').trim();
  let airportCode = (params.get('airportCode') ?? '').trim().toUpperCase();

  if (!tripId || Number.isNaN(tripId) || !name) {
    return new Response('Datos inválidos', { status: 400 });
  }

  if (!airportCode) {
    const guessed = guessAirportCodeFromCity(name);
    if (guessed) {
      airportCode = guessed;
    }
  }

  await pool.query(
    `
    INSERT INTO destinations (trip_id, name, country, airport_code)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (trip_id, name)
    DO UPDATE SET
      country = COALESCE(NULLIF(EXCLUDED.country, ''), destinations.country),
      airport_code = COALESCE(NULLIF(EXCLUDED.airport_code, ''), destinations.airport_code)
    `,
    [tripId, name, country || null, airportCode || null]
  );

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/trips/${tripId}`,
    },
  });
};
