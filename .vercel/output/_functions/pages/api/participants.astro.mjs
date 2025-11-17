import { p as pool } from '../../chunks/db_BnTjIUEm.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);
  const tripId = Number(params.get("tripId"));
  const shareCode = (params.get("shareCode") ?? "").trim();
  const displayName = (params.get("displayName") ?? "").trim();
  const email = (params.get("email") ?? "").trim();
  if (!tripId || Number.isNaN(tripId) || !displayName || !shareCode) {
    return new Response("Datos inválidos", { status: 400 });
  }
  let participantId;
  try {
    const res = await pool.query(
      `
      INSERT INTO participants (trip_id, display_name, email)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [tripId, displayName, email || null]
    );
    participantId = res.rows[0].id;
  } catch (err) {
    console.error("Error creando participante:", err);
    return new Response("Error creando participante.", { status: 500 });
  }
  const redirectUrl = `/join/${encodeURIComponent(
    shareCode
  )}?participantId=${participantId}`;
  return new Response(null, {
    status: 303,
    headers: {
      Location: redirectUrl
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
