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

const AMADEUS_BASE_URL =
  import.meta.env.AMADEUS_ENV === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com';

async function getAmadeusAccessToken(): Promise<string | null> {
  const clientId = import.meta.env.AMADEUS_CLIENT_ID as string | undefined;
  const clientSecret = import.meta.env.AMADEUS_CLIENT_SECRET as string | undefined;

  if (!clientId || !clientSecret) {
    console.warn(
      '[Amadeus] Faltan AMADEUS_CLIENT_ID o AMADEUS_CLIENT_SECRET en las variables de entorno. ' +
      'No se llamará a la API y se devolverán 0 vuelos.'
    );
    return null;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const resp = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error('Error obteniendo token de Amadeus:', txt);
    return null;
  }

  const json = (await resp.json()) as { access_token: string };
  return json.access_token;
}

export async function fetchTop3FlightsForDate(
  params: {
    originAirport: string;
    destinationAirport: string;
    date: string; // 'YYYY-MM-DD'
    direction: Direction;
    currency?: string;
  }
): Promise<RawFlightFromApi[]> {
  const { originAirport, destinationAirport, date, currency = 'EUR' } = params;

  if (!originAirport || !destinationAirport) {
    console.warn('Origen o destino vacío, no se llama a Amadeus');
    return [];
  }

  const accessToken = await getAmadeusAccessToken();
  if (!accessToken) {
    // Ya se ha logueado el motivo en getAmadeusAccessToken
    return [];
  }

  const url = new URL(`${AMADEUS_BASE_URL}/v2/shopping/flight-offers`);
  url.searchParams.set('originLocationCode', originAirport);
  url.searchParams.set('destinationLocationCode', destinationAirport);
  url.searchParams.set('departureDate', date);
  url.searchParams.set('adults', '1');
  url.searchParams.set('currencyCode', currency);
  url.searchParams.set('max', '15');      // pedimos unas cuantas
  url.searchParams.set('nonStop', 'true'); // SOLO VUELOS SIN ESCALAS

  const resp = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error('Error de Amadeus Flight Offers Search:', txt);
    return [];
  }

  const json = await resp.json() as any;
  const offers: any[] = json.data ?? [];

  const mapped: RawFlightFromApi[] = offers
    .map((offer) => {
      const itin = offer.itineraries?.[0];
      const segments = itin?.segments ?? [];
      if (segments.length === 0) return null;

      const firstSeg = segments[0];
      const lastSeg = segments[segments.length - 1];

      const depAt: string | undefined = firstSeg?.departure?.at;
      const arrAt: string | undefined = lastSeg?.arrival?.at;

      const depTime = depAt ? depAt.slice(11, 16) : undefined; // HH:MM
      const arrTime = arrAt ? arrAt.slice(11, 16) : undefined;

      const totalPrice = Number(offer.price?.total ?? 0);
      const curr = offer.price?.currency ?? currency;
      const carrier = firstSeg?.carrierCode;

      if (!totalPrice || Number.isNaN(totalPrice)) return null;

      return {
        price: totalPrice,
        currency: curr,
        airline: carrier,
        carrierCode: carrier,
        flightNumber: firstSeg?.number,
        departureTime: depTime,
        arrivalTime: arrTime,
        departureAirport: firstSeg?.departure?.iataCode,
        arrivalAirport: lastSeg?.arrival?.iataCode,
        bookingUrl: undefined,
      } as RawFlightFromApi;
    })
    .filter((x): x is RawFlightFromApi => x !== null);

  mapped.sort((a, b) => a.price - b.price);
  return mapped.slice(0, 3);
}


