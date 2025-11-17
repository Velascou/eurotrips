import { e as createComponent, f as createAstro, k as renderHead, l as renderComponent, r as renderTemplate, n as Fragment, h as addAttribute } from '../../chunks/astro/server_BcdbuJgD.mjs';
import { p as pool } from '../../chunks/db_BnTjIUEm.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$shareCode = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$shareCode;
  const shareCode = Astro2.params.shareCode;
  const url = Astro2.url;
  const participantIdParam = url.searchParams.get("participantId");
  const participantId = participantIdParam ? Number(participantIdParam) : null;
  const tripRes = await pool.query(
    "SELECT id, name, origin_city, origin_airport_code, currency, share_code FROM trips WHERE share_code = $1",
    [shareCode]
  );
  const trip = tripRes.rows[0];
  if (!trip) {
    throw new Error("Viaje no encontrado");
  }
  const destRes = await pool.query(
    "SELECT id, name, country, airport_code FROM destinations WHERE trip_id = $1 ORDER BY name",
    [trip.id]
  );
  const destinations = destRes.rows;
  const weekendsRes = await pool.query(
    "SELECT id, start_date, end_date FROM weekends WHERE trip_id = $1 ORDER BY start_date",
    [trip.id]
  );
  const weekends = weekendsRes.rows;
  let participant = null;
  let existingVote = null;
  if (participantId) {
    const pRes = await pool.query(
      "SELECT id, display_name, email FROM participants WHERE id = $1 AND trip_id = $2",
      [participantId, trip.id]
    );
    participant = pRes.rows[0] ?? null;
    if (participant) {
      const vRes = await pool.query(
        "SELECT destination_id, weekend_id FROM votes WHERE trip_id = $1 AND participant_id = $2",
        [trip.id, participantId]
      );
      existingVote = vRes.rows[0] ?? null;
    }
  }
  function formatDate(d) {
    return d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" });
  }
  return renderTemplate`<html lang="es"> <head><meta charset="utf-8"><title>Votar viaje: ${trip.name}</title>${renderHead()}</head> <body style="font-family: system-ui; max-width: 900px; margin: 2rem auto; line-height:1.5;"> <h1>${trip.name}</h1> <p>
Origen: <strong>${trip.origin_city}</strong> ${trip.origin_airport_code && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` (${trip.origin_airport_code})` })}`} <br>
Moneda: <strong>${trip.currency}</strong> </p> ${!participantId || !participant ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <h2>Preséntate para votar</h2> <p>Escribe tu nombre para participar en las votaciones de este viaje.</p> <form method="POST" action="/api/participants" style="display:grid; gap:0.5rem; max-width:400px;"> <input type="hidden" name="tripId"${addAttribute(trip.id, "value")}> <input type="hidden" name="shareCode"${addAttribute(trip.share_code, "value")}> <label>
Nombre (se verá en el resumen de votos)<br> <input name="displayName" required style="width:100%; padding:0.3rem;"> </label> <label>
Email (opcional)<br> <input name="email" type="email" style="width:100%; padding:0.3rem;"> </label> <button type="submit" style="padding:0.4rem 0.8rem; margin-top:0.5rem;">
Entrar y votar
</button> </form> ` })}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <h2>Hola, ${participant.display_name} 👋</h2> ${destinations.length === 0 || weekends.length === 0 ? renderTemplate`<p>
El organizador aún no ha definido destinos o fines de semana.
</p>` : renderTemplate`<form method="POST" action="/api/votes" style="display:grid; gap:1rem; max-width:600px;"> <input type="hidden" name="tripId"${addAttribute(trip.id, "value")}> <input type="hidden" name="participantId"${addAttribute(participant.id, "value")}> <input type="hidden" name="shareCode"${addAttribute(trip.share_code, "value")}> <section> <h3>Elige un destino</h3> ${destinations.map((d) => renderTemplate`<label style="display:block; margin-bottom:0.3rem;"> <input type="radio" name="destinationId"${addAttribute(d.id, "value")} required${addAttribute(existingVote && existingVote.destination_id === d.id, "checked")}> ${" "} ${d.name} ${d.country && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` – ${d.country}` })}`} ${d.airport_code && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` (${d.airport_code})` })}`} </label>`)} </section> <section> <h3>Elige un fin de semana</h3> ${weekends.map((w) => renderTemplate`<label style="display:block; margin-bottom:0.3rem;"> <input type="radio" name="weekendId"${addAttribute(w.id, "value")} required${addAttribute(existingVote && existingVote.weekend_id === w.id, "checked")}> ${" "} ${formatDate(w.start_date)} – ${formatDate(w.end_date)} </label>`)} </section> <button type="submit" style="padding:0.4rem 0.8rem; margin-top:0.5rem;">
Guardar voto
</button> ${existingVote && renderTemplate`<p style="font-size:0.9rem; color:#555;">
Si cambias la selección y vuelves a guardar, se actualizará tu voto.
</p>`} </form>`}` })}`} </body></html>`;
}, "C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/join/[shareCode].astro", void 0);

const $$file = "C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/join/[shareCode].astro";
const $$url = "/join/[shareCode]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$shareCode,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
