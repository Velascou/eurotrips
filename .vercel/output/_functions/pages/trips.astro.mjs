import { e as createComponent, k as renderHead, r as renderTemplate, h as addAttribute, l as renderComponent, n as Fragment } from '../chunks/astro/server_BcdbuJgD.mjs';
import { p as pool } from '../chunks/db_BnTjIUEm.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const result = await pool.query("SELECT * FROM trips ORDER BY created_at DESC");
  const trips = result.rows;
  return renderTemplate`<html lang="es"> <head><meta charset="utf-8"><title>Viajes con amigos</title>${renderHead()}</head> <body style="font-family: system-ui; max-width: 800px; margin: 2rem auto;"> <h1>Viajes creados</h1> <p> <a href="/trips/new">➕ Crear nuevo viaje</a> </p> ${trips.length === 0 ? renderTemplate`<p>Aún no hay viajes. ¡Crea el primero!</p>` : renderTemplate`<ul> ${trips.map((t) => renderTemplate`<li${addAttribute(t.id, "key")} style="margin-bottom:0.5rem;"> <strong>${t.name}</strong> ${" "}– origen: ${t.origin_city} ${t.origin_airport_code && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` (${t.origin_airport_code})` })}`}  <a${addAttribute(`/trips/${t.id}`, "href")} style="margin-left:0.5rem; padding:0.2rem 0.6rem; border:1px solid #ccc; border-radius:4px; text-decoration:none;">
Entrar
</a>  <form method="POST" action="/api/trips/delete" style="display:inline; margin-left:0.5rem;"> <input type="hidden" name="tripId"${addAttribute(t.id, "value")}> <button type="submit" style="border:none; background:none; color:#c00; cursor:pointer; font-size:0.85rem;">
eliminar
</button> </form> </li>`)} </ul>`} </body></html>`;
}, "C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/trips/index.astro", void 0);

const $$file = "C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/trips/index.astro";
const $$url = "/trips";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
