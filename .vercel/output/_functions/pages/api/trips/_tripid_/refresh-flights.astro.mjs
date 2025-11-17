import { p as pool } from '../../../../chunks/db_BnTjIUEm.mjs';
export { renderers } from '../../../../renderers.mjs';

const AMADEUS_BASE_URL = "https://test.api.amadeus.com";
async function getAmadeusAccessToken() {
  const clientId = "LAS9Yo1NiS6MNTHXAZGuoeQGdJuA4p6T";
  const clientSecret = "3S2VxolPpGA9H8fE";
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret
  });
  const resp = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  if (!resp.ok) {
    const txt = await resp.text();
    console.error("Error obteniendo token de Amadeus:", txt);
    return null;
  }
  const json = await resp.json();
  return json.access_token;
}
async function fetchTop3FlightsForDate(params) {
  const { originAirport, destinationAirport, date, currency = "EUR" } = params;
  if (!originAirport || !destinationAirport) {
    console.warn("Origen o destino vacío, no se llama a Amadeus");
    return [];
  }
  const accessToken = await getAmadeusAccessToken();
  if (!accessToken) {
    return [];
  }
  const url = new URL(`${AMADEUS_BASE_URL}/v2/shopping/flight-offers`);
  url.searchParams.set("originLocationCode", originAirport);
  url.searchParams.set("destinationLocationCode", destinationAirport);
  url.searchParams.set("departureDate", date);
  url.searchParams.set("adults", "1");
  url.searchParams.set("currencyCode", currency);
  url.searchParams.set("max", "15");
  url.searchParams.set("nonStop", "true");
  const resp = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!resp.ok) {
    const txt = await resp.text();
    console.error("Error de Amadeus Flight Offers Search:", txt);
    return [];
  }
  const json = await resp.json();
  const offers = json.data ?? [];
  const mapped = offers.map((offer) => {
    const itin = offer.itineraries?.[0];
    const segments = itin?.segments ?? [];
    if (segments.length === 0) return null;
    const firstSeg = segments[0];
    const lastSeg = segments[segments.length - 1];
    const depAt = firstSeg?.departure?.at;
    const arrAt = lastSeg?.arrival?.at;
    const depTime = depAt ? depAt.slice(11, 16) : void 0;
    const arrTime = arrAt ? arrAt.slice(11, 16) : void 0;
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
      bookingUrl: void 0
    };
  }).filter((x) => x !== null);
  mapped.sort((a, b) => a.price - b.price);
  return mapped.slice(0, 3);
}

const prerender = false;
const POST = async ({ params }) => {
  const tripId = Number(params.tripId);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  if (!tripId || Number.isNaN(tripId)) {
    return new Response(
      JSON.stringify({ status: "error", message: "ID de viaje inválido" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  const tripRes = await pool.query(
    "SELECT id, origin_airport_code, currency FROM trips WHERE id = $1",
    [tripId]
  );
  const trip = tripRes.rows[0];
  if (!trip) {
    return new Response(
      JSON.stringify({ status: "error", message: "Viaje no encontrado" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  const originAirport = trip.origin_airport_code;
  const currency = trip.currency || "EUR";
  const destRes = await pool.query(
    "SELECT id, airport_code FROM destinations WHERE trip_id = $1",
    [tripId]
  );
  const destinations = destRes.rows;
  const weekendsRes = await pool.query(
    "SELECT id, start_date, end_date FROM weekends WHERE trip_id = $1 ORDER BY start_date",
    [tripId]
  );
  const weekends = weekendsRes.rows;
  if (!originAirport) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "El viaje no tiene código de aeropuerto de origen (origin_airport_code)"
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (destinations.length === 0 || weekends.length === 0) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Necesitas al menos un destino y un fin de semana antes de refrescar los vuelos"
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  await pool.query("DELETE FROM flight_day_options WHERE trip_id = $1", [tripId]);
  const addDays = (d, days) => {
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
      const outboundOffsets = [-2, -1, 0, 1];
      const returnOffsets = [0, 1, 2, 3];
      for (const offset of outboundOffsets) {
        const dDate = addDays(start, offset);
        const dateStr = dDate.toISOString().slice(0, 10);
        const flights = await fetchTop3FlightsForDate({
          originAirport,
          destinationAirport: dest.airport_code,
          date: dateStr,
          currency
        });
        await sleep(500);
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
              "outbound",
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
              f.bookingUrl ?? null
            ]
          );
          totalInserted++;
        }
      }
      for (const offset of returnOffsets) {
        const dDate = addDays(end, offset);
        const dateStr = dDate.toISOString().slice(0, 10);
        const flights = await fetchTop3FlightsForDate({
          originAirport: dest.airport_code,
          destinationAirport: originAirport,
          date: dateStr,
          currency
        });
        await sleep(500);
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
              "return",
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
              f.bookingUrl ?? null
            ]
          );
          totalInserted++;
        }
      }
    }
  }
  return new Response(
    JSON.stringify({
      status: "ok",
      message: "Vuelos refrescados correctamente",
      totalInserted
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
