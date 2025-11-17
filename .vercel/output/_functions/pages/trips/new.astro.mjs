import { e as createComponent, k as renderHead, r as renderTemplate } from '../../chunks/astro/server_BcdbuJgD.mjs';
import 'clsx';
export { renderers } from '../../renderers.mjs';

const $$New = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="es"> <head><meta charset="utf-8"><title>Crear viaje</title>${renderHead()}</head> <body style="font-family: system-ui; max-width: 800px; margin: 2rem auto;"> <h1>Crear un nuevo viaje</h1> <form method="POST" action="/api/trips" style="display: grid; gap: 1rem; max-width: 400px;"> <label>
Nombre del viaje<br> <input name="name" required style="width: 100%; padding: 0.4rem;"> </label> <label>
Ciudad de salida<br> <input name="originCity" required style="width: 100%; padding: 0.4rem;"> </label> <label>
Moneda<br> <input name="currency" value="EUR" required style="width: 100%; padding: 0.4rem;"> </label> <button type="submit" style="padding: 0.6rem 1rem;">
Guardar viaje
</button> </form> <p style="margin-top: 1rem;"> <a href="/trips">⬅ Volver a la lista de viajes</a> </p> </body></html>`;
}, "C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/trips/new.astro", void 0);

const $$file = "C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/trips/new.astro";
const $$url = "/trips/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
