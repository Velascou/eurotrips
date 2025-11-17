import { p as pool } from '../../../chunks/db_BnTjIUEm.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);
  const tripId = Number(params.get("tripId"));
  if (!tripId || Number.isNaN(tripId)) {
    return new Response("ID de viaje inválido", { status: 400 });
  }
  try {
    await pool.query("DELETE FROM flight_day_options WHERE trip_id = $1", [tripId]);
    await pool.query("DELETE FROM weekends WHERE trip_id = $1", [tripId]);
    await pool.query("DELETE FROM destinations WHERE trip_id = $1", [tripId]);
    await pool.query("DELETE FROM trips WHERE id = $1", [tripId]);
  } catch (err) {
    console.error("Error borrando viaje:", err);
    return new Response("Error borrando el viaje.", { status: 500 });
  }
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/trips"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
