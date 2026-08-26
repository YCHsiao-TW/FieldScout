const CACHE="fieldscout-v0.9.4-shell";
const ASSETS=["./","./index.html","./styles.css","./app.js","./db.js","./utils.js","./api.js","./ranking.js","./manifest.webmanifest"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.hostname.includes("tbn.org.tw")||u.hostname.includes("tbiadata.tw")||u.hostname.includes("gbif.org")||u.hostname.includes("inaturalist.org")||u.hostname.includes("taicol.tw")||u.hostname.includes("openstreetmap.org")||u.hostname.includes("unpkg.com"))return;
  if(e.request.mode==="navigate"){e.respondWith(fetch(e.request).catch(()=>caches.match("./index.html")));return}
  if(u.origin===location.origin)e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(k=>k.put(e.request,c));return r})));
});
