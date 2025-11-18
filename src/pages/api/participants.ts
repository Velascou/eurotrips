// src/pages/api/participants.ts
import type { APIRoute } from 'astro';
import { pool } from '../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId      = Number(params.get('tripId'));
  const displayName = (params.get('displayName') ?? '').trim();
  const email       = (params.get('email') ?? '').trim();

  if (!tripId || Number.isNaN(tripId) || !displayName) {
    return new Response('Datos inválidos', { status: 400 });
  }

  try {
    await pool.query(
      `
      INSERT INTO participants (trip_id, display_name, email)
      VALUES ($1, $2, $3)
      `,
      [tripId, displayName, email || null]
    );
  } catch (err) {
    console.error('Error creando participante:', err);
    return new Response('Error creando participante', { status: 500 });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/trips/${tripId}`,
    },
  });
};
