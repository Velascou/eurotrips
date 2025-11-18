// src/pages/api/vote.ts
import type { APIRoute } from 'astro';
import { pool } from '../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  const tripId     = Number(params.get('tripId'));
  const participantId = Number(params.get('participantId'));
  const shareCode  = (params.get('shareCode') ?? '').trim();

  if (!tripId || !participantId || !shareCode || Number.isNaN(tripId) || Number.isNaN(participantId)) {
    return new Response('Datos inválidos', { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Cargar findes y destinos de este viaje
    const weekendsRes = await client.query(
      'SELECT id FROM weekends WHERE trip_id = $1 ORDER BY start_date',
      [tripId]
    );
    const weekends = weekendsRes.rows as { id: number }[];

    const destRes = await client.query(
      'SELECT id FROM destinations WHERE trip_id = $1 ORDER BY name',
      [tripId]
    );
    const destinations = destRes.rows as { id: number }[];

    // 2) Guardar votos de findes
    // Esperamos campos:
    //  availability_<weekendId>  (yes/maybe/no)
    //  outboundDate_<weekendId>  (YYYY-MM-DD o vacío)
    //  returnDate_<weekendId>    (YYYY-MM-DD o vacío)
    for (const w of weekends) {
      const avail = (params.get(`availability_${w.id}`) ?? '').trim();
      const outboundDate = (params.get(`outboundDate_${w.id}`) ?? '').trim();
      const returnDate   = (params.get(`returnDate_${w.id}`) ?? '').trim();

      // Si no hay nada para este finde, ignoramos
      if (!avail && !outboundDate && !returnDate) continue;

      const availability =
        avail === 'yes' || avail === 'no' || avail === 'maybe'
          ? avail
          : 'maybe';

      await client.query(
        `
        INSERT INTO weekend_votes (trip_id, weekend_id, participant_id, availability, outbound_date, return_date)
        VALUES ($1, $2, $3, $4, NULLIF($5, ''), NULLIF($6, ''))
        ON CONFLICT (trip_id, weekend_id, participant_id)
        DO UPDATE SET
          availability  = EXCLUDED.availability,
          outbound_date = EXCLUDED.outbound_date,
          return_date   = EXCLUDED.return_date,
          created_at    = now()
        `,
        [tripId, w.id, participantId, availability, outboundDate, returnDate]
      );
    }

    // 3) Guardar ranking de destinos existentes
    // Campos: destPriority_<destinationId> = "", "1", "2", ..., "N"
    for (const d of destinations) {
      const pStr = (params.get(`destPriority_${d.id}`) ?? '').trim();
      if (!pStr) {
        // si quieres, aquí podríamos borrar ranking existente si el usuario deja en blanco
        continue;
      }
      const priority = Number(pStr);
      if (!Number.isFinite(priority) || priority <= 0) continue;

      await client.query(
        `
        INSERT INTO destination_rankings (trip_id, participant_id, destination_id, priority)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (trip_id, participant_id, destination_id)
        DO UPDATE SET priority = EXCLUDED.priority, created_at = now()
        `,
        [tripId, participantId, d.id, priority]
      );
    }

    // 4) Guardar sugerencias (máx. 3)
    // Usamos 3 "slots" en el formulario:
    //  sugName_1, sugCountry_1, sugPriority_1
    //  sugName_2, ...
    //  sugName_3, ...
    type SuggestRow = {
      name: string;
      country: string | null;
      priority: number | null;
    };

    const rawSuggestions: SuggestRow[] = [];

    for (let i = 1; i <= 3; i++) {
      const name = (params.get(`sugName_${i}`) ?? '').trim();
      const country = (params.get(`sugCountry_${i}`) ?? '').trim();
      const pStr = (params.get(`sugPriority_${i}`) ?? '').trim();

      if (!name) continue; // fila vacía

      let priority: number | null = null;
      const n = Number(pStr);
      if (Number.isFinite(n) && n >= 1 && n <= 3) {
        priority = n;
      }

      rawSuggestions.push({
        name,
        country: country || null,
        priority,
      });
    }

    // Normalizar prioridades:
    // - Máx. 3 sugerencias
    // - Si no se asignan, se reparten por orden de entrada
    const used = new Set<number>();
    // Primero, respetar prioridades válidas y únicas
    for (const s of rawSuggestions) {
      if (s.priority && !used.has(s.priority)) {
        used.add(s.priority);
      } else {
        s.priority = null;
      }
    }

    const allPri = [1, 2, 3];
    let idx = 0;
    for (const s of rawSuggestions) {
      if (s.priority) continue;
      while (idx < allPri.length && used.has(allPri[idx])) idx++;
      if (idx < allPri.length) {
        s.priority = allPri[idx];
        used.add(allPri[idx]);
        idx++;
      } else {
        s.priority = null; // sin hueco, en práctica no debería pasar con 3 sugerencias máx.
      }
    }

    // Borramos las sugerencias anteriores de este participante y grabamos las nuevas
    await client.query(
      'DELETE FROM participant_destination_suggestions WHERE trip_id = $1 AND participant_id = $2',
      [tripId, participantId]
    );

    for (const s of rawSuggestions) {
      await client.query(
        `
        INSERT INTO participant_destination_suggestions (trip_id, participant_id, name, country, priority)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [tripId, participantId, s.name, s.country, s.priority]
      );
    }

    await client.query('COMMIT');

    return new Response(null, {
      status: 303,
      headers: {
        Location: `/join/${encodeURIComponent(shareCode)}/results`,
      },
    });
  } catch (err) {
    console.error('Error guardando votación completa:', err);
    await client.query('ROLLBACK');
    return new Response('Error guardando tu votación', { status: 500 });
  } finally {
    client.release();
  }
};
