// src/pages/api/weekends.ts
import type { APIRoute } from 'astro';
import { pool } from '../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') || '';

  let tripIdRaw = '';
  let startRaw = '';
  let endRaw = '';

  // 1) Leer body (JSON o form)
  try {
    if (contentType.includes('application/json')) {
      const body = await request.json();

      tripIdRaw = String(body.tripId ?? body.trip_id ?? '').trim();
      startRaw = String(body.startDate ?? body.start ?? '').trim();
      endRaw = String(body.endDate ?? body.end ?? '').trim();
    } else {
      const bodyText = await request.text();
      const params = new URLSearchParams(bodyText);

      tripIdRaw = (params.get('tripId') ?? params.get('trip_id') ?? '').trim();
      startRaw = (params.get('startDate') ?? params.get('start') ?? '').trim();
      endRaw = (params.get('endDate') ?? params.get('end') ?? '').trim();
    }
  } catch (err) {
    console.error('Error leyendo body de /api/weekends:', err);
    return jsonError('Body inválido', 400);
  }

  // 2) Validar datos
  const tripId = Number(tripIdRaw);
  if (!tripId || Number.isNaN(tripId) || !startRaw || !endRaw) {
    console.warn('Datos inválidos /api/weekends:', {
      tripIdRaw,
      startRaw,
      endRaw,
    });
    return jsonError('Datos inválidos', 400);
  }

  // Fechas: dejamos que Postgres las interprete, pero comprobamos que no sean obviously malas
  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    console.warn('Fechas inválidas /api/weekends:', { startRaw, endRaw });
    return jsonError('Fechas inválidas', 400);
  }

  // 3) Insertar (evitando duplicados por el UNIQUE)
  try {
    const result = await pool.query(
      `
      INSERT INTO weekends (trip_id, start_date, end_date)
      VALUES ($1, $2, $3)
      ON CONFLICT (trip_id, start_date, end_date) DO NOTHING
      RETURNING id, trip_id, start_date, end_date, created_at
      `,
      [tripId, startRaw, endRaw]
    );

    const weekend = result.rows[0] ?? null;

    // Si la llamada venía en JSON, devolvemos JSON (lo usan los botones "sugeridos")
    if (contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ ok: true, weekend }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Si venía de un formulario normal, redirigimos de vuelta a la página del viaje
    return new Response(null, {
      status: 303,
      headers: {
        Location: `/trips/${tripId}`,
      },
    });
  } catch (err) {
    console.error('Error insertando weekend en BD:', err);
    return jsonError('Error guardando el fin de semana en la base de datos.', 500);
  }
};

// Helper para respuestas de error JSON
function jsonError(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ ok: false, error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
