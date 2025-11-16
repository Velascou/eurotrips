// src/pages/api/trips.ts
import type { APIRoute } from 'astro';
import { pool } from '../../lib/db';
import { guessAirportCodeFromCity } from '../../lib/airports';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') || '';

  let name = '';
  let originCity = '';
  let originAirportCode = '';
  let currency = 'EUR';

  try {
    if (contentType.includes('application/json')) {
      // Body en JSON (por si algún día llamas a /api/trips con fetch)
      const body = await request.json();
      name = String(body.name ?? '').trim();
      originCity = String(body.originCity ?? '').trim();
      originAirportCode = String(body.originAirportCode ?? '').trim().toUpperCase();
      currency = String(body.currency ?? 'EUR').trim();
    } else {
      // Formularios clásicos (application/x-www-form-urlencoded)
      const bodyText = await request.text();
      const params = new URLSearchParams(bodyText);

      name = (params.get('name') ?? '').trim();
      originCity = (params.get('originCity') ?? '').trim();
      originAirportCode = (params.get('originAirportCode') ?? '').trim().toUpperCase();
      currency = (params.get('currency') ?? 'EUR').trim();
    }
  } catch (err) {
    console.error('Error leyendo el body:', err);
    return new Response('No se pudo leer el formulario.', { status: 400 });
  }

  if (!name || !originCity) {
    return new Response('Nombre y ciudad son obligatorios', { status: 400 });
  }

  // Si no te han pasado código de aeropuerto, lo intentamos deducir del JSON
  if (!originAirportCode) {
    const guessed = guessAirportCodeFromCity(originCity);
    if (guessed) {
      originAirportCode = guessed.toUpperCase();
    }
  }

  try {
    await pool.query(
      `
      INSERT INTO trips (name, origin_city, origin_airport_code, currency)
      VALUES ($1, $2, $3, $4)
      `,
      [name, originCity, originAirportCode || null, currency]
    );
  } catch (err) {
    console.error('Error insertando en la BD:', err);
    return new Response('Error guardando el viaje en la base de datos.', { status: 500 });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: '/trips',
    },
  });
};
