// src/pages/api/trips/[tripId]/refresh-flights.ts
import type { APIRoute } from 'astro';
import { pool } from '../../../../lib/db';
import { fetchTop3FlightsForDate } from '../../../../lib/flights';

export const prerender = false;

export const POST: APIRoute = async ({ params }) => {
  const tripId = Number(params.tripId);
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  if (!tripId || Number.isNaN(tripId)) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'ID de viaje inválido' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 1) Cargar datos básicos del viaje (origen + moneda)
  const tripRes = await pool.query(
    'SELECT id, origin_airport_code, currency FROM trips WHERE id = $1',
    [tripId]
  );
  const trip = tripRes.rows[0];

  if (!trip) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Viaje no encontrado' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const originAirport: string | null = trip.origin_airport_code;
  const currency: string = trip.currency || 'EUR';

  // 2) Cargar destinos y findes
  const destRes = await pool.query(
    'SELECT id, airport_code FROM destinations WHERE trip_id = $1',
    [tripId]
  );
  const destinations = destRes.rows as { id: number; airport_code: string | null }[];

  const weekendsRes = await pool.query(
    'SELECT id, start_date, end_date FROM weekends WHERE trip_id = $1 ORDER BY start_date',
    [tripId]
  );
  const weekends = weekendsRes.rows as { id: number; start_date: Date; end_date: Date }[];

  if (!originAirport) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'El viaje no tiene código de aeropuerto de origen (origin_airport_code)',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (destinations.length === 0 || weekends.length === 0) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Necesitas al menos un destino y un fin de semana antes de refrescar los vuelos',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3) Opcional: borrar vuelos antiguos del viaje
  await pool.query('DELETE FROM flight_day_options WHERE trip_id = $1', [tripId]);

  const addDays = (d: Date, days: number) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
  };

  let totalInserted = 0;

  for (const dest of destinations) {
    if (!dest.airport_code) {
      console.warn(
        `Destino ${dest.id} no tiene airport_code, se omite para llamadas a API de vuelos`
      );
      continue;
    }

    for (const w of weekends) {
      const start = new Date(w.start_date);
      const end = new Date(w.end_date);

      // Días de ida: miércoles, jueves, viernes, sábado ( -2, -1, 0, +1 )
      const outboundOffsets = [-2, -1, 0, +1];
      // Días de vuelta: domingo, lunes, martes, miércoles ( 0, +1, +2, +3 )
      const returnOffsets = [0, +1, +2, +3];

      // === Ida ===
      for (const offset of outboundOffsets) {
        const dDate = addDays(start, offset);
        const dateStr = dDate.toISOString().slice(0, 10);

        const flights = await fetchTop3FlightsForDate({
          originAirport,
          destinationAirport: dest.airport_code,
          date: dateStr,
          direction: 'outbound',
          currency,
        });

        await sleep(250); // 0,25s; pequeña pausa

        for (let i = 0; i < flights.length; i++) {
          const f = flights[i];
          const optionRank = i + 1;

          await pool.query(
            `
            INSERT INTO flight_day_options (
              trip_id,
              destination_id,
              weekend_id,
              direction,
              flight_date,
              option_rank,
              price_per_person,
              currency,
              airline,
              carrier_code,
              flight_number,
              departure_time,
              arrival_time,
              departure_airport,
              arrival_airport,
              booking_url
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            ON CONFLICT (trip_id, destination_id, weekend_id, direction, flight_date, option_rank)
            DO UPDATE SET
              price_per_person = EXCLUDED.price_per_person,
              currency = EXCLUDED.currency,
              airline = EXCLUDED.airline,
              carrier_code = EXCLUDED.carrier_code,
              flight_number = EXCLUDED.flight_number,
              departure_time = EXCLUDED.departure_time,
              arrival_time = EXCLUDED.arrival_time,
              departure_airport = EXCLUDED.departure_airport,
              arrival_airport = EXCLUDED.arrival_airport,
              booking_url = EXCLUDED.booking_url
            `,
            [
              tripId,
              dest.id,
              w.id,
              'outbound',
              dateStr,
              optionRank,
              f.price,
              f.currency,
              f.airline,
              f.carrierCode,
              f.flightNumber,
              f.departureTime,
              f.arrivalTime,
              f.departureAirport,
              f.arrivalAirport,
              f.bookingUrl ?? null,
            ]
          );

          totalInserted++;
        }
      }

      // === Vuelta ===
      for (const offset of returnOffsets) {
        const dDate = addDays(end, offset);
        const dateStr = dDate.toISOString().slice(0, 10);

        const flights = await fetchTop3FlightsForDate({
          originAirport: dest.airport_code,
          destinationAirport: originAirport,
          date: dateStr,
          direction: 'return',
          currency,
        });

        await sleep(250);

        for (let i = 0; i < flights.length; i++) {
          const f = flights[i];
          const optionRank = i + 1;

          await pool.query(
            `
            INSERT INTO flight_day_options (
              trip_id,
              destination_id,
              weekend_id,
              direction,
              flight_date,
              option_rank,
              price_per_person,
              currency,
              airline,
              carrier_code,
              flight_number,
              departure_time,
              arrival_time,
              departure_airport,
              arrival_airport,
              booking_url
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            ON CONFLICT (trip_id, destination_id, weekend_id, direction, flight_date, option_rank)
            DO UPDATE SET
              price_per_person = EXCLUDED.price_per_person,
              currency = EXCLUDED.currency,
              airline = EXCLUDED.airline,
              carrier_code = EXCLUDED.carrier_code,
              flight_number = EXCLUDED.flight_number,
              departure_time = EXCLUDED.departure_time,
              arrival_time = EXCLUDED.arrival_time,
              departure_airport = EXCLUDED.departure_airport,
              arrival_airport = EXCLUDED.arrival_airport,
              booking_url = EXCLUDED.booking_url
            `,
            [
              tripId,
              dest.id,
              w.id,
              'return',
              dateStr,
              optionRank,
              f.price,
              f.currency,
              f.airline,
              f.carrierCode,
              f.flightNumber,
              f.departureTime,
              f.arrivalTime,
              f.departureAirport,
              f.arrivalAirport,
              f.bookingUrl ?? null,
            ]
          );

          totalInserted++;
        }
      }
    }
  }

  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Vuelos refrescados correctamente',
      totalInserted,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
