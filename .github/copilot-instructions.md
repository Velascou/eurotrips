<!-- .github/copilot-instructions.md -->

# Copilot / AI agent instructions for eurotrips

Keep responses concise and action-oriented. The codebase is an Astro (SSR) site with serverless API endpoints and a Postgres backend. Most code comments and existing commit/messages are in Spanish — prefer Spanish for inline comments and clarifying questions unless the user asks otherwise.

- **Project type:** Astro (SSR) app using `output: 'server'` and Vercel serverless adapter (`astro.config.mjs`). Server endpoints live under `src/pages/api` and behave as serverless functions.
- **Run / build:** Use the scripts in `package.json`: `npm install`, `npm run dev`, `npm run build`, `npm run preview`.
- **Env / secrets:** Critical env vars:
  - `DATABASE_URL` — required for `src/lib/db.ts` (pg Pool). Agent must not hardcode credentials; verify existence before use.
  - `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, `AMADEUS_ENV` — used in `src/lib/flights.ts` to call Amadeus. If missing, functions return empty results (see warnings in `flights.ts`).
  - `FLIGHT_PROVIDER` — optional. New multi-provider support loads `src/lib/providers/<provider>.ts`. Default is `amadeus`. Example: `FLIGHT_PROVIDER=amadeus`.

- **Key folders/files to reference:**
  - `src/pages/api/` — all API endpoints (server-side logic).
  - `src/lib/db.ts` — Postgres connection pool and SSL config.
  - `src/lib/flights.ts` — Amadeus integration, flight option storage, helpers for date math.
  - `src/lib/providers/` — provider adapters for different flight APIs. Add `fetchTop3FlightsForDate` provider modules here. The project includes `providers/amadeus.ts`.
  - `src/lib/airports.ts` — IATA lookup using `src/assets/codigos_IATA.json`.
  - `src/assets/codigos_IATA.json` — static airport data used for city → IATA mapping.
  - `astro.config.mjs` — shows `output: 'server'` and Vercel adapter (implies serverless constraints).

- **Design patterns & conventions (project-specific):**
  - Server-side code lives in `src/pages/api/*` and in `src/lib/*.ts`. Treat `src/lib` as backend utilities.
  - Environment variables are read with `import.meta.env` in some files and via `dotenv/config` in `src/lib/db.ts`. For local dev, expect a `.env` file at repo root.
  - SQL is executed directly via `pg` Pool; queries live inside library functions (e.g., `saveFlightDayOption` in `flights.ts`). When changing DB schema, update all query sites referencing the affected table (no ORM).
  - JSON assets are imported directly (`resolveJsonModule` assumed). Keep `src/assets` JSON stable; prefer updating JSON rather than runtime scraping for static mappings.

- **Common gotchas for agents editing code:**
  - Do not introduce long-blocking synchronous work in serverless functions (e.g., heavy CPU loops or long sleeps). Use external APIs and DB calls with timeouts when appropriate.
  - `db.ts` expects `DATABASE_URL` and configures `ssl.rejectUnauthorized = false` — preserve this for Neon-like hosts unless asked to change.
  - Amadeus calls are gated by env vars. If you add tests or mock flows, stub `getAmadeusAccessToken` or set test env values.
  - Date helpers in `flights.ts` use UTC ISO strings; keep format `'YYYY-MM-DD'` when interacting with DB and API routes.

- **Examples of explicit, helpful prompts for the agent:**
  - "Add a new API route `src/pages/api/airports/search.ts` that queries `src/assets/codigos_IATA.json` and returns up to 10 candidates for a partial city name. Follow the normalization used in `src/lib/airports.ts`."
  - "Modify `saveFlightDayOption` to also store `fare_type` (text). Update SQL `INSERT`/`ON CONFLICT` and mention necessary DB migration SQL in your PR description."
  - "Write unit tests for `guessAirportCodeFromCity` using Jest or a lightweight runner; show how to import the JSON fixture from `src/assets/codigos_IATA.json`."

- **What to include in pull requests / changes:**
  - Short summary in Spanish, the files changed, and any DB migration SQL (explicit CREATE/ALTER statements). Example: `ALTER TABLE flight_day_options ADD COLUMN fare_type TEXT;`.
  - Notes about required env vars and any new variables that need to be set on Vercel.

If any of the above is unclear or you want examples expanded (e.g., an example API implementation or a sample DB migration), tell me which area to elaborate. 
