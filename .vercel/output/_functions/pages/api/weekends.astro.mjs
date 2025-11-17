import { p as pool } from '../../chunks/db_BnTjIUEm.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);
  const tripId = Number(params.get("tripId"));
  const startDateStr = (params.get("startDate") ?? "").trim();
  const endDateStr = (params.get("endDate") ?? "").trim();
  if (!tripId || Number.isNaN(tripId) || !startDateStr || !endDateStr) {
    return new Response("Datos inválidos", { status: 400 });
  }
  await pool.query(
    `
    INSERT INTO weekends (trip_id, start_date, end_date)
    VALUES ($1, $2, $3)
    ON CONFLICT (trip_id, start_date, end_date) DO NOTHING
    `,
    [tripId, startDateStr, endDateStr]
  );
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
