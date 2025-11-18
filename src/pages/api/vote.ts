// src/pages/api/vote.ts
import type { APIRoute } from 'astro';
import { pool } from '../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return new Response('Content-Type debe ser application/json', { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    console.error('Error parseando JSON en /api/vote:', err);
    return new Response('JSON inválido', { status: 400 });
  }

  const {
    tripId,
    participantId,
    weekendVotes = [],
    destinationRankings = [],
    suggestions = [],
  } = body;

  if (!tripId || !participantId) {
    return new Response('tripId y participantId son obligatorios', { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1) Fines de semana: disponibilidad + días
    await client.query(
      'DELETE FROM weekend_votes WHERE trip_id = $1 AND participant_id = $2',
      [tripId, participantId]
    );

    for (const wv of weekendVotes) {
      const weekendId = Number(wv.weekendId);
      if (!weekendId) continue;

      const availability =
        wv.availability === 'yes' || wv.availability === 'no' ? wv.availability : 'maybe';

      const outboundDate = wv.outboundDate || null; // 'YYYY-MM-DD' o null
      const returnDate = wv.returnDate || null;     // 'YYYY-MM-DD' o null

      await client.query(
        `
        INSERT INTO weekend_votes
          (trip_id, participant_id, weekend_id, availability, outbound_date, return_date)
        VALUES
          ($1, $2, $3, $4, $5::date, $6::date)
        `,
        [tripId, participantId, weekendId, availability, outboundDate, returnDate]
      );
    }

    // 2) Rankings de destinos
    await client.query(
      'DELETE FROM destination_rankings WHERE trip_id = $1 AND participant_id = $2',
      [tripId, participantId]
    );

    for (const dr of destinationRankings) {
      const destId = Number(dr.destinationId);
      const priority = Number(dr.priority);
      if (!destId || !priority) continue;

      await client.query(
        `
        INSERT INTO destination_rankings
          (trip_id, participant_id, destination_id, priority)
        VALUES
          ($1, $2, $3, $4)
        `,
        [tripId, participantId, destId, priority]
      );
    }

        // 3) Sugerencias de destinos (máx. 3)
    await client.query(
      'DELETE FROM participant_destination_suggestions WHERE trip_id = $1 AND participant_id = $2',
      [tripId, participantId]
    );

    // Mapear por nombre para quedarnos con máximo 1 registro por ciudad
    const byName = new Map<
      string,
      { country: string | null; priority: number | null }
    >();

    let autoPriorityCounter = 1;

    for (const s of suggestions) {
      const rawName = (s.name || '').trim();
      if (!rawName) continue;

      const name = rawName;
      const country = s.country ? String(s.country).trim() : null;

      let finalPriority: number | null = null;

      if (s.priority != null && s.priority !== '') {
        const p = Number(s.priority);
        if (p >= 1 && p <= 3) {
          finalPriority = p;
        }
      }

      if (finalPriority == null) {
        // prioridad automática 1, 2, 3 por orden de entrada
        finalPriority = autoPriorityCounter;
        autoPriorityCounter += 1;
      }

      if (finalPriority > 3) finalPriority = 3;

      // Si la ciudad ya existía en el formulario, nos quedamos con la última versión
      byName.set(name, { country, priority: finalPriority });
    }

    // Nos quedamos con máximo 3 ciudades distintas
    const uniqueSuggestions = Array.from(byName.entries()).slice(0, 3);

    for (const [name, info] of uniqueSuggestions) {
      await client.query(
        `
        INSERT INTO participant_destination_suggestions
          (trip_id, participant_id, name, country, priority)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [tripId, participantId, name, info.country, info.priority]
      );
    }


    await client.query('COMMIT');

    return new Response(
      JSON.stringify({ status: 'ok' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error guardando votación completa:', err);
    return new Response('Error guardando votación completa', { status: 500 });
  } finally {
    client.release();
  }
};
