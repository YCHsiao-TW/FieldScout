const CACHE="fieldscout-v0.4.0";
const ASSETS=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest"];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const req=event.request;
  const url=new URL(req.url);

  // External biodiversity APIs and map tiles must remain live network requests.
  if(
    url.hostname.includes("tbiadata.tw") ||
    url.hostname.includes("taicol.tw") ||
    url.hostname.includes("gbif.org") ||
    url.hostname.includes("inaturalist.org") ||
    url.hostname.includes("openstreetmap.org") ||
    url.hostname.includes("unpkg.com")
  ) return;

  if(req.mode==="navigate"){
    event.respondWith(
      fetch(req)
        .then(res=>{
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put("./index.html",copy));
          return res;
        })
        .catch(()=>caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
        return res;
      })
      .catch(()=>caches.match(req))
  );
});
