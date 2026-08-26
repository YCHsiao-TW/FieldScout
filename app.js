const API = {
  tbia: "https://tbiadata.tw/api/v1/occurrence",
  taicol: "https://api.taicol.tw/v2/nameMatch",
  gbifMatch: "https://api.gbif.org/v1/species/match",
  gbifOccurrence: "https://api.gbif.org/v1/occurrence/search",
  inatTaxa: "https://api.inaturalist.org/v1/taxa/autocomplete",
  inatObservations: "https://api.inaturalist.org/v1/observations"
};

const state = {
  map:null, markers:L.layerGroup(), me:null, currentPos:null,
  records:[], candidates:[], resolvedTaxon:null,
  trip:JSON.parse(localStorage.getItem("fieldscout_trip")||"[]"),
  saved:JSON.parse(localStorage.getItem("fieldscout_records")||"[]"),
  capturePos:null,
  editingRecordId:null
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

// Backward compatibility for records saved by v0.2/v0.3.
state.saved=state.saved.map((r,i)=>({
  ...r,
  id:r.id || `legacy-${i}-${r.specimen||"record"}`,
  createdAt:r.createdAt || r.time || null,
  updatedAt:r.updatedAt || null
}));

function setStatus(t){ $("#status").textContent=t; }
function persist(){
  localStorage.setItem("fieldscout_trip",JSON.stringify(state.trip));
  localStorage.setItem("fieldscout_records",JSON.stringify(state.saved));
}
function initMap(){
  state.map=L.map("map",{zoomControl:false}).setView([23.7,121.0],7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    maxZoom:19, attribution:"© OpenStreetMap contributors"
  }).addTo(state.map);
  state.markers.addTo(state.map);
  L.control.zoom({position:"topright"}).addTo(state.map);
}
function getLat(r){ return Number(r.standardLatitude ?? r.decimalLatitude ?? r.latitude); }
function getLon(r){ return Number(r.standardLongitude ?? r.decimalLongitude ?? r.longitude); }
function recordName(r){ return r.scientificName || r.name || r.vernacularName || $("#taxonInput").value.trim() || "未知物種"; }
function eventDate(r){ return r.eventDate || r.year || r.modified || "日期不明"; }
function locality(r){ return r.locality || r.county || r.municipality || r.stateProvince || r.place_guess || "地點未提供"; }
function sourceName(r){ return r.source || "未知來源"; }

function googleMapsNavUrl(lat,lon){
  const dest=`${Number(lat).toFixed(7)},${Number(lon).toFixed(7)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
}
function stableRecordId(r){
  return r.id || r.occurrenceID || `${sourceName(r)}:${getLat(r).toFixed(6)}:${getLon(r).toFixed(6)}:${String(eventDate(r)).slice(0,10)}`;
}
function csvEscape(v){
  return `"${String(v??"").replaceAll('"','""')}"`;
}

async function fetchJson(url, timeout=15000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const res=await fetch(url,{headers:{"Accept":"application/json"},signal:controller.signal});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }finally{
    clearTimeout(timer);
  }
}

