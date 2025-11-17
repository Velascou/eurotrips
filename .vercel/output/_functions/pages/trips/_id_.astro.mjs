import { e as createComponent, f as createAstro, k as renderHead, h as addAttribute, l as renderComponent, n as Fragment, r as renderTemplate } from '../../chunks/astro/server_BcdbuJgD.mjs';
import { p as pool } from '../../chunks/db_BnTjIUEm.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const idParam = Astro2.params.id;
  const tripId = Number(idParam);
  if (!tripId || Number.isNaN(tripId)) {
    throw new Error("ID de viaje inv\xE1lido");
  }
  const tripRes = await pool.query(
    "SELECT id, name, origin_city, origin_airport_code, currency, share_code, created_at FROM trips WHERE id = $1",
    [tripId]
  );
  const trip = tripRes.rows[0];
  if (!trip) {
    throw new Error("Viaje no encontrado");
  }
  const destRes = await pool.query(
    "SELECT id, name, country, airport_code FROM destinations WHERE trip_id = $1 ORDER BY name",
    [tripId]
  );
  const destinations = destRes.rows;
  const weekendsRes = await pool.query(
    "SELECT id, start_date, end_date FROM weekends WHERE trip_id = $1 ORDER BY start_date",
    [tripId]
  );
  const weekends = weekendsRes.rows;
  const flightsRes = await pool.query(
    `SELECT
     id,
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
   FROM flight_day_options
   WHERE trip_id = $1
   ORDER BY destination_id, weekend_id, direction, flight_date, option_rank`,
    [tripId]
  );
  const flights = flightsRes.rows;
  const groupedFlights = /* @__PURE__ */ new Map();
  for (const f of flights) {
    const key = `${f.destination_id}|${f.weekend_id}|${f.direction}|${f.flight_date.toISOString().slice(0, 10)}`;
    if (!groupedFlights.has(key)) {
      groupedFlights.set(key, []);
    }
    groupedFlights.get(key).push(f);
  }
  function getFlightsFor(destId, weekendId, direction, dateStr) {
    const key = `${destId}|${weekendId}|${direction}|${dateStr}`;
    return groupedFlights.get(key) ?? [];
  }
  function formatDate(d) {
    return d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" });
  }
  function toYMD(d) {
    return d.toISOString().slice(0, 10);
  }
  function addDays(d, days) {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
  }
  function getNextFriday(from = /* @__PURE__ */ new Date()) {
    const d = new Date(from);
    const day = d.getDay();
    const diff = (5 - day + 7) % 7;
    return addDays(d, diff === 0 ? 7 : diff);
  }
  const existingStarts = new Set(
    weekends.map(
      (w) => w.start_date instanceof Date ? toYMD(w.start_date) : String(w.start_date).slice(0, 10)
    )
  );
  function formatTimeEs(t) {
    if (!t) return "";
    const s = String(t);
    return s.slice(0, 5);
  }
  const suggestedWeekends = (() => {
    const list = [];
    let currentFriday = getNextFriday();
    const count = 24;
    for (let i = 0; i < count; i++) {
      const start = currentFriday;
      const end = addDays(start, 2);
      const startStr = toYMD(start);
      const endStr = toYMD(end);
      if (!existingStarts.has(startStr)) {
        list.push({ start: startStr, end: endStr });
      }
      currentFriday = addDays(currentFriday, 7);
    }
    return list;
  })();
  return renderTemplate`<html lang="es"> <head><meta charset="utf-8"><title>Viaje: ${trip.name}</title>${renderHead()}</head> <body style="font-family: system-ui; max-width: 1000px; margin: 2rem auto; line-height: 1.5;"> <a href="/trips" style="text-decoration:none;">⬅ Volver a la lista</a> <h1 style="margin-top: 1rem;">${trip.name}</h1> <p>
Origen:
<strong> ${trip.origin_city} ${trip.origin_airport_code && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` (${trip.origin_airport_code})` })}`} </strong> <br>
Moneda: <strong>${trip.currency}</strong> <br>
Creado: ${new Date(trip.created_at).toLocaleString("es-ES")} <br>
Enlace para compartir con tus amigos:<br> <code>/join/${trip.share_code}</code> </p> <!-- Sección: añadir destinos --> <section style="margin-top: 2rem;"> <h2>Destinos</h2> ${destinations.length === 0 ? renderTemplate`<p>Aún no hay destinos para este viaje.</p>` : renderTemplate`<ul> ${destinations.map((d) => renderTemplate`<li${addAttribute(d.id, "key")}> <strong>${d.name}</strong> ${d.country && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` – ${d.country}` })}`} ${d.airport_code && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` (${d.airport_code})` })}`}  <form method="POST" action="/api/destinations/delete" style="display:inline; margin-left:0.5rem;"> <input type="hidden" name="tripId"${addAttribute(trip.id, "value")}> <input type="hidden" name="destinationId"${addAttribute(d.id, "value")}> <button type="submit" style="border:none; background:none; color:#c00; cursor:pointer; font-size:0.85rem;">
eliminar
</button> </form> </li>`)} </ul>`} <h3>Añadir destino</h3> <form method="POST" action="/api/destinations" style="display:grid; gap:0.5rem; max-width:400px;"> <input type="hidden" name="tripId"${addAttribute(trip.id, "value")}> <label>
Nombre de la ciudad<br> <input name="name" required style="width:100%; padding:0.3rem;"> </label> <label>
País<br> <input name="country" style="width:100%; padding:0.3rem;"> </label> <label>
Código de aeropuerto (IATA, ej: FCO, BUD) – opcional<br> <input name="airportCode" style="width:100%; padding:0.3rem;"> </label> <button type="submit" style="margin-top:0.5rem; padding:0.4rem 0.8rem;">
Guardar destino
</button> </form> </section> <!-- Sección: fines de semana --> <section style="margin-top: 2rem;"> <h2>Fines de semana</h2> ${weekends.length === 0 ? renderTemplate`<p>Aún no hay fines de semana definidos.</p>` : renderTemplate`<ul> ${weekends.map((w) => renderTemplate`<li${addAttribute(w.id, "key")}> <strong>${formatDate(w.start_date)} - ${formatDate(w.end_date)}</strong> <!-- Botón eliminar finde --> <form method="POST" action="/api/weekends/delete" style="display:inline; margin-left:0.5rem;"> <input type="hidden" name="tripId"${addAttribute(trip.id, "value")}> <input type="hidden" name="weekendId"${addAttribute(w.id, "value")}> <button type="submit" style="border:none; background:none; color:#c00; cursor:pointer; font-size:0.85rem;">
eliminar
</button> </form> </li>`)} </ul>`} <h3>Sugerencias rápidas (próximos findes)</h3> <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;"> ${suggestedWeekends.map((sw) => renderTemplate`<form method="POST" action="/api/weekends" style="margin:0;"> <input type="hidden" name="tripId"${addAttribute(trip.id, "value")}> <input type="hidden" name="startDate"${addAttribute(sw.start, "value")}> <input type="hidden" name="endDate"${addAttribute(sw.end, "value")}> <button type="submit" style="padding:0.3rem 0.6rem; border-radius:999px; border:1px solid #ccc; background:#f9f9f9; cursor:pointer;"> ${formatDate(new Date(sw.start))} – ${formatDate(new Date(sw.end))} </button> </form>`)} </div> <h3>Añadir fin de semana manualmente</h3> <form method="POST" action="/api/weekends" style="display:grid; gap:0.5rem; max-width:400px;"> <input type="hidden" name="tripId"${addAttribute(trip.id, "value")}> <label>
Fecha de inicio (viernes)<br> <input type="date" name="startDate" required style="width:100%; padding:0.3rem;"> </label> <label>
Fecha de fin (domingo)<br> <input type="date" name="endDate" required style="width:100%; padding:0.3rem;"> </label> <button type="submit" style="margin-top:0.5rem; padding:0.4rem 0.8rem;">
Guardar fin de semana
</button> </form> </section> <!-- Botón para refrescar vuelos --> <section style="margin-top: 2rem;"> <h2>Vuelos</h2> <form method="POST"${addAttribute(`/api/trips/${trip.id}/refresh-flights`, "action")}> <button type="submit" style="padding:0.5rem 1rem;">
Actualizar vuelos (API)
</button> </form> ${destinations.length === 0 || weekends.length === 0 ? renderTemplate`<p style="margin-top:1rem;">
Añade al menos un destino y un fin de semana para ver opciones de vuelo.
</p>` : flights.length === 0 ? renderTemplate`<p style="margin-top:1rem;">
Aún no hay datos de vuelos guardados. Pulsa en "Actualizar vuelos" cuando tengas la API configurada.
</p>` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate`${destinations.map((d) => renderTemplate`<div${addAttribute(d.id, "key")} style="margin-top:1.5rem; padding:1rem; border:1px solid #ddd; border-radius:8px;"> <h3 style="margin-top:0;"> ${d.name} ${d.airport_code && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` (${d.airport_code})` })}`} </h3> ${weekends.map((w) => {
    const outboundDates = [
      new Date(w.start_date.getTime() - 2 * 24 * 60 * 60 * 1e3),
      new Date(w.start_date.getTime() - 1 * 24 * 60 * 60 * 1e3),
      w.start_date,
      new Date(w.start_date.getTime() + 1 * 24 * 60 * 60 * 1e3)
    ];
    const returnDates = [
      w.end_date,
      new Date(w.end_date.getTime() + 1 * 24 * 60 * 60 * 1e3),
      new Date(w.end_date.getTime() + 2 * 24 * 60 * 60 * 1e3),
      new Date(w.end_date.getTime() + 3 * 24 * 60 * 60 * 1e3)
    ];
    return renderTemplate`<div${addAttribute(w.id, "key")} style="margin-top:1rem;"> <h4>
