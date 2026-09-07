const CACHE_PREFIX="fieldscout-";
const CACHE="fieldscout-v1.1.2-shell";
const ASSETS=[
  "./","./index.html","./styles.css",
  "./app.js?v=1.1.2","./db.js?v=1.1.2","./utils.js?v=1.1.2",
  "./api.js?v=1.1.2","./ranking.js?v=1.1.2","./i18n.js?v=1.1.2",
  "./backup.js?v=1.1.2",
  "./manifest.webmanifest"
];

async function saveResponse(key,response){
  try{
    const cache=await caches.open(CACHE);
    await cache.put(key,response.clone());
  }catch(error){console.warn("FieldScout cache write failed",error)}
  return response;
}

self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(
        ks.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k))
      ))
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
          if(!r.ok)throw new Error(`Navigation HTTP ${r.status}`);
          return saveResponse("./index.html",r);
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
            if(!r.ok)throw new Error(`Asset HTTP ${r.status}`);
            return saveResponse(req,r);
          })
          .catch(()=>caches.match(req))
      );
      return;
    }

    e.respondWith(
      caches.match(req).then(cached=>
        cached||fetch(req).then(r=>{
          if(!r.ok)return r;
          return saveResponse(req,r);
        })
      )
    );
  }
});
