import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CQvmBvIe.mjs';
import { manifest } from './manifest_DcpIZbIW.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/destinations/delete.astro.mjs');
const _page2 = () => import('./pages/api/destinations.astro.mjs');
const _page3 = () => import('./pages/api/participants.astro.mjs');
const _page4 = () => import('./pages/api/trips/delete.astro.mjs');
const _page5 = () => import('./pages/api/trips/_tripid_/refresh-flights.astro.mjs');
const _page6 = () => import('./pages/api/trips.astro.mjs');
const _page7 = () => import('./pages/api/votes.astro.mjs');
const _page8 = () => import('./pages/api/weekends/delete.astro.mjs');
const _page9 = () => import('./pages/api/weekends.astro.mjs');
const _page10 = () => import('./pages/join/_sharecode_.astro.mjs');
const _page11 = () => import('./pages/trips/new.astro.mjs');
const _page12 = () => import('./pages/trips/_id_.astro.mjs');
const _page13 = () => import('./pages/trips.astro.mjs');
const _page14 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/destinations/delete.ts", _page1],
    ["src/pages/api/destinations.ts", _page2],
    ["src/pages/api/participants.ts", _page3],
    ["src/pages/api/trips/delete.ts", _page4],
    ["src/pages/api/trips/[tripId]/refresh-flights.ts", _page5],
    ["src/pages/api/trips.ts", _page6],
    ["src/pages/api/votes.ts", _page7],
    ["src/pages/api/weekends/delete.ts", _page8],
    ["src/pages/api/weekends.ts", _page9],
    ["src/pages/join/[shareCode].astro", _page10],
    ["src/pages/trips/new.astro", _page11],
    ["src/pages/trips/[id].astro", _page12],
    ["src/pages/trips/index.astro", _page13],
    ["src/pages/index.astro", _page14]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "cc9fcfd2-a6dc-4360-a4b3-f36642e9493b",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