Finde: ${formatDate(w.start_date)} - ${formatDate(w.end_date)} </h4> <div style="display:flex; gap:2rem; flex-wrap:wrap;"> <div> <strong>Ida</strong> <ul> ${outboundDates.map((dDate) => {
      const dateStr = dDate.toISOString().slice(0, 10);
      const dayFlights = getFlightsFor(d.id, w.id, "outbound", dateStr);
      const minPrice = dayFlights[0]?.price_per_person;
      return renderTemplate`<li${addAttribute("out-" + dateStr, "key")}> ${formatDate(dDate)}${" "} ${dayFlights.length === 0 ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`– sin datos` })}` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`
– desde ${minPrice}${dayFlights[0].currency}<ul> ${dayFlights.map((f) => renderTemplate`<li${addAttribute(f.id, "key")}> ${f.airline || f.carrier_code || "Vuelo"} ${f.flight_number && renderTemplate`${renderComponent($$result3, "Fragment", Fragment, {}, { "default": async ($$result4) => renderTemplate`${f.flight_number}` })}`}:${" "} ${formatTimeEs(f.departure_time)} → ${formatTimeEs(f.arrival_time)} ·${" "} ${f.price_per_person} ${f.currency} </li>`)} </ul> ` })}`} </li>`;
    })} </ul> </div> <div> <strong>Vuelta</strong> <ul> ${returnDates.map((dDate) => {
      const dateStr = dDate.toISOString().slice(0, 10);
      const dayFlights = getFlightsFor(d.id, w.id, "return", dateStr);
      const minPrice = dayFlights[0]?.price_per_person;
      return renderTemplate`<li${addAttribute("ret-" + dateStr, "key")}> ${formatDate(dDate)}${" "} ${dayFlights.length === 0 ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`– sin datos` })}` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`
– desde ${minPrice}${dayFlights[0].currency}<ul> ${dayFlights.map((f) => renderTemplate`<li${addAttribute(f.id, "key")}> ${f.airline || f.carrier_code || "Vuelo"} ${f.flight_number && renderTemplate`${renderComponent($$result3, "Fragment", Fragment, {}, { "default": async ($$result4) => renderTemplate`${f.flight_number}` })}`}:${" "} ${formatTimeEs(f.departure_time)} → ${formatTimeEs(f.arrival_time)} ·${" "} ${f.price_per_person} ${f.currency} </li>`)} </ul> ` })}`} </li>`;
    })} </ul> </div> </div> </div>`;
  })} </div>`)}` })}`} </section> </body></html>`;
}, "C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/trips/[id].astro", void 0);

const $$file = "C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/trips/[id].astro";
const $$url = "/trips/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
