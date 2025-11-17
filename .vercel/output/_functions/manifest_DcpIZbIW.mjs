import { p as decodeKey } from './chunks/astro/server_BcdbuJgD.mjs';
import 'clsx';
import 'cookie';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_TZeFHYZ4.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/","cacheDir":"file:///C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/node_modules/.astro/","outDir":"file:///C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/dist/","srcDir":"file:///C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/","publicDir":"file:///C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/public/","buildClientDir":"file:///C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/dist/client/","buildServerDir":"file:///C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/destinations/delete","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/destinations\\/delete\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"destinations","dynamic":false,"spread":false}],[{"content":"delete","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/destinations/delete.ts","pathname":"/api/destinations/delete","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/destinations","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/destinations\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"destinations","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/destinations.ts","pathname":"/api/destinations","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/participants","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/participants\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"participants","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/participants.ts","pathname":"/api/participants","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/trips/delete","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/trips\\/delete\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"trips","dynamic":false,"spread":false}],[{"content":"delete","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/trips/delete.ts","pathname":"/api/trips/delete","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/trips/[tripid]/refresh-flights","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/trips\\/([^/]+?)\\/refresh-flights\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"trips","dynamic":false,"spread":false}],[{"content":"tripId","dynamic":true,"spread":false}],[{"content":"refresh-flights","dynamic":false,"spread":false}]],"params":["tripId"],"component":"src/pages/api/trips/[tripId]/refresh-flights.ts","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/trips","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/trips\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"trips","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/trips.ts","pathname":"/api/trips","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/votes","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/votes\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"votes","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/votes.ts","pathname":"/api/votes","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/weekends/delete","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/weekends\\/delete\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"weekends","dynamic":false,"spread":false}],[{"content":"delete","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/weekends/delete.ts","pathname":"/api/weekends/delete","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/weekends","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/weekends\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"weekends","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/weekends.ts","pathname":"/api/weekends","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/join/[sharecode]","isIndex":false,"type":"page","pattern":"^\\/join\\/([^/]+?)\\/?$","segments":[[{"content":"join","dynamic":false,"spread":false}],[{"content":"shareCode","dynamic":true,"spread":false}]],"params":["shareCode"],"component":"src/pages/join/[shareCode].astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/trips/new","isIndex":false,"type":"page","pattern":"^\\/trips\\/new\\/?$","segments":[[{"content":"trips","dynamic":false,"spread":false}],[{"content":"new","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/trips/new.astro","pathname":"/trips/new","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/trips/[id]","isIndex":false,"type":"page","pattern":"^\\/trips\\/([^/]+?)\\/?$","segments":[[{"content":"trips","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/trips/[id].astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/trips","isIndex":true,"type":"page","pattern":"^\\/trips\\/?$","segments":[[{"content":"trips","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/trips/index.astro","pathname":"/trips","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"inline","content":"#background[data-astro-cid-mmc7otgs]{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;filter:blur(100px)}#container[data-astro-cid-mmc7otgs]{font-family:Inter,Roboto,Helvetica Neue,Arial Nova,Nimbus Sans,Arial,sans-serif;height:100%}main[data-astro-cid-mmc7otgs]{height:100%;display:flex;justify-content:center}#hero[data-astro-cid-mmc7otgs]{display:flex;align-items:start;flex-direction:column;justify-content:center;padding:16px}h1[data-astro-cid-mmc7otgs]{font-size:22px;margin-top:.25em}#links[data-astro-cid-mmc7otgs]{display:flex;gap:16px}#links[data-astro-cid-mmc7otgs] a[data-astro-cid-mmc7otgs]{display:flex;align-items:center;padding:10px 12px;color:#111827;text-decoration:none;transition:color .2s}#links[data-astro-cid-mmc7otgs] a[data-astro-cid-mmc7otgs]:hover{color:#4e5056}#links[data-astro-cid-mmc7otgs] a[data-astro-cid-mmc7otgs] svg[data-astro-cid-mmc7otgs]{height:1em;margin-left:8px}#links[data-astro-cid-mmc7otgs] a[data-astro-cid-mmc7otgs].button{color:#fff;background:linear-gradient(83.21deg,#3245ff,#bc52ee);box-shadow:inset 0 0 0 1px #ffffff1f,inset 0 -2px #0000003d;border-radius:10px}#links[data-astro-cid-mmc7otgs] a[data-astro-cid-mmc7otgs].button:hover{color:#e6e6e6;box-shadow:none}pre[data-astro-cid-mmc7otgs]{font-family:ui-monospace,Cascadia Code,Source Code Pro,Menlo,Consolas,DejaVu Sans Mono,monospace;font-weight:400;background:linear-gradient(14deg,#d83333,#f041ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0}h2[data-astro-cid-mmc7otgs]{margin:0 0 1em;font-weight:400;color:#111827;font-size:20px}p[data-astro-cid-mmc7otgs]{color:#4b5563;font-size:16px;line-height:24px;letter-spacing:-.006em;margin:0}code[data-astro-cid-mmc7otgs]{display:inline-block;background:linear-gradient(66.77deg,#f3cddd,#f5cee7) padding-box,linear-gradient(155deg,#d83333,#f041ff 18%,#f5cee7 45%) border-box;border-radius:8px;border:1px solid transparent;padding:6px 8px}.box[data-astro-cid-mmc7otgs]{padding:16px;background:#fff;border-radius:16px;border:1px solid white}#news[data-astro-cid-mmc7otgs]{position:absolute;bottom:16px;right:16px;max-width:300px;text-decoration:none;transition:background .2s;backdrop-filter:blur(50px)}#news[data-astro-cid-mmc7otgs]:hover{background:#ffffff8c}@media screen and (max-height:368px){#news[data-astro-cid-mmc7otgs]{display:none}}@media screen and (max-width:768px){#container[data-astro-cid-mmc7otgs]{display:flex;flex-direction:column}#hero[data-astro-cid-mmc7otgs]{display:block;padding-top:10%}#links[data-astro-cid-mmc7otgs]{flex-wrap:wrap}#links[data-astro-cid-mmc7otgs] a[data-astro-cid-mmc7otgs].button{padding:14px 18px}#news[data-astro-cid-mmc7otgs]{right:16px;left:16px;bottom:2.5rem;max-width:100%}h1[data-astro-cid-mmc7otgs]{line-height:1.5}}html,body{margin:0;width:100%;height:100%}\n"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/join/[shareCode].astro",{"propagation":"none","containsHead":true}],["C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/trips/new.astro",{"propagation":"none","containsHead":true}],["C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/trips/[id].astro",{"propagation":"none","containsHead":true}],["C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/trips/index.astro",{"propagation":"none","containsHead":true}],["C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/api/destinations/delete@_@ts":"pages/api/destinations/delete.astro.mjs","\u0000@astro-page:src/pages/api/destinations@_@ts":"pages/api/destinations.astro.mjs","\u0000@astro-page:src/pages/api/participants@_@ts":"pages/api/participants.astro.mjs","\u0000@astro-page:src/pages/api/trips/delete@_@ts":"pages/api/trips/delete.astro.mjs","\u0000@astro-page:src/pages/api/trips/[tripId]/refresh-flights@_@ts":"pages/api/trips/_tripid_/refresh-flights.astro.mjs","\u0000@astro-page:src/pages/api/trips@_@ts":"pages/api/trips.astro.mjs","\u0000@astro-page:src/pages/api/votes@_@ts":"pages/api/votes.astro.mjs","\u0000@astro-page:src/pages/api/weekends/delete@_@ts":"pages/api/weekends/delete.astro.mjs","\u0000@astro-page:src/pages/api/weekends@_@ts":"pages/api/weekends.astro.mjs","\u0000@astro-page:src/pages/join/[shareCode]@_@astro":"pages/join/_sharecode_.astro.mjs","\u0000@astro-page:src/pages/trips/new@_@astro":"pages/trips/new.astro.mjs","\u0000@astro-page:src/pages/trips/[id]@_@astro":"pages/trips/_id_.astro.mjs","\u0000@astro-page:src/pages/trips/index@_@astro":"pages/trips.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_DcpIZbIW.mjs","C:/Users/Diego/Desktop/ProyectosGITHUB/eurotrips/eurotrips/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_D_EXafK9.mjs","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/astro.CXuftnGC.svg","/_astro/background.Mahwsfbs.svg","/favicon.svg"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"serverIslandNameMap":[],"key":"jGjPeu75Rd7DVT/BcXfq90sDtt1Gh2TuA/FaEZEjhC8="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
