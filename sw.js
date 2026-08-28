const CACHE="fieldscout-v0.14.0-shell";
const ASSETS=[
  "./","./index.html","./styles.css",
  "./app.js?v=0.14.0","./db.js?v=0.14.0","./utils.js?v=0.14.0",
  "./api.js?v=0.14.0","./ranking.js?v=0.14.0",
  "./manifest.webmanifest"
];

self.addEventListener("install",e=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(async c=>{
      for(const asset of ASSETS){
        try{await c.add(asset)}catch(err){console.warn("SW cache skip",asset,err)}
      }
    })
  );
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",e=>{
  const req=e.request;
  const u=new URL(req.url);

  // External APIs / map tiles always go directly to network.
  if(
    u.hostname.includes("tbn.org.tw")||
    u.hostname.includes("tbiadata.tw")||
    u.hostname.includes("gbif.org")||
    u.hostname.includes("inaturalist.org")||
    u.hostname.includes("taicol.tw")||
    u.hostname.includes("openstreetmap.org")||
    u.hostname.includes("opentopomap.org")||
    u.hostname.includes("arcgisonline.com")||
    u.hostname.includes("unpkg.com")
  )return;

  if(req.mode==="navigate"){
    e.respondWith(
      fetch(req)
        .then(r=>{
          const copy=r.clone();
          caches.open(CACHE).then(c=>c.put("./index.html",copy));
          return r;
        })
        .catch(()=>caches.match("./index.html"))
    );
    return;
  }

  if(u.origin===location.origin){
    const codeAsset=/\.(?:js|css|html|webmanifest)$/.test(u.pathname);

    // Network-first for code so a stale service worker cannot pin old modules.
    if(codeAsset){
      e.respondWith(
        fetch(req)
          .then(r=>{
            const copy=r.clone();
            caches.open(CACHE).then(c=>c.put(req,copy));
            return r;
          })
          .catch(()=>caches.match(req))
      );
      return;
    }

    e.respondWith(
      caches.match(req).then(cached=>
        cached||fetch(req).then(r=>{
          const copy=r.clone();
          caches.open(CACHE).then(c=>c.put(req,copy));
          return r;
        })
      )
    );
  }
});
