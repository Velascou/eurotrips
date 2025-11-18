// src/pages/api/auth/register.ts
import type { APIRoute } from 'astro';
import { pool } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const contentType = request.headers.get('content-type') || '';

  let tripIdRaw: any;
  let participantIdRaw: any;
  let password: string = '';
  let shareCode: string = '';

  try {
    if (contentType.includes('application/json')) {
      const body = await request.json();
      tripIdRaw = body.tripId;
      participantIdRaw = body.participantId;
      password = String(body.password ?? '');
      shareCode = String(body.shareCode ?? '');
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      tripIdRaw = params.get('tripId');
      participantIdRaw = params.get('participantId');
      password = String(params.get('password') ?? '');
      shareCode = String(params.get('shareCode') ?? '');
    }
  } catch (err) {
    console.error('Error leyendo body en /api/auth/register', err);
    return new Response('Body inválido', { status: 400 });
  }

  const tripId = Number(tripIdRaw);
  const participantId = Number(participantIdRaw);

  if (!tripId || Number.isNaN(tripId) || !participantId || Number.isNaN(participantId)) {
    return new Response('tripId o participantId inválidos', { status: 400 });
  }

  if (!password || password.length < 4) {
    return new Response('La contraseña es obligatoria (mínimo 4 caracteres).', { status: 400 });
  }

  // 1) Validar que el participante pertenece al viaje
  const partRes = await pool.query(
    'SELECT id FROM participants WHERE id = $1 AND trip_id = $2',
    [participantId, tripId]
  );
  if (partRes.rowCount === 0) {
    return new Response('Participante o viaje no válido.', { status: 400 });
  }

  // 2) Mirar si ya tiene credenciales -> login, si no -> registro
  const credRes = await pool.query(
    `
      SELECT password_hash
      FROM participant_credentials
      WHERE trip_id = $1 AND participant_id = $2
    `,
    [tripId, participantId]
  );

  if ((credRes.rowCount ?? 0) > 0) {
    // ------------ LOGIN ------------
    const { password_hash } = credRes.rows[0];
    const ok = await bcrypt.compare(password, password_hash);

    if (!ok) {
      // Contraseña incorrecta -> NO se entra y NO se cambia la contraseña
      return new Response('Contraseña incorrecta para este viajero.', { status: 401 });
    }
  } else {
    // ------------ REGISTRO INICIAL ------------
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `
        INSERT INTO participant_credentials (trip_id, participant_id, password_hash)
        VALUES ($1, $2, $3)
      `,
      [tripId, participantId, hash]
    );
  }

  // 3) Crear sesión
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 días

  await pool.query(
    `
      INSERT INTO participant_sessions (trip_id, participant_id, session_token, created_at, expires_at)
      VALUES ($1, $2, $3, now(), $4)
    `,
    [tripId, participantId, token, expiresAt]
  );

  // Cookie de sesión
  cookies.set('eurotrip_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: true,
    expires: expiresAt,
  });

  const target = shareCode ? `/join/${shareCode}` : '/';
  return new Response(null, {
    status: 303,
    headers: { Location: target },
  });
};