function locate(zoom=true){
  if(!navigator.geolocation){ setStatus("此瀏覽器不支援 GPS。"); return; }
  setStatus("正在取得 GPS…");
  navigator.geolocation.getCurrentPosition(pos=>{
    const {latitude,longitude,accuracy}=pos.coords;
    state.currentPos={lat:latitude,lon:longitude,accuracy};
    $("#gpsPanel").classList.remove("hidden");
    $("#gpsText").textContent=`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    $("#gpsAcc").textContent=`±${Math.round(accuracy)} m`;
    if(state.me) state.map.removeLayer(state.me);
    state.me=L.circleMarker([latitude,longitude],{radius:9,weight:3}).addTo(state.map).bindPopup("目前位置");
    if(zoom) state.map.setView([latitude,longitude],14);
    renderRecords();
    rankCandidates();
    setStatus("GPS 已取得。搜尋後可切換「全臺」或附近半徑。");
  },err=>setStatus("無法取得 GPS："+err.message),{enableHighAccuracy:true,timeout:12000,maximumAge:10000});
}

async function resolveTaiCOL(query){
  try{
    const u=new URL(API.taicol);
    u.searchParams.set("name",query);
    const json=await fetchJson(u.toString(),10000);
    const data=Array.isArray(json.data)?json.data:[];
    const hit=data.find(x=>x?.matched_name) || data[0];
    if(!hit) return null;
    return {
      query,
      scientificName:hit.matched_name || query,
      taxonID:hit.taxon_id || null,
      commonName:query,
      resolver:"TaiCOL"
    };
  }catch(e){
    console.warn("TaiCOL lookup failed",e);
    return null;
  }
}

async function resolveINat(query){
  try{
    const u=new URL(API.inatTaxa);
    u.searchParams.set("q",query);
    u.searchParams.set("locale","zh-TW");
    u.searchParams.set("per_page","10");
    const json=await fetchJson(u.toString(),10000);
    const results=Array.isArray(json.results)?json.results:[];
    if(!results.length) return null;
    const spider=results.find(x=>{
      const iconic=String(x.iconic_taxon_name||"").toLowerCase();
      return iconic==="arachnida" || String(x.rank||"").toLowerCase()==="species";
    }) || results[0];
    return {
      query,
      scientificName:spider.name || query,
      inatTaxonId:spider.id || null,
      commonName:spider.preferred_common_name || query,
      resolver:"iNaturalist"
    };
  }catch(e){
    console.warn("iNaturalist taxon lookup failed",e);
    return null;
  }
}

async function resolveTaxon(query){
  const taicol=await resolveTaiCOL(query);
  if(taicol){
    const inat=await resolveINat(taicol.scientificName);
    return {...taicol,inatTaxonId:inat?.inatTaxonId||null};
  }
  const inat=await resolveINat(query);
  if(inat) return inat;
  return {query,scientificName:query,taxonID:null,inatTaxonId:null,commonName:query,resolver:"input"};
}

function normalizeTBIA(r){
  return {...r,source:"TBIA",id:r.id||r.occurrenceID||`tbia:${crypto.randomUUID()}`};
}
function normalizeGBIF(r){
  return {
    id:`gbif:${r.key}`,
    occurrenceID:r.occurrenceID || String(r.key||""),
    scientificName:r.scientificName || r.acceptedScientificName || r.species || "",
    vernacularName:r.vernacularName || "",
    eventDate:r.eventDate || r.year || "",
    year:r.year || null,
    locality:r.locality || r.municipality || r.stateProvince || r.country || "GBIF 紀錄",
    county:r.stateProvince || "",
    municipality:r.municipality || "",
    standardLatitude:r.decimalLatitude,
    standardLongitude:r.decimalLongitude,
    coordinateUncertaintyInMeters:r.coordinateUncertaintyInMeters ?? null,
    basisOfRecord:r.basisOfRecord || "",
    datasetName:r.datasetTitle || r.datasetName || "",
    source:"GBIF",
    sourceUrl:r.key?`https://www.gbif.org/occurrence/${r.key}`:null
  };
}
function normalizeINat(o){
  const coords=Array.isArray(o.geojson?.coordinates)?o.geojson.coordinates:null;
  if(!coords || coords.length<2) return null;
  return {
    id:`inat:${o.id}`,
    occurrenceID:String(o.id),
    scientificName:o.taxon?.name || "",
    vernacularName:o.taxon?.preferred_common_name || "",
    eventDate:o.observed_on || o.time_observed_at || o.created_at || "",
    year:Number(String(o.observed_on||"").slice(0,4)) || null,
    locality:o.place_guess || "iNaturalist 紀錄",
    standardLatitude:Number(coords[1]),
    standardLongitude:Number(coords[0]),
    coordinateUncertaintyInMeters:o.positional_accuracy ?? null,
    basisOfRecord:"HUMAN_OBSERVATION",
    source:"iNaturalist",
    sourceUrl:o.uri || (o.id?`https://www.inaturalist.org/observations/${o.id}`:null)
  };
}

async function queryTBIA(query,resolved){
  const u=new URL(API.tbia);
  if(resolved?.taxonID) u.searchParams.set("taxonID",resolved.taxonID);
  else u.searchParams.set("name",query);
  u.searchParams.set("bioGroup","蜘蛛");
  u.searchParams.set("limit","300");
  const json=await fetchJson(u.toString(),12000);
  const data=Array.isArray(json.data)?json.data:(Array.isArray(json)?json:[]);
  return data.map(normalizeTBIA).filter(r=>Number.isFinite(getLat(r))&&Number.isFinite(getLon(r)));
}

async function queryGBIF(scientificName){
  let taxonKey=null;
  try{
    const mu=new URL(API.gbifMatch);
    mu.searchParams.set("name",scientificName);
    const match=await fetchJson(mu.toString(),10000);
    taxonKey=match.usageKey || match.speciesKey || match.acceptedUsageKey || null;
  }catch(e){
    console.warn("GBIF match failed; using scientificName directly",e);
  }

  const u=new URL(API.gbifOccurrence);
  if(taxonKey) u.searchParams.set("taxonKey",String(taxonKey));
  else u.searchParams.set("scientificName",scientificName);
  u.searchParams.set("country","TW");
  u.searchParams.set("hasCoordinate","true");
  u.searchParams.set("occurrenceStatus","PRESENT");
  u.searchParams.set("limit","300");

  const json=await fetchJson(u.toString(),15000);
  const data=Array.isArray(json.results)?json.results:[];
  return data.map(normalizeGBIF).filter(r=>Number.isFinite(getLat(r))&&Number.isFinite(getLon(r)));
}

async function queryINat(taxon){
  let taxonId=taxon?.inatTaxonId || null;
  if(!taxonId){
    const resolved=await resolveINat(taxon?.scientificName || taxon?.query || "");
    taxonId=resolved?.inatTaxonId || null;
  }
  if(!taxonId) return [];

  const u=new URL(API.inatObservations);
  u.searchParams.set("taxon_id",String(taxonId));
  u.searchParams.set("place_id","7887");
  u.searchParams.set("geo","true");
  u.searchParams.set("verifiable","true");
  u.searchParams.set("per_page","200");
  u.searchParams.set("order_by","observed_on");
  u.searchParams.set("order","desc");

  const json=await fetchJson(u.toString(),15000);
  const results=Array.isArray(json.results)?json.results:[];
  return results.map(normalizeINat).filter(Boolean).filter(r=>Number.isFinite(getLat(r))&&Number.isFinite(getLon(r)));
}

function dedupeRecords(records){
  const seen=new Set();
  const out=[];
  for(const r of records){
    const lat=getLat(r),lon=getLon(r);
    const date=String(eventDate(r)).slice(0,10);
    const tax=String(recordName(r)).toLowerCase();
    const key=`${lat.toFixed(5)}|${lon.toFixed(5)}|${date}|${tax}`;
    if(seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

async function searchAll(){
  const query=$("#taxonInput").value.trim();
  if(!query){ setStatus("請先輸入物種名稱。"); return; }
  $("#recordTaxon").value=query;
  $("#searchBtn").disabled=true;
  state.records=[];
  state.candidates=[];
  renderRecords();
  renderCandidates();

  try{
    setStatus(`正在解析「${query}」的名稱…`);
    const resolved=await resolveTaxon(query);
    state.resolvedTaxon=resolved;
    const resolvedText=resolved.scientificName!==query?`${query} → ${resolved.scientificName}`:resolved.scientificName;
    setStatus(`名稱：${resolvedText}。正在查詢臺灣紀錄…`);

    let tbia=[],gbif=[],inat=[];
    let tbiaError=null,gbifError=null,inatError=null;

    try{
      tbia=await queryTBIA(query,resolved);
    }catch(e){
      tbiaError=e;
      console.warn("TBIA browser query unavailable",e);
    }

    if(tbia.length){
      state.records=dedupeRecords(tbia);
    }else{
      const fallback=await Promise.allSettled([
        queryGBIF(resolved.scientificName),
        queryINat(resolved)
      ]);
      if(fallback[0].status==="fulfilled") gbif=fallback[0].value; else gbifError=fallback[0].reason;
      if(fallback[1].status==="fulfilled") inat=fallback[1].value; else inatError=fallback[1].reason;
      state.records=dedupeRecords([...gbif,...inat]);
    }

    drawRecords();
    renderRecords();
    rankCandidates();

    const parts=[];
    if(tbia.length) parts.push(`TBIA ${tbia.length}`);
    if(gbif.length) parts.push(`GBIF ${gbif.length}`);
    if(inat.length) parts.push(`iNaturalist ${inat.length}`);

    if(state.records.length){
      const resolver=resolved.resolver?`；名稱解析：${resolved.resolver}`:"";
      const note=tbiaError && !tbia.length?"；TBIA 因瀏覽器 CORS 未使用":"";
      setStatus(`找到 ${state.records.length} 筆可繪製紀錄（${parts.join(" + ")}）${resolver}${note}。`);
    }else{
      const errors=[tbiaError,gbifError,inatError].filter(Boolean);
      if(errors.length>=3){
        setStatus("目前三個資料來源都無法連線。請稍後再試，或檢查 Safari 的內容阻擋設定。");
      }else{
        setStatus(`已搜尋「${resolvedText}」，但目前沒有取得臺灣可繪製座標紀錄。`);
      }
    }
  }catch(e){
    console.error(e);
    setStatus("搜尋發生錯誤："+(e?.message||"未知錯誤"));
  }finally{
    $("#searchBtn").disabled=false;
  }
}

function distanceKm(a,b){
  const R=6371,toRad=x=>x*Math.PI/180;
  const dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon);
  const s=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
function drawRecords(){
  state.markers.clearLayers();
  const bounds=[];
  state.records.forEach(r=>{
    const lat=getLat(r),lon=getLon(r);
    const src=esc(sourceName(r));
    const m=L.circleMarker([lat,lon],{radius:6,weight:2,fillOpacity:.72})
      .bindPopup(`<b>${esc(recordName(r))}</b><br>${esc(locality(r))}<br>${esc(eventDate(r))}<br><small>${src}</small>`);
    m.addTo(state.markers);
    bounds.push([lat,lon]);
  });
  if(bounds.length) state.map.fitBounds(bounds,{padding:[25,25],maxZoom:12});
}
function nearbyFiltered(){
  const radius=$("#radiusSelect").value;
  if(radius==="all" || !state.currentPos) return state.records.slice();
  const km=Number(radius);
  return state.records.map(x=>({...x,_dist:distanceKm(state.currentPos,{lat:getLat(x),lon:getLon(x)})}))
    .filter(x=>x._dist<=km).sort((a,b)=>a._dist-b._dist);
}
function renderRecords(){
  const list=nearbyFiltered();
  const radius=$("#radiusSelect")?.value || "all";
  if(!state.records.length){
    $("#resultMeta").textContent="尚未查詢";
  }else if(radius==="all" || !state.currentPos){
    $("#resultMeta").textContent=`全臺 ${state.records.length} 筆可繪製紀錄`;
  }else{
    $("#resultMeta").textContent=`${radius} km 內 ${list.length} 筆／全臺 ${state.records.length} 筆`;
  }

  $("#recordList").innerHTML=list.length?list.slice(0,100).map(r=>{
    const lat=getLat(r),lon=getLon(r);
    return `
    <article class="card">
      <div class="card-top">
        <div>
          <h3>${esc(recordName(r))}</h3>
          <div class="meta">${esc(locality(r))}<br>${esc(eventDate(r))}${r._dist!=null?` · ${r._dist.toFixed(2)} km`:``}<br>來源：${esc(sourceName(r))}</div>
        </div>
      </div>
      <div class="actions">
        <button data-show="${lat},${lon}">地圖定位</button>
        <a class="nav-link" href="${googleMapsNavUrl(lat,lon)}" target="_blank" rel="noopener">Google Maps 導航</a>
        <button data-addrec="${esc(stableRecordId(r))}" data-lat="${lat}" data-lon="${lon}" data-name="${esc(locality(r))}" data-source="${esc(sourceName(r))}">加入行程</button>
      </div>
    </article>`;
  }).join(""):`<div class="empty">${state.records.length?"目前半徑內沒有紀錄，可切換「全臺」查看。":"搜尋後會在這裡顯示紀錄。"}</div>`;

  $$("[data-show]").forEach(b=>b.onclick=()=>{
    const [lat,lon]=b.dataset.show.split(",").map(Number);
    state.map.setView([lat,lon],15);
  });
  $$("[data-addrec]").forEach(b=>b.onclick=()=>addTrip({
    id:b.dataset.addrec,name:b.dataset.name,lat:+b.dataset.lat,lon:+b.dataset.lon,source:b.dataset.source||"occurrence"
  }));
}
function addAllVisibleToTrip(){
  const list=nearbyFiltered();
  if(!list.length){
    setStatus("目前沒有可加入行程的點位。");
    return;
  }

  let added=0;
  for(const r of list){
    const item={
      id:stableRecordId(r),
      name:locality(r),
      lat:getLat(r),
      lon:getLon(r),
      source:sourceName(r)
    };
    if(!state.trip.some(t=>t.id===item.id)){
      state.trip.push(item);
      added++;
    }
  }
  persist();
  renderTrip();
  setStatus(`已將目前篩選的 ${list.length} 個點位加入行程；新增 ${added} 個，略過 ${list.length-added} 個重複點位。`);
}
function rankCandidates(){
  if(!state.records.length){ state.candidates=[]; renderCandidates(); return; }
  const clusters=new Map();
  for(const r of state.records){
    const lat=getLat(r),lon=getLon(r),key=`${lat.toFixed(2)},${lon.toFixed(2)}`;
    if(!clusters.has(key)) clusters.set(key,[]);
    clusters.get(key).push(r);
  }
  state.candidates=[...clusters.entries()].map(([key,arr])=>{
    const lat=arr.reduce((s,r)=>s+getLat(r),0)/arr.length;
    const lon=arr.reduce((s,r)=>s+getLon(r),0)/arr.length;
    const years=arr.map(r=>Number(String(eventDate(r)).slice(0,4))).filter(Number.isFinite);
    const recent=years.length?Math.max(...years):0;
    const recency=Math.max(0,Math.min(25,(recent-2000)/26*25));
    const density=Math.min(50,arr.length*8);
    const dist=state.currentPos?distanceKm(state.currentPos,{lat,lon}):null;
    const access=dist==null?12:Math.max(0,25-Math.min(25,dist/2));
    return {
      id:key,name:locality(arr[0]),lat,lon,count:arr.length,recent,dist,
      score:Math.min(100,Math.round(density+recency+access)),
      sources:[...new Set(arr.map(sourceName))]
    };
  }).sort((a,b)=>b.score-a.score).slice(0,12);
  renderCandidates();
}
function renderCandidates(){
  $("#candidateList").innerHTML=state.candidates.length?state.candidates.map((c,i)=>`
    <article class="card">
      <div class="card-top">
        <div><h3>#${i+1} ${esc(c.name)}</h3><div class="meta">${c.count} 筆附近紀錄 · 最近 ${c.recent||"不明"}${c.dist!=null?` · ${c.dist.toFixed(1)} km`:``}<br>${esc((c.sources||[]).join(" + "))}</div></div>
        <div class="score">${c.score}</div>
      </div>
      <div class="actions">
        <button data-cshow="${c.lat},${c.lon}">看地圖</button>
        <a class="nav-link" href="${googleMapsNavUrl(c.lat,c.lon)}" target="_blank" rel="noopener">Google Maps 導航</a>
        <button data-cadd="${i}">加入行程</button>
      </div>
    </article>`).join(""):`<div class="empty">搜尋物種後才會產生候選探點。</div>`;
  $$("[data-cshow]").forEach(b=>b.onclick=()=>{
    const [lat,lon]=b.dataset.cshow.split(",").map(Number);
    state.map.setView([lat,lon],14);
  });
  $$("[data-cadd]").forEach(b=>b.onclick=()=>addTrip({...state.candidates[+b.dataset.cadd],source:"ranking"}));
}
function addTrip(x){
  if(!state.trip.some(t=>t.id===x.id)) state.trip.push(x);
  persist();renderTrip();setStatus(`已加入行程：${x.name}`);
}
function renderTrip(){
  $("#tripList").innerHTML=state.trip.length?state.trip.map((t,i)=>`
    <article class="card">
      <div class="card-top">
        <div><h3>${i+1}. ${esc(t.name)}</h3><div class="meta">${Number(t.lat).toFixed(5)}, ${Number(t.lon).toFixed(5)} · ${esc(t.source||"")}</div></div>
      </div>
      <div class="actions">
        <button data-tripshow="${t.lat},${t.lon}">看地圖</button>
        <a class="nav-link" href="${googleMapsNavUrl(t.lat,t.lon)}" target="_blank" rel="noopener">Google Maps 導航</a>
        <button data-remove="${i}">移除</button>
      </div>
    </article>`).join(""):`<div class="empty">尚未加入探點。</div>`;
  $$("[data-tripshow]").forEach(b=>b.onclick=()=>{
    const [lat,lon]=b.dataset.tripshow.split(",").map(Number);
    state.map.setView([lat,lon],15);
  });
  $$("[data-remove]").forEach(b=>b.onclick=()=>{state.trip.splice(+b.dataset.remove,1);persist();renderTrip();});
}
function renderSaved(){
  $("#savedList").innerHTML=state.saved.length?state.saved.map((r,i)=>`
    <article class="card ${state.editingRecordId===r.id?'record-editing':''}">
      <div class="card-top">
        <div>
          <h3>${esc(r.specimen)} · ${esc(r.taxon)}</h3>
          <div class="meta">${r.count} 隻 · ${esc(r.microhabitat)} · ${esc(r.method)}<br>${r.lat!=null?`${r.lat.toFixed(5)}, ${r.lon.toFixed(5)} · ±${Math.round(r.accuracy||0)} m`:"無 GPS"}<br>建立：${esc(r.createdAt||r.time||"")} ${r.updatedAt?`<br>更新：${esc(r.updatedAt)}`:""}</div>
          ${r.notes?`<div class="meta">${esc(r.notes)}</div>`:""}
        </div>
      </div>
      <div class="actions">
        <button type="button" data-edit-record="${i}">編輯</button>
        <button type="button" data-delete-record="${i}">刪除</button>
        ${r.lat!=null?`<button type="button" data-show-record="${r.lat},${r.lon}">地圖定位</button><a class="nav-link" href="${googleMapsNavUrl(r.lat,r.lon)}" target="_blank" rel="noopener">Google Maps 導航</a>`:""}
      </div>
    </article>`).join(""):`<div class="empty">尚未建立採集紀錄。</div>`;

  $$("[data-edit-record]").forEach(b=>b.onclick=()=>startEditRecord(+b.dataset.editRecord));
  $$("[data-delete-record]").forEach(b=>b.onclick=()=>deleteRecord(+b.dataset.deleteRecord));
  $$("[data-show-record]").forEach(b=>b.onclick=()=>{
    const [lat,lon]=b.dataset.showRecord.split(",").map(Number);
    state.map.setView([lat,lon],16);
    switchPanel("record");
  });
}

function startEditRecord(index){
  const r=state.saved[index];
  if(!r) return;

  state.editingRecordId=r.id;
  $("#specimenId").value=r.specimen||"";
  $("#count").value=r.count||1;
  $("#recordTaxon").value=r.taxon||"";
  $("#microhabitat").value=r.microhabitat||"地表／落葉層";
  $("#method").value=r.method||"手採";
  $("#notes").value=r.notes||"";

  state.capturePos=(r.lat!=null&&r.lon!=null)?{
    lat:Number(r.lat),
    lon:Number(r.lon),
    accuracy:Number(r.accuracy||0)
  }:null;

  $("#captureGpsText").textContent=state.capturePos
    ? `${state.capturePos.lat.toFixed(5)}, ${state.capturePos.lon.toFixed(5)} ±${Math.round(state.capturePos.accuracy)} m`
    : "尚未記錄 GPS";

  $("#saveRecordBtn").textContent="更新採集紀錄";
  $("#cancelEditBtn").classList.remove("hidden");
  renderSaved();
  switchPanel("record");
  $("#specimenId").focus();
  setStatus(`正在編輯：${r.specimen}`);
}

function cancelEditRecord(){
  state.editingRecordId=null;
  $("#fieldForm").reset();
  $("#count").value=1;
  $("#recordTaxon").value=$("#taxonInput").value.trim();
  state.capturePos=null;
  $("#captureGpsText").textContent="尚未記錄 GPS";
  $("#saveRecordBtn").textContent="儲存採集紀錄";
  $("#cancelEditBtn").classList.add("hidden");
  renderSaved();
  setStatus("已取消編輯。");
}

function deleteRecord(index){
  const r=state.saved[index];
  if(!r) return;
  if(!confirm(`確定刪除採集紀錄 ${r.specimen}？`)) return;

  const deletingId=r.id;
  state.saved.splice(index,1);
  if(state.editingRecordId===deletingId){
    state.editingRecordId=null;
    $("#fieldForm").reset();
    $("#count").value=1;
    $("#recordTaxon").value=$("#taxonInput").value.trim();
    state.capturePos=null;
    $("#captureGpsText").textContent="尚未記錄 GPS";
    $("#saveRecordBtn").textContent="儲存採集紀錄";
    $("#cancelEditBtn").classList.add("hidden");
  }
  persist();
  renderSaved();
  setStatus(`已刪除 ${r.specimen}。`);
}

function switchPanel(mode){
  $$(".chip").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  $$(".panel").forEach(p=>p.classList.add("hidden"));
  $(`#panel-${mode}`).classList.remove("hidden");
}
function captureGPS(){
  if(!navigator.geolocation){$("#captureGpsText").textContent="此瀏覽器不支援 GPS";return;}
  $("#captureGpsText").textContent="定位中…";
  navigator.geolocation.getCurrentPosition(pos=>{
    state.capturePos={lat:pos.coords.latitude,lon:pos.coords.longitude,accuracy:pos.coords.accuracy};
    $("#captureGpsText").textContent=`${state.capturePos.lat.toFixed(5)}, ${state.capturePos.lon.toFixed(5)} ±${Math.round(state.capturePos.accuracy)} m`;
  },e=>$("#captureGpsText").textContent="GPS 失敗："+e.message,{enableHighAccuracy:true,timeout:12000});
}
function download(name,type,text){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([text],{type}));
  a.download=name;
  document.body.appendChild(a);
  a.click();
  const href=a.href;
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
}
function exportGeoJSON(){
  const fc={type:"FeatureCollection",features:state.trip.map(t=>({
    type:"Feature",
    geometry:{type:"Point",coordinates:[+t.lon,+t.lat]},
    properties:{name:t.name,score:t.score??null,source:t.source??null}
  }))};
  download("fieldscout_trip.geojson","application/geo+json",JSON.stringify(fc,null,2));
}
function exportCSV(){
  const rows=[["name","latitude","longitude","score","source"],...state.trip.map(t=>[t.name,t.lat,t.lon,t.score??"",t.source??""])];
  download("fieldscout_trip.csv","text/csv;charset=utf-8","\ufeff"+rows.map(r=>r.map(csvEscape).join(",")).join("\n"));
}

function exportSearchGeoJSON(){
  if(!state.records.length){ setStatus("目前沒有搜尋點位可匯出。"); return; }
  const fc={
    type:"FeatureCollection",
    features:state.records.map(r=>({
      type:"Feature",
      geometry:{type:"Point",coordinates:[getLon(r),getLat(r)]},
      properties:{
        occurrence_id:r.occurrenceID||r.id||"",
        scientific_name:recordName(r),
        locality:locality(r),
        event_date:eventDate(r),
        source:sourceName(r),
        basis_of_record:r.basisOfRecord||"",
        coordinate_uncertainty_m:r.coordinateUncertaintyInMeters??"",
        source_url:r.sourceUrl||""
      }
    }))
  };
  download("fieldscout_search_points.geojson","application/geo+json",JSON.stringify(fc,null,2));
  setStatus(`已匯出 ${state.records.length} 筆搜尋點位 GeoJSON。`);
}
function exportSearchCSV(){
  if(!state.records.length){ setStatus("目前沒有搜尋點位可匯出。"); return; }
  const rows=[[
    "occurrence_id","scientific_name","locality","event_date","latitude","longitude",
    "source","basis_of_record","coordinate_uncertainty_m","source_url"
  ]];
  for(const r of state.records){
    rows.push([
      r.occurrenceID||r.id||"",
      recordName(r),
      locality(r),
      eventDate(r),
      getLat(r),
      getLon(r),
      sourceName(r),
      r.basisOfRecord||"",
      r.coordinateUncertaintyInMeters??"",
      r.sourceUrl||""
    ]);
  }
  download("fieldscout_search_points.csv","text/csv;charset=utf-8","\ufeff"+rows.map(r=>r.map(csvEscape).join(",")).join("\n"));
  setStatus(`已匯出 ${state.records.length} 筆搜尋點位 CSV。`);
}

function exportFieldRecordsGeoJSON(){
  if(!state.saved.length){ setStatus("目前沒有採集紀錄可匯出。"); return; }
  const fc={
    type:"FeatureCollection",
    features:state.saved.map(r=>({
      type:"Feature",
      geometry:(r.lat!=null&&r.lon!=null)?{type:"Point",coordinates:[Number(r.lon),Number(r.lat)]}:null,
      properties:{
        record_id:r.id||"",
        specimen_id:r.specimen||"",
        count:r.count??1,
        taxon:r.taxon||"",
        microhabitat:r.microhabitat||"",
        method:r.method||"",
        notes:r.notes||"",
        gps_accuracy_m:r.accuracy??"",
        created_at:r.createdAt||r.time||"",
        updated_at:r.updatedAt||""
      }
    }))
  };
  download("fieldscout_field_records.geojson","application/geo+json",JSON.stringify(fc,null,2));
  setStatus(`已匯出 ${state.saved.length} 筆採集紀錄 GeoJSON。`);
}
function exportFieldRecordsCSV(){
  if(!state.saved.length){ setStatus("目前沒有採集紀錄可匯出。"); return; }
  const rows=[[
    "record_id","specimen_id","count","taxon","microhabitat","method","notes",
    "latitude","longitude","gps_accuracy_m","created_at","updated_at"
  ]];
  for(const r of state.saved){
    rows.push([
      r.id||"",r.specimen||"",r.count??1,r.taxon||"",r.microhabitat||"",r.method||"",r.notes||"",
      r.lat??"",r.lon??"",r.accuracy??"",r.createdAt||r.time||"",r.updatedAt||""
    ]);
  }
  download("fieldscout_field_records.csv","text/csv;charset=utf-8","\ufeff"+rows.map(r=>r.map(csvEscape).join(",")).join("\n"));
  setStatus(`已匯出 ${state.saved.length} 筆採集紀錄 CSV。`);
}

window.addEventListener("online",()=>$("#netBadge").textContent="ONLINE");
window.addEventListener("offline",()=>$("#netBadge").textContent="OFFLINE");
$("#searchBtn").onclick=searchAll;
$("#taxonInput").addEventListener("keydown",e=>{if(e.key==="Enter")searchAll();});
$("#locateBtn").onclick=()=>locate(true);
$("#radiusSelect").onchange=renderRecords;
$("#addAllPointsBtn").onclick=addAllVisibleToTrip;
$("#searchGeojsonBtn").onclick=exportSearchGeoJSON;
$("#searchCsvBtn").onclick=exportSearchCSV;
$("#recordsGeojsonBtn").onclick=exportFieldRecordsGeoJSON;
$("#recordsCsvBtn").onclick=exportFieldRecordsCSV;
$("#rankBtn").onclick=rankCandidates;
$("#clearTripBtn").onclick=()=>{if(confirm("清空今日行程？")){state.trip=[];persist();renderTrip();}};
$("#geojsonBtn").onclick=exportGeoJSON;
$("#csvBtn").onclick=exportCSV;
$$(".chip").forEach(b=>b.onclick=()=>switchPanel(b.dataset.mode));
$("#captureGpsBtn").onclick=captureGPS;
$("#fieldForm").onsubmit=e=>{
  e.preventDefault();

  const now=new Date().toLocaleString("zh-TW");
  const payload={
    specimen:$("#specimenId").value.trim(),
    count:Math.max(1,+$("#count").value||1),
    taxon:$("#recordTaxon").value.trim()||$("#taxonInput").value.trim(),
    microhabitat:$("#microhabitat").value,
    method:$("#method").value,
    notes:$("#notes").value.trim(),
    lat:state.capturePos?.lat??null,
    lon:state.capturePos?.lon??null,
    accuracy:state.capturePos?.accuracy??null
  };

  if(state.editingRecordId){
    const idx=state.saved.findIndex(r=>r.id===state.editingRecordId);
    if(idx>=0){
      const old=state.saved[idx];
      state.saved[idx]={
        ...old,
        ...payload,
        id:old.id,
        createdAt:old.createdAt||old.time||now,
        updatedAt:now
      };
      setStatus(`已更新 ${payload.specimen}。`);
    }
  }else{
    state.saved.unshift({
      ...payload,
      id:(crypto.randomUUID?crypto.randomUUID():`record-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      createdAt:now,
      updatedAt:null
    });
    setStatus(`已儲存 ${payload.specimen}。`);
  }

  persist();
  state.editingRecordId=null;
  renderSaved();

  e.target.reset();
  $("#count").value=1;
  $("#recordTaxon").value=$("#taxonInput").value.trim();
  state.capturePos=null;
  $("#captureGpsText").textContent="尚未記錄 GPS";
  $("#saveRecordBtn").textContent="儲存採集紀錄";
  $("#cancelEditBtn").classList.add("hidden");
};

$("#cancelEditBtn").onclick=cancelEditRecord;

initMap();
renderTrip();
renderSaved();
renderCandidates();
renderRecords();
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js?v=0.3.0").catch(console.warn);
