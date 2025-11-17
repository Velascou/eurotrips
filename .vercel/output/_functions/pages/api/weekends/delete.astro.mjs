import { p as pool } from '../../../chunks/db_BnTjIUEm.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);
  const tripId = Number(params.get("tripId"));
  const weekendId = Number(params.get("weekendId"));
  if (!tripId || Number.isNaN(tripId) || !weekendId || Number.isNaN(weekendId)) {
    return new Response("Datos inválidos", { status: 400 });
  }
  try {
    await pool.query(
      "DELETE FROM flight_day_options WHERE trip_id = $1 AND weekend_id = $2",
      [tripId, weekendId]
    );
    await pool.query(
      "DELETE FROM weekends WHERE id = $1 AND trip_id = $2",
      [weekendId, tripId]
    );
  } catch (err) {
    console.error("Error borrando fin de semana:", err);
    return new Response("Error borrando el fin de semana.", { status: 500 });
  }
  return new Response(null, {
    status: 303,
    headers: {
      Location: `/trips/${tripId}`
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
