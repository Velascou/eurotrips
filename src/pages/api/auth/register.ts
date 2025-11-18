// src/pages/api/auth/register.ts
import type { APIRoute } from 'astro';
import { pool } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export const prerender = false;

const SESSION_TTL_HOURS = 24 * 14; // 14 días

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId        = Number(params.get('tripId'));
  const participantId = Number(params.get('participantId'));
  const password      = (params.get('password') ?? '').trim();
  const shareCode     = (params.get('shareCode') ?? '').trim();

  if (!tripId || !participantId || !password || !shareCode) {
    return new Response('Datos inválidos', { status: 400 });
  }

  try {
    // comprobar que el participante existe y pertenece al viaje
    const res = await pool.query(
      'SELECT id FROM participants WHERE id = $1 AND trip_id = $2',
      [participantId, tripId]
    );
    if (res.rowCount === 0) {
      return new Response('Participante no válido', { status: 400 });
    }

    // hashear contraseña
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE participants SET password_hash = $1 WHERE id = $2',
      [hash, participantId]
    );

    // crear sesión
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

    await pool.query(
      `
      INSERT INTO participant_sessions (trip_id, participant_id, session_token, expires_at)
      VALUES ($1, $2, $3, $4)
      `,
      [tripId, participantId, token, expires.toISOString()]
    );

    const cookie = [
      `eurotrip_session=${token}`,
      `Path=/`,
      `HttpOnly`,
      `Secure`,
      `SameSite=Lax`,
      `Max-Age=${SESSION_TTL_HOURS * 60 * 60}`
    ].join('; ');

    return new Response(null, {
      status: 303,
      headers: {
        'Location': `/join/${encodeURIComponent(shareCode)}`,
        'Set-Cookie': cookie
      }
    });
  } catch (err) {
    console.error('Error en registro participante:', err);
    return new Response('Error en registro', { status: 500 });
  }
};
