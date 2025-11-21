// src/lib/providers/amadeus.ts
// Provider adapter for Amadeus APIs. Exporta `fetchTop3FlightsForDate`.

export type Direction = 'outbound' | 'return';

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
