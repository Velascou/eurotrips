import { p as pool } from '../../../chunks/db_BnTjIUEm.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);
  const tripId = Number(params.get("tripId"));
  const destinationId = Number(params.get("destinationId"));
  if (!tripId || Number.isNaN(tripId) || !destinationId || Number.isNaN(destinationId)) {
    return new Response("Datos inválidos", { status: 400 });
  }
  try {
    await pool.query(
      "DELETE FROM flight_day_options WHERE trip_id = $1 AND destination_id = $2",
      [tripId, destinationId]
    );
    await pool.query(
      "DELETE FROM destinations WHERE id = $1 AND trip_id = $2",
      [destinationId, tripId]
    );
  } catch (err) {
    console.error("Error borrando destino:", err);
    return new Response("Error borrando el destino.", { status: 500 });
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
