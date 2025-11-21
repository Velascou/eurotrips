// src/lib/flights.ts
import { pool } from './db';

export type Direction = 'outbound' | 'return';

export type FlightDayOptionInput = {
  tripId: number;
  destinationId: number;
  weekendId: number;
  direction: Direction;
  flightDate: string; // 'YYYY-MM-DD'
  optionRank: 1 | 2 | 3;
  pricePerPerson: number;
  currency: string;
  airline?: string;
  carrierCode?: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  bookingUrl?: string;
};

// Guardar/actualizar una opción concreta (1 de las 3 de un día)
export async function saveFlightDayOption(option: FlightDayOptionInput) {
  const {
    tripId,
    destinationId,
    weekendId,
    direction,
    flightDate,
    optionRank,
    pricePerPerson,
    currency,
    airline,
    carrierCode,
    flightNumber,
    departureTime,
    arrivalTime,
    departureAirport,
    arrivalAirport,
    bookingUrl,
  } = option;

  await pool.query(
    `
    INSERT INTO flight_day_options (
      trip_id, destination_id, weekend_id,
      direction, flight_date, option_rank,
      price_per_person, currency,
      airline, carrier_code, flight_number,
      departure_time, arrival_time,
      departure_airport, arrival_airport,
      booking_url, last_updated
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, NOW())
    ON CONFLICT (trip_id, destination_id, weekend_id, direction, flight_date, option_rank)
    DO UPDATE SET
      price_per_person  = EXCLUDED.price_per_person,
      currency          = EXCLUDED.currency,
      airline           = EXCLUDED.airline,
      carrier_code      = EXCLUDED.carrier_code,
      flight_number     = EXCLUDED.flight_number,
      departure_time    = EXCLUDED.departure_time,
      arrival_time      = EXCLUDED.arrival_time,
      departure_airport = EXCLUDED.departure_airport,
      arrival_airport   = EXCLUDED.arrival_airport,
      booking_url       = EXCLUDED.booking_url,
      last_updated      = NOW()
    `,
    [
      tripId,
      destinationId,
      weekendId,
      direction,
      flightDate,
      optionRank,
      pricePerPerson,
      currency,
      airline ?? null,
      carrierCode ?? null,
      flightNumber ?? null,
      departureTime ?? null,
      arrivalTime ?? null,
      departureAirport ?? null,
      arrivalAirport ?? null,
      bookingUrl ?? null,
    ]
  );
}

// Helpers de fechas
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Días posibles de ida: mié, jue, vie, sáb
export function getOutboundDatesForWeekend(weekendStart: Date): string[] {
  return [
    toDateString(addDays(weekendStart, -2)), // miércoles
    toDateString(addDays(weekendStart, -1)), // jueves
    toDateString(weekendStart),             // viernes
    toDateString(addDays(weekendStart, 1)), // sábado
  ];
}

// Días posibles de vuelta: dom, lun, mar, mié
export function getReturnDatesForWeekend(weekendEnd: Date): string[] {
  return [
    toDateString(weekendEnd),               // domingo
    toDateString(addDays(weekendEnd, 1)),   // lunes
    toDateString(addDays(weekendEnd, 2)),   // martes
    toDateString(addDays(weekendEnd, 3)),   // miércoles
  ];
}

// Tipo para lo que devolvería la API de vuelos (adaptarás esto)
export type RawFlightFromApi = {
  price: number;
  currency: string;
  airline?: string;
  carrierCode?: string;
  flightNumber?: string;
  departureTime?: string;   // 'HH:MM'
  arrivalTime?: string;     // 'HH:MM'
  departureAirport?: string;
  arrivalAirport?: string;
  bookingUrl?: string;
};
// For multi-provider support we delegate flight lookups to a provider module.
// The selected provider is determined by `import.meta.env.FLIGHT_PROVIDER` (default: 'amadeus').
// Provider modules must export `fetchTop3FlightsForDate(params)` returning `RawFlightFromApi[]`.

export async function fetchTop3FlightsForDate(
  params: {
    originAirport: string;
    destinationAirport: string;
    date: string; // 'YYYY-MM-DD'
    direction: Direction;
    currency?: string;
  }
): Promise<RawFlightFromApi[]> {
  const providerName = (import.meta.env.FLIGHT_PROVIDER as string) || 'amadeus';

  // Resolve provider dynamically from ./providers/<providerName>.ts
  try {
    // Dynamic import will be resolved by the bundler in dev/build.
    // We expect provider files under `src/lib/providers`.
    const mod = await import(`./providers/${providerName}` as string);
    if (typeof mod.fetchTop3FlightsForDate === 'function') {
      return await mod.fetchTop3FlightsForDate(params);
    }
    console.warn(`Proveedor de vuelos '${providerName}' no exporta fetchTop3FlightsForDate. Provando 'amadeus' fallback.`);
  } catch (err) {
    console.warn(`No se pudo cargar proveedor '${providerName}':`, err);
  }

  // Fallback a Amadeus provider si está disponible
  try {
    const am = await import('./providers/amadeus');
    return await am.fetchTop3FlightsForDate(params);
  } catch (err) {
    console.error('No se pudo cargar el proveedor Amadeus como fallback:', err);
    return [];
  }
}


