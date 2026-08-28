import {put,get,del,byProfile,deleteProfileData,all} from "./db.js?v=0.9.6";
import {hashEmail,esc,haversineKm,googleMapsUrl,googleMapsRouteUrl,googleMapsRouteSegments,downloadText,toCSV,geojsonPoints,gpxWaypoints,gpxTrack,parseGpx,sanitizeImage,obscurePoint,qcRecord} from "./utils.js?v=0.9.6";
import {taxonomy,occurrences} from "./api.js?v=0.9.6";
import {rankCandidates} from "./ranking.js?v=0.9.6";

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state={
  profile:null,settings:null,map:null,cluster:null,tripLayer:null,me:null,currentPos:null,
  taxon:null,allRecords:[],filtered:[],markerMap:new Map(),candidates:[],
  trips:[],activeTrip:null,records:[],batchSite:null,recordGps:null,track:[],trackWatch:null,
  baseLayers:{},activeBaseLayer:null,offlineLayer:null,offlineArchive:null
};
const setStatus=t=>$("#status").textContent=t;

async function boot(){
  setupGate();
  setupStatic();
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(console.warn);
}

function setupGate(){
  $("#openProfileBtn").onclick=openProfile;
  $("#profileEmail").addEventListener("keydown",e=>{if(e.key==="Enter")openProfile()});
}
async function openProfile(){
  const email=$("#profileEmail").value.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    $("#profileError").textContent="請輸入有效電子郵件。";
    return;
  }

  const btn=$("#openProfileBtn");
  btn.disabled=true;
  btn.textContent="正在開啟…";
  $("#profileError").textContent="";

  try{
    const id=hashEmail(email),existing=await get("profiles",id);
    state.profile=existing||{id,email,createdAt:new Date().toISOString()};
    await put("profiles",{...state.profile,lastOpenedAt:new Date().toISOString()});

    state.settings=
      await get("settings",`${id}:settings`) ||
      {id:`${id}:settings`,profileId:id,specimenPrefix:"FS",specimenCounter:1};

    await put("settings",state.settings);
    await loadProfileData();

    // Enter the app before initializing optional map integrations.
    $("#profileGate").classList.add("hidden");
    $("#app").classList.remove("hidden");
    $("#profileLabel").textContent=email;
    $("#profileSummary").innerHTML=
      `${esc(email)}<br><span class="meta">本機 profile ID：${esc(id)}</span>`;
    $("#specimenPrefix").value=state.settings.specimenPrefix||"FS";
    $("#specimenCounter").value=state.settings.specimenCounter||1;

    try{
      if(!state.map)await initMap();
    }catch(mapError){
      console.error("Map initialization failed",mapError);
      $("#map").innerHTML=
        `<div class="map-load-error">地圖載入失敗，但 Local Profile 已成功開啟。<br><small>${esc(mapError.message||mapError)}</small></div>`;
      setStatus("Local Profile 已開啟；地圖插件載入失敗，請重新整理或檢查網路。");
    }

    renderAll();
  }catch(err){
    console.error("Open profile failed",err);
    $("#profileError").textContent=
      `無法開啟本機資料：${err.message||err}`;
  }finally{
    btn.disabled=false;
    btn.textContent="開啟 FieldScout";
  }
}
async function loadProfileData(){
  state.trips=(await byProfile("trips",state.profile.id)).sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||""));
  state.records=(await byProfile("records",state.profile.id)).sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||""));

  // One-time migration from v0.2–v0.6 localStorage.
  if(!state.settings.legacyMigrationChecked){
    let legacyTrip=[],legacyRecords=[];
    try{legacyTrip=JSON.parse(localStorage.getItem("fieldscout_trip")||"[]")}catch(_){}
    try{legacyRecords=JSON.parse(localStorage.getItem("fieldscout_records")||"[]")}catch(_){}

    if((legacyTrip.length||legacyRecords.length) &&
       confirm(`偵測到舊版 FieldScout 資料：${legacyTrip.length} 個行程點、${legacyRecords.length} 筆採集紀錄。\n\n要匯入目前 profile：${state.profile.email} 嗎？`)){
      if(legacyTrip.length){
        const now=new Date().toISOString();
        const trip={
          id:crypto.randomUUID(),profileId:state.profile.id,
          name:"Migrated legacy trip",date:now.slice(0,10),
          targetTaxon:"",status:"planned",notes:"由舊版 localStorage 自動匯入",
          points:legacyTrip.map((p,i)=>({
            id:String(p.id||`legacy-trip-${i}`),
            name:p.name||`Legacy point ${i+1}`,
            lat:Number(p.lat),lon:Number(p.lon),
            source:p.source||"legacy",visitStatus:"unvisited"
          })).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)),
          track:[],createdAt:now,updatedAt:now
        };
        await put("trips",trip);
      }

      for(let i=0;i<legacyRecords.length;i++){
        const r=legacyRecords[i],now=new Date().toISOString();
        await put("records",{
          id:String(r.id||crypto.randomUUID()),profileId:state.profile.id,
          specimenId:r.specimenId||r.specimen||`LEGACY-${i+1}`,
          count:Math.max(1,Number(r.count)||1),
          taxon:r.taxon||"",microhabitat:r.microhabitat||"",
          method:r.method||"",notes:r.notes||"",
          lat:r.lat==null?null:Number(r.lat),lon:r.lon==null?null:Number(r.lon),
          accuracyM:r.accuracyM??r.accuracy??null,
          batchSiteId:null,photoIds:[],
          createdAt:r.createdAt||r.time||now,
          updatedAt:r.updatedAt||r.time||now
        });
      }
      state.settings.legacyMigrationChecked=true;
      await put("settings",state.settings);
      setStatus("舊版資料已匯入目前 Local Profile。");
    }else{
      state.settings.legacyMigrationChecked=true;
      await put("settings",state.settings);
    }
  }

  state.trips=(await byProfile("trips",state.profile.id)).sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||""));
  state.records=(await byProfile("records",state.profile.id)).sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||""));
  state.activeTrip=state.trips[0]||null;
}

function setupStatic(){
  $$(".tab").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  $("#locateBtn").onclick=()=>locate(true);$("#customPointBtn").onclick=addCustomPoint;
  $("#basemapSelect").onchange=()=>selectBasemap($("#basemapSelect").value);
  $("#searchBtn").onclick=searchTaxon;$("#taxonInput").addEventListener("keydown",e=>{if(e.key==="Enter")searchTaxon()});
  let at=null;$("#taxonInput").addEventListener("input",()=>{clearTimeout(at);const q=$("#taxonInput").value.trim();if(q.length<2){$("#autocomplete").classList.add("hidden");return}at=setTimeout(()=>autocomplete(q),250)});
  $("#applyFiltersBtn").onclick=applyFilters;$("#resetFiltersBtn").onclick=resetFilters;$("#sortMode").onchange=applyFilters;
  $("#addAllBtn").onclick=addAllVisible;$("#rerankBtn").onclick=rerank;
  $("#searchCsvBtn").onclick=exportSearchCsv;$("#searchGeojsonBtn").onclick=exportSearchGeoJSON;
  $("#newTripBtn").onclick=newTrip;
  $("#tripSelect").onchange=()=>selectTrip($("#tripSelect").value);
  $("#saveTripMetaBtn").onclick=saveTripMeta;
  $("#deleteTripBtn").onclick=deleteTrip;
  $("#routeNorthSouthBtn").onclick=sortRouteNorthSouth;
  $("#routeDistanceBtn").onclick=sortRouteByDistance;
  $("#tripCsvBtn").onclick=exportTripCsv;$("#tripGeojsonBtn").onclick=exportTripGeoJSON;$("#tripGpxBtn").onclick=exportTripGpx;$("#gpxImport").onchange=importGpx;
  $("#trackStartBtn").onclick=startTrack;$("#trackStopBtn").onclick=stopTrack;$("#trackExportBtn").onclick=()=>downloadText("fieldscout_track.gpx","application/gpx+xml",gpxTrack(state.track));
  $("#batchSiteBtn").onclick=toggleBatchSite;$("#recordGpsBtn").onclick=captureRecordGps;$("#useBatchGpsBtn").onclick=useBatchGps;$("#nextSpecimenBtn").onclick=nextSpecimen;
  $("#recordForm").onsubmit=saveRecord;$("#cancelEditBtn").onclick=resetRecordForm;$("#recordsCsvBtn").onclick=exportRecordsCsv;$("#recordsGeojsonBtn").onclick=exportRecordsGeoJSON;$("#recordsSensitiveCsvBtn").onclick=exportSensitiveCsv;
  $("#saveSpecimenSettingsBtn").onclick=saveSpecimenSettings;
  $("#offlinePmtilesInput").onchange=importOfflinePmtiles;
  $("#removeOfflineMapBtn").onclick=removeOfflineMap;
  $("#backupBtn").onclick=exportBackup;$("#restoreInput").onchange=restoreBackup;
  $("#switchProfileBtn").onclick=switchProfile;$("#profileBtn").onclick=()=>switchTab("settings");$("#deleteProfileBtn").onclick=deleteProfile;
  $("#modalClose").onclick=()=>$("#modal").classList.add("hidden");$("#modal").onclick=e=>{if(e.target===$("#modal"))$("#modal").classList.add("hidden")};
  window.addEventListener("online",()=>$("#netBadge").textContent="ONLINE");window.addEventListener("offline",()=>$("#netBadge").textContent="OFFLINE");
}

function switchTab(name){
  $$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));$$(".tab-panel").forEach(p=>p.classList.add("hidden"));$(`#tab-${name}`).classList.remove("hidden");
  if(name==="dashboard")renderDashboard();if(name==="settings")renderOfflineInfo();
}

async function initMap(){
  state.map=L.map("map",{zoomControl:false}).setView([23.7,121],7);

  state.baseLayers.osm=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
  });

  state.baseLayers.topo=L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",{
    maxZoom:17,
    attribution:'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org/" target="_blank">OpenTopoMap</a> (CC-BY-SA)'
  });

  state.baseLayers.cyclosm=L.tileLayer("https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",{
    maxZoom:20,
    attribution:'&copy; OpenStreetMap contributors | <a href="https://www.cyclosm.org/" target="_blank">CyclOSM</a>'
  });

  state.activeBaseLayer=state.baseLayers.osm;
  state.activeBaseLayer.addTo(state.map);

  state.cluster=(typeof L.markerClusterGroup==="function")
    ? L.markerClusterGroup({showCoverageOnHover:false,spiderfyOnMaxZoom:true})
    : L.layerGroup();
  state.cluster.addTo(state.map);
  if(typeof L.markerClusterGroup!=="function"){
    console.warn("Leaflet.markercluster unavailable; using normal layer group.");
  }
  state.tripLayer=L.layerGroup().addTo(state.map);
  L.control.zoom({position:"topright"}).addTo(state.map);

  await restoreOfflineMap();
}

async function buildOfflineLayer(file,name="offline.pmtiles"){
  if(!window.pmtiles?.PMTiles || !window.pmtiles?.FileSource || !window.pmtiles?.leafletRasterLayer){
    throw new Error("PMTiles library 未載入。");
  }
  const realFile=file instanceof File
    ? file
    : new File([file],name,{type:"application/octet-stream",lastModified:Date.now()});
  const source=new window.pmtiles.FileSource(realFile);
  const archive=new window.pmtiles.PMTiles(source);

  // Reading the header validates that the archive is a PMTiles file before
  // creating the Leaflet layer.
  const header=await archive.getHeader();
  const layer=window.pmtiles.leafletRasterLayer(archive,{
    attribution:"Offline raster PMTiles"
  });

  state.offlineArchive={
    name:realFile.name,
    size:realFile.size,
    header
  };
  state.offlineLayer=layer;
  state.baseLayers.offline=layer;
  return layer;
}

async function restoreOfflineMap(){
  if(!state.profile)return;
  try{
    let saved=await get("cache",`${state.profile.id}:offline-map`);

    // One-time compatibility with the old v0.9.1/v0.9.4 v2 store.
    if(!saved){
      const legacy=await get("offlineMaps",`${state.profile.id}:offline`);
      if(legacy?.blob){
        saved={
          id:`${state.profile.id}:offline-map`,
          profileId:state.profile.id,
          kind:"offline-map",
          name:legacy.name,
          size:legacy.size,
          blob:legacy.blob,
          savedAt:legacy.savedAt||new Date().toISOString()
        };
        await put("cache",saved);
      }
    }

    if(!saved?.blob)return;
    await buildOfflineLayer(saved.blob,saved.name||"offline.pmtiles");
  }catch(e){
    console.warn("Offline PMTiles restore failed",e);
    state.offlineLayer=null;
    state.baseLayers.offline=null;
  }
}

async function importOfflinePmtiles(e){
  const file=e.target.files?.[0];
  if(!file)return;
  if(!file.name.toLowerCase().endsWith(".pmtiles")){
    setStatus("請選擇 .pmtiles 檔案。");
    e.target.value="";
    return;
  }

  setStatus(`正在檢查離線地圖：${file.name}…`);
  try{
    await buildOfflineLayer(file,file.name);
    await put("cache",{
      id:`${state.profile.id}:offline-map`,
      profileId:state.profile.id,
      kind:"offline-map",
      name:file.name,
      size:file.size,
      blob:file,
      savedAt:new Date().toISOString()
    });
    $("#basemapSelect").value="offline";
    selectBasemap("offline");
    renderOfflineInfo();
    setStatus(`離線 PMTiles 已儲存：${file.name} (${(file.size/1024/1024).toFixed(1)} MB)`);
  }catch(err){
    console.error(err);
    state.offlineLayer=null;
    state.baseLayers.offline=null;
    $("#basemapSelect").value="osm";
    selectBasemap("osm");
    setStatus("無法載入此 PMTiles。請確認它是 raster PMTiles："+err.message);
  }finally{
    e.target.value="";
  }
}

async function removeOfflineMap(){
  if(!state.profile)return;
  if(!confirm("移除此 Local Profile 儲存的離線 PMTiles？"))return;
  if(state.offlineLayer && state.map.hasLayer(state.offlineLayer)){
    state.map.removeLayer(state.offlineLayer);
  }
  await del("cache",`${state.profile.id}:offline-map`);
  // Remove old v2 location if it exists; get/del safely no-op when absent.
  await del("offlineMaps",`${state.profile.id}:offline`);
  state.offlineLayer=null;
  state.offlineArchive=null;
  state.baseLayers.offline=null;
  $("#basemapSelect").value="osm";
  selectBasemap("osm");
  renderOfflineInfo();
  setStatus("離線地圖已移除。");
}

function selectBasemap(kind){
  let next=state.baseLayers[kind];
  if(kind==="offline"&&!next){
    $("#basemapSelect").value="osm";
    next=state.baseLayers.osm;
    setStatus("尚未匯入離線 PMTiles。請到「設定 → 離線地圖」匯入 .pmtiles。");
    switchTab("settings");
  }

  if(state.activeBaseLayer && state.map.hasLayer(state.activeBaseLayer)){
    state.map.removeLayer(state.activeBaseLayer);
  }

  state.activeBaseLayer=next||state.baseLayers.osm;
  if(!state.map.hasLayer(state.activeBaseLayer))state.activeBaseLayer.addTo(state.map);
}

function locate(zoom){
  navigator.geolocation.getCurrentPosition(p=>{state.currentPos={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};if(state.me)state.map.removeLayer(state.me);state.me=L.circleMarker([state.currentPos.lat,state.currentPos.lon],{radius:9,weight:3}).addTo(state.map);if(zoom)state.map.setView([state.currentPos.lat,state.currentPos.lon],14);applyFilters();setStatus(`GPS ±${Math.round(state.currentPos.accuracy)} m`)},e=>setStatus("GPS："+e.message),{enableHighAccuracy:true,timeout:15000});
}

async function autocomplete(q){
  try{const x=await taxonomy(q);const l=x.suggestions||[];$("#autocomplete").innerHTML=l.map((r,i)=>`<button data-auto="${i}"><strong>${esc(r.commonName||r.scientificName)}</strong><div class="meta"><i>${esc(r.scientificName)}</i> · ${esc(r.rank||"")}</div></button>`).join("")||`<div class="empty">無建議</div>`;$("#autocomplete").classList.remove("hidden");$$("[data-auto]").forEach(b=>b.onclick=()=>{$("#taxonInput").value=l[+b.dataset.auto].scientificName;$("#autocomplete").classList.add("hidden")})}catch(_){}
}
async function searchTaxon(){
  const q=$("#taxonInput").value.trim();if(!q)return;
  $("#searchBtn").disabled=true;setStatus("正在同時查詢 TBIA、TBN、GBIF、iNaturalist…");
  try{
    const t=await taxonomy(q);state.taxon=t.best;renderTaxon();
    const o=await occurrences(state.taxon);state.allRecords=o.records||[];
    await put("cache",{
      id:`${state.profile.id}:occ:${state.taxon.scientificName.toLowerCase()}`,
      profileId:state.profile.id,query:q.toLowerCase(),taxon:state.taxon,
      records:state.allRecords,savedAt:new Date().toISOString()
    });
    applyFilters();
    updateSourceHealth(o.sourceStatus||{},o.sourceCounts||{});
    const tbnNote=o.tbn?.truncated?`（TBN 共 ${o.tbn.total} 筆，本次讀取前 ${o.tbn.fetched} 筆）`:"";
    setStatus(`整合 ${state.allRecords.length} 筆；TBIA ${o.sourceCounts.TBIA}、TBN ${o.sourceCounts.TBN}${o.sourceCounts["臺灣蛛式會社"]?`〔蛛式會社 ${o.sourceCounts["臺灣蛛式會社"]}〕`:""}${tbnNote}、GBIF ${o.sourceCounts.GBIF}、iNaturalist ${o.sourceCounts.iNaturalist}${o.warnings.length?`；本次不可用：${o.warnings.join(", ")}`:""}`);
  }catch(e){
    const caches=await byProfile("cache",state.profile.id);
    const key=q.toLowerCase();
    const hit=caches
      .filter(x=>x.query===key||String(x.taxon?.scientificName||"").toLowerCase()===key)
      .sort((a,b)=>String(b.savedAt).localeCompare(String(a.savedAt)))[0];
    if(hit){
      state.taxon=hit.taxon;state.allRecords=hit.records||[];
      renderTaxon();applyFilters();
      setStatus(`目前無法連線，已載入 ${new Date(hit.savedAt).toLocaleString("zh-TW")} 快取的 ${state.allRecords.length} 筆紀錄。`);
    }else{
      setStatus("搜尋失敗，且此物種尚無本機快取："+e.message);
    }
  }finally{$("#searchBtn").disabled=false}
}
function updateSourceHealth(status,counts){
  const box=$("#sourceHealth");
  box.classList.remove("hidden");
  const labels=[["TBIA","TBIA"],["TBN","TBN"],["GBIF","GBIF"],["iNaturalist","iNaturalist"]];
  box.innerHTML=labels.map(([key,label])=>{
    const s=status[key]||"skipped";
    const cls=s==="ok"?"ok":s==="unavailable"?"bad":"skip";
    const symbol=s==="ok"?"✓":s==="unavailable"?"×":"–";
    return `<span class="source-health-tag ${cls}">${esc(label)} ${symbol}${s==="ok"?` ${counts[key]??0}`:""}</span>`;
  }).join("");

  const sel=$("#filterSource");
  for(const opt of [...sel.options]){
    if(["TBIA","TBN"].includes(opt.value)){
      const unavailable=status[opt.value]==="unavailable";
      opt.hidden=unavailable;
      opt.disabled=unavailable;
      if(unavailable&&sel.value===opt.value)sel.value="";
    }
  }
  const spiderOpt=[...sel.options].find(o=>o.value==="臺灣蛛式會社");
  if(spiderOpt){
    const unavailable=status.TBN==="unavailable";
    spiderOpt.hidden=unavailable;
    spiderOpt.disabled=unavailable;
    if(unavailable&&sel.value==="臺灣蛛式會社")sel.value="";
  }
}

function renderTaxon(){
  const x=state.taxon;
  $("#taxonCard").classList.remove("hidden");
  $("#taxonCard").innerHTML=`
    <strong>${esc(x.commonName||x.scientificName)}</strong>
    <div><i>${esc(x.scientificName)}</i></div>
    <div class="meta">${esc([x.order,x.family,x.rank].filter(Boolean).join(" → "))}</div>
    ${x.tbnTaxonGroup?`<div class="meta">TBN 類群：${esc(x.tbnTaxonGroup)}${x.tbnSensitiveCategory?` · 敏感：${esc(x.tbnSensitiveCategory)}`:""}</div>`:""}
    <div class="source-tags">${(x.sources||[]).map(s=>`<span class="source-tag">${esc(s)}</span>`).join("")}</div>`;
}
function applyFilters(){
  let l=[...state.allRecords];const st=$("#filterStart").value,en=$("#filterEnd").value,mo=+$("#filterMonth").value,src=$("#filterSource").value,bas=$("#filterBasis").value,unc=+$("#filterUncertainty").value,photo=$("#filterPhoto").checked,rad=+$("#filterRadius").value;
  l=l.filter(r=>{const d=String(r.eventDate||"").slice(0,10);if(st&&d&&d<st)return false;if(en&&d&&d>en)return false;if(mo&&+d.slice(5,7)!==mo)return false;if(src&&!(r.sources||[]).includes(src))return false;if(bas&&!String(r.basisOfRecord||"").toUpperCase().includes(bas))return false;if(unc&&Number(r.uncertaintyM??Infinity)>unc)return false;if(photo&&!r.hasPhoto)return false;if(rad&&state.currentPos&&haversineKm(state.currentPos,{lat:r.lat,lon:r.lon})>rad)return false;return true});
  const mode=$("#sortMode").value;
  l.sort((a,b)=>mode==="date_desc"?String(b.eventDate).localeCompare(String(a.eventDate)):mode==="date_asc"?String(a.eventDate).localeCompare(String(b.eventDate)):mode==="uncertainty"?(a.uncertaintyM??Infinity)-(b.uncertaintyM??Infinity):mode==="source_count"?(b.sources?.length||0)-(a.sources?.length||0):state.currentPos?haversineKm(state.currentPos,{lat:a.lat,lon:a.lon})-haversineKm(state.currentPos,{lat:b.lat,lon:b.lon}):0);
  state.filtered=l;renderOccurrences();rerank();renderSeason();$("#resultMeta").textContent=`${l.length} / ${state.allRecords.length} 筆`;
}
function resetFilters(){["filterStart","filterEnd","filterMonth","filterRadius","filterSource","filterBasis","filterUncertainty"].forEach(id=>$("#"+id).value="");$("#filterPhoto").checked=false;applyFilters()}
function renderOccurrences(){
  if(state.cluster)state.cluster.clearLayers();
  state.markerMap.clear();
  const bounds=[];

  for(const r of state.filtered){
    if(!window.L||!state.cluster)break;
    const icon=L.divIcon({className:"occ-marker-wrap",html:`<span class="occ-marker-dot"></span>`,iconSize:[18,18],iconAnchor:[9,9]});
    const popupImage=(r.imageUrls||[])[0];
    const popupHtml=`
      ${popupImage?`<img src="${esc(popupImage)}" alt="" style="width:100%;max-height:130px;object-fit:cover;border-radius:8px;margin-bottom:7px">`:""}
      <b>${esc(r.commonName||r.scientificName)}</b><br>
      <span class="meta"><i>${esc(r.scientificName||"")}</i><br>${esc(r.locality||"")}<br>${esc(r.eventDate||"")}<br>${esc((r.sources||[]).join(" + "))}</span>
      <div class="popup-actions">
        <a class="popup-nav" href="${googleMapsUrl(r.lat,r.lon)}" target="_blank" rel="noopener">Google Maps 導航</a>
        <button type="button" data-popup-add>加入行程</button>
      </div>`;
    const m=L.marker([r.lat,r.lon],{icon}).bindPopup(popupHtml);
    m.on("click",()=>linkToCard(r.id));
    m.on("popupopen",e=>{
      const btn=e.popup.getElement()?.querySelector("[data-popup-add]");
      if(btn)btn.onclick=()=>addToTrip(r);
    });
    m.addTo(state.cluster);
    state.markerMap.set(r.id,m);
    bounds.push([r.lat,r.lon]);
  }

  if(bounds.length&&state.map)state.map.fitBounds(bounds,{padding:[20,20],maxZoom:12});

  $("#resultList").innerHTML=state.filtered.length
    ? state.filtered.slice(0,200).map((r,i)=>{
        const img=(r.imageUrls||[])[0];
        return `<article class="card" data-card="${esc(r.id)}">
          <div class="occ-card-layout">
            ${img
              ? `<div class="occ-thumb-wrap"><img class="occ-thumb" data-occ-thumb src="${esc(img)}" alt="${esc(r.commonName||r.scientificName||"occurrence")}"></div>`
              : `<div class="occ-card-no-image">No image</div>`}
            <div>
              <div class="card-top">
                <div>
                  <h3>${esc(r.commonName||r.scientificName)}</h3>
                  <div class="meta"><i>${esc(r.scientificName)}</i><br>${esc(r.locality||"")} · ${esc(r.eventDate||"")} ${r.uncertaintyM!=null?`· ±${Math.round(r.uncertaintyM)} m`:""}</div>
                  <div class="source-tags">${(r.sources||[]).map(s=>`<span class="source-tag">${esc(s)}</span>`).join("")}</div>
                  ${img?`<div class="source-media-note">${esc(r.mediaLicense||"原始資料圖片")}</div>`:""}
                </div>
              </div>
              <div class="actions">
                <button data-focus="${i}">地圖</button>
                <button data-detail="${i}">詳情${(r.imageUrls||[]).length?` / 圖片 ${(r.imageUrls||[]).length}`:""}</button>
                <a class="nav-link" target="_blank" rel="noopener" href="${googleMapsUrl(r.lat,r.lon)}">Google Maps</a>
                <button data-add="${i}">加入行程</button>
              </div>
            </div>
          </div>
        </article>`;
      }).join("")
    : `<div class="empty">無符合紀錄。</div>`;

  $$("[data-focus]").forEach(b=>b.onclick=()=>{
    const r=state.filtered[+b.dataset.focus];
    if(state.map)state.map.setView([r.lat,r.lon],16);
    state.markerMap.get(r.id)?.openPopup();
    highlightCard(r.id,false);
  });
  $$("[data-detail]").forEach(b=>b.onclick=()=>showOccurrenceDetail(state.filtered[+b.dataset.detail]));
  $$("[data-add]").forEach(b=>b.onclick=()=>addToTrip(state.filtered[+b.dataset.add]));
  $$("[data-occ-thumb]").forEach(img=>img.addEventListener("error",()=>{
    const wrap=img.closest(".occ-thumb-wrap");
    if(wrap)wrap.innerHTML='<div class="occ-card-no-image">Image unavailable</div>';
  },{once:true}));
}
function showOccurrenceDetail(r){
  const uniqueLinks=[...new Set((r.sourceUrls||[]).filter(Boolean))];
  const links=uniqueLinks.map((u,i)=>`<a class="nav-link" href="${esc(u)}" target="_blank" rel="noopener">${i===0?"原始紀錄":`來源 ${i+1}`}</a>`).join("");
  const images=[...new Set((r.imageUrls||[]).filter(Boolean))].slice(0,8);
  const gallery=images.length
    ? `<div class="source-image-gallery">${images.map((u,i)=>`
        <a href="${esc(u)}" target="_blank" rel="noopener" title="開啟原始圖片">
          <img src="${esc(u)}" alt="${esc(r.commonName||r.scientificName||"occurrence")} ${i+1}">
        </a>`).join("")}</div>
       <div class="meta">圖片授權：${esc(r.mediaLicense||"請以原始資料來源標示為準")}</div>`
    : `<div class="meta">此筆資料沒有可直接顯示的原始圖片。</div>`;

  showModal(`<h2>${esc(r.commonName||r.scientificName||"Occurrence")}</h2>
    ${gallery}
    <div class="summary-box">
      <div><i>${esc(r.scientificName||"")}</i></div>
      <div class="meta">
        地點：${esc(r.locality||"未提供")}<br>
        日期：${esc(r.eventDate||"未提供")}<br>
        座標：${r.lat.toFixed(6)}, ${r.lon.toFixed(6)}<br>
        座標誤差：${r.uncertaintyM!=null?`±${Math.round(r.uncertaintyM)} m`:"未提供"}<br>
        Basis：${esc(r.basisOfRecord||"未提供")}<br>
        來源：${esc((r.sources||[]).join(" + "))}
        ${r.datasetName?`<br>資料集：${esc(r.datasetName)}`:""}
        ${r.datasetUUID?`<br>Dataset UUID：${esc(r.datasetUUID)}`:""}
        ${r.datasetAuthor?`<br>資料集作者：${esc(r.datasetAuthor)}`:""}
        ${r.license?`<br>資料授權：${esc(r.license)}`:""}
        ${r.recordedBy?`<br>記錄者：${esc(r.recordedBy)}`:""}
        ${r.identificationVerificationStatus?`<br>鑑定狀態：${esc(r.identificationVerificationStatus)}`:""}
        ${r.minimumElevationM!=null?`<br>海拔：${Math.round(r.minimumElevationM)} m`:""}
        ${r.sensitiveCategory?`<br><strong>敏感資料：${esc(r.sensitiveCategory)}</strong>`:""}
        ${r.dataGeneralizations?`<br>座標／資料已由來源端泛化或模糊化`:""}
      </div>
      <div class="button-row">${links}<a class="nav-link" href="${googleMapsUrl(r.lat,r.lon)}" target="_blank" rel="noopener">Google Maps</a></div>
    </div>`);
}

function linkToCard(id){switchTab("explore");requestAnimationFrame(()=>highlightCard(id,true))}
function highlightCard(id,scroll){
  document.querySelectorAll(".card.highlight").forEach(x=>x.classList.remove("highlight"));
  const c=document.querySelector(`[data-card="${CSS.escape(id)}"]`);
  if(!c)return;

  c.classList.add("highlight");
  if(scroll){
    const pane=$("#contentPane");
    const paneRect=pane.getBoundingClientRect();
    const cardRect=c.getBoundingClientRect();
    const target=pane.scrollTop+(cardRect.top-paneRect.top)-8;
    pane.scrollTo({top:Math.max(0,target),behavior:"smooth"});
  }
  setTimeout(()=>c.classList.remove("highlight"),3200);
}
function renderSeason(){
  if(!state.allRecords.length){$("#seasonSummary").classList.add("hidden");return}
  const counts=Array(12).fill(0);state.allRecords.forEach(r=>{const m=+String(r.eventDate||"").slice(5,7);if(m>=1&&m<=12)counts[m-1]++});const max=Math.max(...counts),top=counts.map((v,i)=>[v,i+1]).sort((a,b)=>b[0]-a[0]).slice(0,3);
  $("#seasonSummary").classList.remove("hidden");$("#seasonSummary").innerHTML=`<strong>季節性摘要</strong><div class="meta">主要月份：${top.filter(x=>x[0]>0).map(x=>`${x[1]}月 (${x[0]})`).join("、")||"資料不足"}；目前月份 ${new Date().getMonth()+1} 月共有 ${counts[new Date().getMonth()]} 筆。</div>`
}
function rerank(){state.candidates=rankCandidates(state.filtered,state.currentPos,$("#filterMonth").value);renderCandidates()}
function candidateCard(c,i,featured=false){
  return `<article class="card">
    <div class="card-top">
      <div>
        <h3>${featured?`<span class="candidate-rank-badge">${c.rank}</span>`:`#${c.rank} `}${esc(c.name)}</h3>
        <div class="meta">${c.count} 筆 · 最新 ${c.newest||"?"} · 月份匹配 ${c.monthHits}/${c.count}${c.dist!=null?` · ${c.dist.toFixed(1)} km`:""} · median ±${Math.round(c.medianUnc)} m</div>
        <div class="source-tags">${c.sources.map(s=>`<span class="source-tag">${esc(s)}</span>`).join("")}</div>
      </div>
      <div class="score">${c.score}</div>
    </div>
    <div class="actions">
      <button data-cfocus="${i}">地圖</button>
      <a class="nav-link" target="_blank" rel="noopener" href="${googleMapsUrl(c.lat,c.lon)}">Google Maps</a>
      <button data-cadd="${i}">加入行程</button>
    </div>
  </article>`;
}

function renderCandidates(){
  const top=state.candidates.slice(0,5);
  const rest=state.candidates.slice(5);

  $("#candidateTopList").innerHTML=top.length
    ? top.map((c,i)=>candidateCard(c,i,true)).join("")
    : `<div class="empty">尚無候選樣點。</div>`;

  $("#candidateOtherList").innerHTML=rest.length
    ? rest.map((c,j)=>candidateCard(c,j+5,false)).join("")
    : `<div class="empty">沒有其他候選樣點。</div>`;

  $("#otherCandidateCount").textContent=`(${rest.length})`;
  $("#otherCandidatesBlock").classList.toggle("hidden",rest.length===0);

  $$("[data-cfocus]").forEach(b=>b.onclick=()=>{
    const c=state.candidates[+b.dataset.cfocus];
    if(state.map)state.map.setView([c.lat,c.lon],15);
  });
  $$("[data-cadd]").forEach(b=>b.onclick=()=>{
    const c=state.candidates[+b.dataset.cadd];
    addPointToTrip({...c,source:"ranking"});
  });
}

function normalizeTripPoint(p){
  const lat=Number(p?.lat),lon=Number(p?.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)){
    throw new Error("點位缺少有效經緯度");
  }
  return {
    ...p,
    id:String(p?.id||crypto.randomUUID()),
    name:String(p?.name||"FieldScout point"),
    lat,lon,
    source:String(p?.source||"unknown"),
    visitStatus:String(p?.visitStatus||"unvisited")
  };
}

function normalizeTrip(t){
  if(!t)return null;
  t.points=Array.isArray(t.points)
    ? t.points.map(p=>{
        try{return normalizeTripPoint(p)}catch(_){return null}
      }).filter(Boolean)
    : [];
  t.track=Array.isArray(t.track)?t.track:[];
  return t;
}

async function createDefaultTrip(){
  const now=new Date();
  const t={
    id:crypto.randomUUID(),
    profileId:state.profile.id,
    name:`Field Trip ${now.toLocaleDateString("zh-TW")}`,
    date:now.toISOString().slice(0,10),
    targetTaxon:state.taxon?.scientificName||"",
    status:"planned",
    notes:"",
    points:[],
    track:[],
    createdAt:now.toISOString(),
    updatedAt:now.toISOString()
  };
  await put("trips",t);
  state.trips.unshift(t);
  state.activeTrip=t;
  renderTrips();
  setStatus(`已自動建立行程「${t.name}」。`);
  return t;
}

async function ensureTrip(){
  if(state.activeTrip){
    state.activeTrip=normalizeTrip(state.activeTrip);
    return state.activeTrip;
  }

  if(state.trips.length){
    state.activeTrip=normalizeTrip(state.trips[0]);
    return state.activeTrip;
  }

  return await createDefaultTrip();
}

async function newTrip(){
  const proposed=`Field Trip ${new Date().toLocaleDateString("zh-TW")}`;
  const name=prompt("行程名稱",proposed);
  if(!name)return;

  const now=new Date();
  const t={
    id:crypto.randomUUID(),
    profileId:state.profile.id,
    name,
    date:now.toISOString().slice(0,10),
    targetTaxon:state.taxon?.scientificName||"",
    status:"planned",
    notes:"",
    points:[],
    track:[],
    createdAt:now.toISOString(),
    updatedAt:now.toISOString()
  };

  await put("trips",t);
  state.trips.unshift(t);
  state.activeTrip=t;
  renderTrips();
  setStatus(`已建立行程「${name}」。`);
}

function selectTrip(id){
  state.activeTrip=normalizeTrip(state.trips.find(t=>t.id===id)||null);
  renderTrips();
}

async function saveTrip(){
  if(!state.activeTrip)return;
  state.activeTrip=normalizeTrip(state.activeTrip);
  state.activeTrip.updatedAt=new Date().toISOString();
  await put("trips",state.activeTrip);

  const i=state.trips.findIndex(t=>t.id===state.activeTrip.id);
  if(i>=0)state.trips[i]=state.activeTrip;
}

async function saveTripMeta(){
  if(!state.activeTrip)return;
  state.activeTrip.targetTaxon=$("#tripTargetTaxon").value.trim();
  state.activeTrip.date=$("#tripDate").value;
  state.activeTrip.status=$("#tripStatus").value;
  state.activeTrip.notes=$("#tripNotes").value;
  await saveTrip();
  setStatus("行程資訊已儲存。");
}

async function deleteTrip(){
  if(!state.activeTrip||!confirm("刪除目前行程？"))return;
  await del("trips",state.activeTrip.id);
  state.trips=state.trips.filter(t=>t.id!==state.activeTrip.id);
  state.activeTrip=normalizeTrip(state.trips[0]||null);
  renderTrips();
}


async function sortRouteNorthSouth(){
  try{
    const t=await ensureTrip();
    t.points=(t.points||[]).slice().sort((a,b)=>Number(b.lat)-Number(a.lat));
    await saveTrip();
    renderTrips();
    setStatus("行程已依北 → 南重新排序。");
  }catch(e){
    setStatus(`路線排序失敗：${e.message}`);
  }
}

async function sortRouteByDistance(){
  try{
    const t=await ensureTrip();

    const doSort=async pos=>{
      state.currentPos=pos;
      t.points=(t.points||[]).slice().sort((a,b)=>
        haversineKm(pos,{lat:Number(a.lat),lon:Number(a.lon)})-
        haversineKm(pos,{lat:Number(b.lat),lon:Number(b.lon)})
      );
      await saveTrip();
      renderTrips();
      setStatus("行程已依目前位置由近 → 遠重新排序。");
    };

    if(state.currentPos){
      await doSort(state.currentPos);
      return;
    }

    if(!navigator.geolocation)throw new Error("此瀏覽器不支援 GPS");

    navigator.geolocation.getCurrentPosition(
      p=>doSort({
        lat:p.coords.latitude,
        lon:p.coords.longitude,
        accuracy:p.coords.accuracy
      }).catch(e=>setStatus(`路線排序失敗：${e.message}`)),
      e=>setStatus(`需要目前位置才能依距離排序：${e.message}`),
      {enableHighAccuracy:true,timeout:15000}
    );
  }catch(e){
    setStatus(`路線排序失敗：${e.message}`);
  }
}

function renderTrips(){
  state.trips=state.trips.map(t=>normalizeTrip(t));
  if(state.activeTrip)state.activeTrip=normalizeTrip(state.activeTrip);

  $("#tripSelect").innerHTML=
    `<option value="">選擇行程</option>`+
    state.trips.map(t=>`<option value="${esc(t.id)}">${esc(t.name||"Unnamed trip")}</option>`).join("");

  if(state.activeTrip)$("#tripSelect").value=state.activeTrip.id;

  const t=state.activeTrip,pts=t?.points||[];
  $("#tripTargetTaxon").value=t?.targetTaxon||"";
  $("#tripDate").value=t?.date||"";
  $("#tripStatus").value=t?.status||"planned";
  $("#tripNotes").value=t?.notes||"";
  $("#tripMeta").textContent=t?`${pts.length} 個採集目標 · ${t.status||"planned"}`:"尚未選擇";

  renderRoutePlanner(t);

  $("#tripPointList").innerHTML=pts.length
    ? pts.map((p,i)=>`
      <article class="card">
        <div class="card-top">
          <div>
            <h3>${String.fromCharCode(65+(i%26))}. ${esc(p.name||"Point")}</h3>
            <div class="meta">
              ${Number(p.lat).toFixed(5)}, ${Number(p.lon).toFixed(5)}
              · ${esc(p.source||"")}
              · ${esc(p.visitStatus||"unvisited")}
            </div>
          </div>
        </div>
        <div class="actions">
          <button data-tfocus="${i}">地圖</button>
          <a class="nav-link" target="_blank" rel="noopener" href="${googleMapsUrl(p.lat,p.lon)}">導航此點</a>
          <button data-tvisit="${i}">狀態</button>
          <button data-tup="${i}">上移</button>
          <button data-tdown="${i}">下移</button>
          <button data-tremove="${i}">移除</button>
        </div>
      </article>`).join("")
    : `<div class="empty">先從「探索」頁把想去的點加入行程。</div>`;

  if(state.tripLayer && window.L){
    state.tripLayer.clearLayers();
    if(pts.length>1){
      L.polyline(pts.map(p=>[Number(p.lat),Number(p.lon)]),{weight:3}).addTo(state.tripLayer);
    }
    pts.forEach((p,i)=>{
      L.marker([Number(p.lat),Number(p.lon)])
        .bindPopup(`${String.fromCharCode(65+(i%26))}. ${esc(p.name||"Point")}`)
        .addTo(state.tripLayer);
    });
  }

  $$("[data-tfocus]").forEach(b=>b.onclick=()=>{
    const p=pts[+b.dataset.tfocus];
    if(state.map)state.map.setView([p.lat,p.lon],16);
  });

  $$("[data-tremove]").forEach(b=>b.onclick=async()=>{
    pts.splice(+b.dataset.tremove,1);
    await saveTrip();
    renderTrips();
    setStatus("已從行程移除點位。");
  });

  $$("[data-tup]").forEach(b=>b.onclick=async()=>{
    const i=+b.dataset.tup;
    if(i<=0)return;
    [pts[i-1],pts[i]]=[pts[i],pts[i-1]];
    await saveTrip();
    renderTrips();
    setStatus("已調整路線順序。");
  });

  $$("[data-tdown]").forEach(b=>b.onclick=async()=>{
    const i=+b.dataset.tdown;
    if(i>=pts.length-1)return;
    [pts[i],pts[i+1]]=[pts[i+1],pts[i]];
    await saveTrip();
    renderTrips();
    setStatus("已調整路線順序。");
  });

  $$("[data-tvisit]").forEach(b=>b.onclick=async()=>{
    const p=pts[+b.dataset.tvisit];
    const order=["unvisited","arrived","surveyed","inaccessible","revisit"];
    p.visitStatus=order[(order.indexOf(p.visitStatus||"unvisited")+1)%order.length];
    if(p.visitStatus==="arrived"){
      p.arrivalAt=new Date().toISOString();
      if(state.currentPos){
        p.arrivalLat=state.currentPos.lat;
        p.arrivalLon=state.currentPos.lon;
        p.arrivalDistanceM=Math.round(haversineKm(state.currentPos,p)*1000);
      }
    }
    await saveTrip();
    renderTrips();
  });
}

function renderRoutePlanner(t){
  const box=$("#routePlannerCard");
  const pts=t?.points||[];

  if(!t||!pts.length){
    box.innerHTML=`<div class="route-empty">加入採集目標後，這裡會生成導航路線。</div>`;
    return;
  }

  const segments=googleMapsRouteSegments(pts,10);
  const mainUrl=googleMapsRouteUrl(segments[0]);

  const stopHtml=pts.map((p,i)=>`
    <div class="route-stop">
      <div class="route-index">${String.fromCharCode(65+(i%26))}</div>
      <div>
        <div class="route-stop-name">${esc(p.name||"Point")}</div>
        <div class="route-stop-meta">${Number(p.lat).toFixed(5)}, ${Number(p.lon).toFixed(5)} · ${esc(p.visitStatus||"unvisited")}</div>
      </div>
    </div>`).join("");

  const segmentHtml=segments.length>1
    ? `<div class="route-segments">
        ${segments.map((seg,i)=>`
          <div class="route-segment">
            <span>路線 ${i+1} · ${seg.length} 個點</span>
            <a class="nav-link route-primary" target="_blank" rel="noopener" href="${googleMapsRouteUrl(seg)}">開啟 Google Maps</a>
          </div>`).join("")}
      </div>`
    : "";

  box.innerHTML=`
    <div class="route-head">
      <div>
        <h3>${esc(t.name||"本次採集行程")}</h3>
        <div class="route-count">${pts.length} 個採集目標 · 依目前排列順序導航</div>
      </div>
      ${segments.length===1
        ? `<a class="nav-link route-primary" target="_blank" rel="noopener" href="${mainUrl}">
             ${pts.length===1?"導航到此點":"開始多點導航"}
           </a>`
        : `<span class="meta">點位較多，已分成 ${segments.length} 段</span>`}
    </div>
    <div class="route-path">${stopHtml}</div>
    ${segmentHtml}
    <div class="meta">
      Google Maps 會以目前位置作為起點；最後一個點為目的地，其餘依 FieldScout 的 A → B → C 順序作為中途點。
      可用下方「上移／下移」調整採集順序。
    </div>`;
}

async function addToTrip(r){
  return addPointToTrip({
    id:r.id,
    name:r.locality||r.commonName||r.scientificName||"Occurrence",
    lat:r.lat,
    lon:r.lon,
    source:(r.sources||[]).join("+")||"occurrence",
    visitStatus:"unvisited"
  });
}

async function addPointToTrip(rawPoint){
  try{
    const t=await ensureTrip();
    const p=normalizeTripPoint(rawPoint);
    t.points=Array.isArray(t.points)?t.points:[];

    const duplicate=t.points.find(x=>
      String(x.id)===String(p.id) ||
      (
        Math.abs(Number(x.lat)-p.lat)<1e-7 &&
        Math.abs(Number(x.lon)-p.lon)<1e-7 &&
        String(x.name||"")===String(p.name||"")
      )
    );

    if(duplicate){
      setStatus(`此點已在行程「${t.name}」中。`);
      return false;
    }

    t.points.push(p);
    state.activeTrip=t;
    await saveTrip();
    renderTrips();
    setStatus(`已加入「${p.name}」→ ${t.name}（目前 ${t.points.length} 點）。`);
    return true;
  }catch(e){
    console.error("Add to trip failed",e);
    setStatus(`加入行程失敗：${e.message}`);
    return false;
  }
}

async function addAllVisible(){
  try{
    const t=await ensureTrip();
    t.points=Array.isArray(t.points)?t.points:[];
    let n=0,skipped=0;

    for(const r of state.filtered){
      let p;
      try{
        p=normalizeTripPoint({
          id:r.id,
          name:r.locality||r.commonName||r.scientificName||"Occurrence",
          lat:r.lat,lon:r.lon,
          source:(r.sources||[]).join("+")||"occurrence",
          visitStatus:"unvisited"
        });
      }catch(_){
        skipped++;
        continue;
      }

      const duplicate=t.points.some(x=>
        String(x.id)===String(p.id) ||
        (
          Math.abs(Number(x.lat)-p.lat)<1e-7 &&
          Math.abs(Number(x.lon)-p.lon)<1e-7 &&
          String(x.name||"")===String(p.name||"")
        )
      );

      if(duplicate){skipped++;continue}
      t.points.push(p);n++;
    }

    state.activeTrip=t;
    await saveTrip();
    renderTrips();
    setStatus(`已加入 ${n} 點至「${t.name}」${skipped?`；略過 ${skipped} 筆重複／無效點`:""}。`);
  }catch(e){
    console.error("Bulk add failed",e);
    setStatus(`全部加入失敗：${e.message}`);
  }
}

async function addCustomPoint(){
  try{
    const c=state.map.getCenter();
    const name=prompt("自訂點名稱","自訂探點");
    if(!name)return;
    await addPointToTrip({
      id:crypto.randomUUID(),
      name,
      lat:c.lat,
      lon:c.lng,
      source:"custom",
      visitStatus:"unvisited"
    });
  }catch(e){
    setStatus(`新增自訂點失敗：${e.message}`);
  }
}

function exportTripCsv(){const pts=state.activeTrip?.points||[],rows=[["order","name","latitude","longitude","source","visitStatus","arrivalAt","arrivalDistanceM"]];pts.forEach((p,i)=>rows.push([i+1,p.name,p.lat,p.lon,p.source,p.visitStatus,p.arrivalAt||"",p.arrivalDistanceM||""]));downloadText("fieldscout_trip.csv","text/csv;charset=utf-8",toCSV(rows))}
function exportTripGeoJSON(){downloadText("fieldscout_trip.geojson","application/geo+json",JSON.stringify(geojsonPoints(state.activeTrip?.points||[],p=>({name:p.name,source:p.source,visitStatus:p.visitStatus})),null,2))}
function exportTripGpx(){downloadText("fieldscout_trip.gpx","application/gpx+xml",gpxWaypoints(state.activeTrip?.points||[],state.activeTrip?.name||"FieldScout Trip"))}
async function importGpx(e){
  const f=e.target.files?.[0];
  if(!f)return;
  try{
    const t=await ensureTrip();
    t.points=Array.isArray(t.points)?t.points:[];
    const imported=parseGpx(await f.text()).map(normalizeTripPoint);
    t.points.push(...imported);
    state.activeTrip=t;
    await saveTrip();
    renderTrips();
    setStatus(`GPX 已匯入 ${imported.length} 個 waypoint。`);
  }catch(err){
    console.error(err);
    setStatus(`GPX 匯入失敗：${err.message}`);
  }finally{
    e.target.value="";
  }
}
function startTrack(){state.track=[];$("#trackStartBtn").disabled=true;$("#trackStopBtn").disabled=false;state.trackWatch=navigator.geolocation.watchPosition(p=>{state.track.push({lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy,time:Date.now()});$("#trackMeta").textContent=`${state.track.length} 點 · ±${Math.round(p.coords.accuracy)} m`},e=>setStatus(e.message),{enableHighAccuracy:true,maximumAge:0,timeout:20000})}
async function stopTrack(){if(state.trackWatch!=null)navigator.geolocation.clearWatch(state.trackWatch);state.trackWatch=null;$("#trackStartBtn").disabled=false;$("#trackStopBtn").disabled=true;if(state.activeTrip){state.activeTrip.track=[...state.track];await saveTrip()}}

function toggleBatchSite(){if(state.batchSite){state.batchSite=null;$("#batchSiteBox").classList.add("hidden");$("#batchSiteBtn").textContent="開始採集點";return}navigator.geolocation.getCurrentPosition(p=>{state.batchSite={id:crypto.randomUUID(),startedAt:new Date().toISOString(),lat:p.coords.latitude,lon:p.coords.longitude,accuracyM:p.coords.accuracy};$("#batchSiteBox").classList.remove("hidden");$("#batchSiteBox").innerHTML=`<strong>採集點進行中</strong><div class="meta">${state.batchSite.lat.toFixed(5)}, ${state.batchSite.lon.toFixed(5)} · ±${Math.round(state.batchSite.accuracyM)} m · ${new Date(state.batchSite.startedAt).toLocaleString("zh-TW")}</div>`;$("#batchSiteBtn").textContent="結束採集點"})}
function useBatchGps(){if(!state.batchSite){setStatus("尚未開始採集點。");return}state.recordGps={lat:state.batchSite.lat,lon:state.batchSite.lon,accuracyM:state.batchSite.accuracyM};renderRecordGps()}
function captureRecordGps(){navigator.geolocation.getCurrentPosition(p=>{state.recordGps={lat:p.coords.latitude,lon:p.coords.longitude,accuracyM:p.coords.accuracy};renderRecordGps()},e=>setStatus(e.message),{enableHighAccuracy:true,timeout:15000})}
function renderRecordGps(){if(!state.recordGps){$("#recordGpsText").textContent="尚未取得 GPS";$("#recordGpsAcc").textContent="";return}$("#recordGpsText").textContent=`${state.recordGps.lat.toFixed(5)}, ${state.recordGps.lon.toFixed(5)}`;$("#recordGpsAcc").textContent=`±${Math.round(state.recordGps.accuracyM)} m`}
async function nextSpecimen(){const p=state.settings.specimenPrefix||"FS",n=state.settings.specimenCounter||1;$("#specimenId").value=`${p}${String(n).padStart(5,"0")}`;state.settings.specimenCounter=n+1;$("#specimenCounter").value=state.settings.specimenCounter;await put("settings",state.settings)}
async function saveRecord(e){
  e.preventDefault();const id=$("#recordId").value||crypto.randomUUID(),old=state.records.find(r=>r.id===id);const files=[...$("#recordPhotos").files],photoIds=[...(old?.photoIds||[])];
  for(const f of files){const blob=await sanitizeImage(f),pid=crypto.randomUUID();await put("photos",{id:pid,profileId:state.profile.id,recordId:id,blob,createdAt:new Date().toISOString()});photoIds.push(pid)}
  const r={id,profileId:state.profile.id,specimenId:$("#specimenId").value.trim(),count:Math.max(1,+$("#recordCount").value||1),taxon:$("#recordTaxon").value.trim(),microhabitat:$("#microhabitat").value,method:$("#method").value,notes:$("#recordNotes").value.trim(),lat:state.recordGps?.lat??old?.lat??null,lon:state.recordGps?.lon??old?.lon??null,accuracyM:state.recordGps?.accuracyM??old?.accuracyM??null,batchSiteId:state.batchSite?.id||old?.batchSiteId||null,photoIds,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  await put("records",r);state.records=state.records.filter(x=>x.id!==id);state.records.unshift(r);resetRecordForm();renderRecords();renderDashboard();setStatus("採集紀錄已儲存。")
}
function resetRecordForm(){$("#recordForm").reset();$("#recordCount").value=1;$("#recordId").value="";state.recordGps=null;renderRecordGps();$("#saveRecordBtn").textContent="儲存紀錄";$("#cancelEditBtn").classList.add("hidden")}
async function editRecord(r){switchTab("records");$("#recordId").value=r.id;$("#specimenId").value=r.specimenId;$("#recordCount").value=r.count;$("#recordTaxon").value=r.taxon||"";$("#microhabitat").value=r.microhabitat;$("#method").value=r.method;$("#recordNotes").value=r.notes||"";if(r.lat!=null)state.recordGps={lat:r.lat,lon:r.lon,accuracyM:r.accuracyM||0};renderRecordGps();$("#saveRecordBtn").textContent="更新紀錄";$("#cancelEditBtn").classList.remove("hidden")}
async function deleteRecord(id){if(!confirm("刪除此紀錄？"))return;await del("records",id);const photos=(await byProfile("photos",state.profile.id)).filter(p=>p.recordId===id);for(const p of photos)await del("photos",p.id);state.records=state.records.filter(r=>r.id!==id);renderRecords()}
function renderRecords(){
  $("#recordMeta").textContent=`${state.records.length} 筆`;
  $("#recordList").innerHTML=state.records.length?state.records.map((r,i)=>{const issues=qcRecord(r,state.records);return `<article class="card"><h3>${esc(r.specimenId)} · ${esc(r.taxon||"未定名")}</h3><div class="meta">${r.count} 個體 · ${esc(r.microhabitat)} · ${esc(r.method)}<br>${r.lat!=null?`${r.lat.toFixed(5)}, ${r.lon.toFixed(5)} · ±${Math.round(r.accuracyM||0)} m`:"無 GPS"}<br>${new Date(r.updatedAt).toLocaleString("zh-TW")}</div>${issues.length?`<div class="meta warning">QC：${esc(issues.join("；"))}</div>`:`<div class="meta ok">QC PASS</div>`}<div class="actions"><button data-redit="${i}">編輯</button><button data-rdel="${i}">刪除</button>${r.lat!=null?`<button data-rfocus="${i}">地圖</button><a class="nav-link" target="_blank" href="${googleMapsUrl(r.lat,r.lon)}">Google Maps</a>`:""}${r.photoIds?.length?`<button data-rphotos="${i}">照片 ${r.photoIds.length}</button>`:""}</div></article>`}).join(""):`<div class="empty">尚無採集紀錄。</div>`;
  $$("[data-redit]").forEach(b=>b.onclick=()=>editRecord(state.records[+b.dataset.redit]));$$("[data-rdel]").forEach(b=>b.onclick=()=>deleteRecord(state.records[+b.dataset.rdel].id));$$("[data-rfocus]").forEach(b=>b.onclick=()=>{const r=state.records[+b.dataset.rfocus];switchTab("explore");state.map.setView([r.lat,r.lon],16)});$$("[data-rphotos]").forEach(b=>b.onclick=()=>showPhotos(state.records[+b.dataset.rphotos]))
}
async function showPhotos(r){const ps=(await byProfile("photos",state.profile.id)).filter(p=>r.photoIds.includes(p.id));const urls=ps.map(p=>URL.createObjectURL(p.blob));showModal(`<h2>${esc(r.specimenId)}</h2><div class="photo-grid">${urls.map(u=>`<img src="${u}">`).join("")}</div>`)}
function exportRecordsCsv(){const rows=[["id","specimenId","count","taxon","microhabitat","method","notes","latitude","longitude","accuracyM","createdAt","updatedAt"]];state.records.forEach(r=>rows.push([r.id,r.specimenId,r.count,r.taxon,r.microhabitat,r.method,r.notes,r.lat??"",r.lon??"",r.accuracyM??"",r.createdAt,r.updatedAt]));downloadText("fieldscout_records.csv","text/csv;charset=utf-8",toCSV(rows))}
function exportRecordsGeoJSON(){downloadText("fieldscout_records.geojson","application/geo+json",JSON.stringify(geojsonPoints(state.records,r=>({specimenId:r.specimenId,count:r.count,taxon:r.taxon,microhabitat:r.microhabitat,method:r.method,notes:r.notes,accuracyM:r.accuracyM})),null,2))}
function exportSensitiveCsv(){const radius=+prompt("座標模糊半徑（公尺）","1000")||1000,rows=[["specimenId","taxon","latitude","longitude","obscureRadiusM"]];state.records.forEach(r=>{if(r.lat==null)return;const p=obscurePoint(r.lat,r.lon,radius,`${state.profile.id}:${r.id}`);rows.push([r.specimenId,r.taxon,p.lat,p.lon,radius])});downloadText("fieldscout_records_obscured.csv","text/csv;charset=utf-8",toCSV(rows))}

function exportSearchCsv(){
  const rows=[[
    "id","scientificName","commonName","locality","eventDate","latitude","longitude",
    "sources","basisOfRecord","uncertaintyM","hasPhoto",
    "datasetUUID","datasetName","datasetURL","license","mediaLicense",
    "sensitiveCategory","dataGeneralizations","imageUrls","sourceUrls"
  ]];
  state.filtered.forEach(r=>rows.push([
    r.id,r.scientificName,r.commonName,r.locality,r.eventDate,r.lat,r.lon,
    (r.sources||[]).join("|"),r.basisOfRecord,r.uncertaintyM??"",r.hasPhoto,
    r.datasetUUID||"",r.datasetName||"",r.datasetURL||"",r.license||"",r.mediaLicense||"",
    r.sensitiveCategory||"",!!r.dataGeneralizations,(r.imageUrls||[]).join("|"),(r.sourceUrls||[]).join("|")
  ]));
  downloadText("fieldscout_occurrences.csv","text/csv;charset=utf-8",toCSV(rows));
}
function exportSearchGeoJSON(){
  downloadText("fieldscout_occurrences.geojson","application/geo+json",JSON.stringify(
    geojsonPoints(state.filtered,r=>({
      scientificName:r.scientificName,commonName:r.commonName,locality:r.locality,
      eventDate:r.eventDate,sources:r.sources,basisOfRecord:r.basisOfRecord,
      uncertaintyM:r.uncertaintyM,hasPhoto:r.hasPhoto,
      datasetUUID:r.datasetUUID||"",datasetName:r.datasetName||"",
      datasetURL:r.datasetURL||"",license:r.license||"",mediaLicense:r.mediaLicense||"",
      sensitiveCategory:r.sensitiveCategory||"",
      dataGeneralizations:!!r.dataGeneralizations,
      imageUrls:r.imageUrls||[],
      sourceUrls:r.sourceUrls||[]
    })),null,2
  ));
}

async function saveSpecimenSettings(){state.settings.specimenPrefix=$("#specimenPrefix").value.trim()||"FS";state.settings.specimenCounter=Math.max(1,+$("#specimenCounter").value||1);await put("settings",state.settings);setStatus("編號設定已儲存。")}
function renderDashboard(){
  const visited=state.trips.flatMap(t=>t.points||[]).filter(p=>["arrived","surveyed","revisit"].includes(p.visitStatus)).length,totalPts=state.trips.reduce((s,t)=>s+(t.points?.length||0),0);
  const taxa=new Set(state.records.map(r=>r.taxon).filter(Boolean));const acc=state.records.map(r=>Number(r.accuracyM)).filter(Number.isFinite).sort((a,b)=>a-b),med=acc.length?acc[Math.floor(acc.length/2)]:null;
  $("#dashboardCards").innerHTML=`<div class="dashboard-card"><span class="meta">Trips</span><strong>${state.trips.length}</strong></div><div class="dashboard-card"><span class="meta">Trip points</span><strong>${totalPts}</strong><span class="meta">${visited} 已到訪</span></div><div class="dashboard-card"><span class="meta">Field records</span><strong>${state.records.length}</strong></div><div class="dashboard-card"><span class="meta">Taxa</span><strong>${taxa.size}</strong>${med!=null?`<span class="meta">GPS median ±${Math.round(med)} m</span>`:""}</div>`;
  const counts=Array(12).fill(0);
  state.allRecords.forEach(r=>{
    const m=+String(r.eventDate||"").slice(5,7);
    if(m>=1&&m<=12)counts[m-1]++;
  });
  const mx=Math.max(1,...counts),selected=Number($("#filterMonth").value)||0;
  $("#monthChart").innerHTML=counts.map((v,i)=>`
    <button type="button" class="month-bar-wrap ${selected===i+1?"selected":""}" data-month-filter="${i+1}" aria-label="${i+1} 月，共 ${v} 筆紀錄">
      <span class="month-count">${v}</span>
      <span class="month-bar" style="height:${Math.max(3,100*v/mx)}%"></span>
      <span class="month-label">${i+1}月</span>
    </button>`).join("");

  $$("[data-month-filter]").forEach(b=>b.onclick=()=>{
    const month=Number(b.dataset.monthFilter);
    $("#filterMonth").value=(Number($("#filterMonth").value)===month)?"":String(month);
    switchTab("explore");
    applyFilters();
    setStatus($("#filterMonth").value?`已套用 ${month} 月篩選。再次點同月份可取消。`:"已取消月份篩選。");
  });

  const issues=state.records.flatMap(r=>qcRecord(r,state.records).map(x=>`${r.specimenId}: ${x}`));$("#qcList").innerHTML=issues.length?`<strong>${issues.length} 個提醒</strong><div class="meta warning">${issues.slice(0,30).map(esc).join("<br>")}</div>`:`<strong class="ok">QC PASS</strong>`;
}
function renderOfflineInfo(){
  const offline=state.offlineArchive;
  $("#offlineInfo").innerHTML=`
    <strong>${navigator.onLine?"目前 Online":"目前 Offline"}</strong><br>
    <span class="meta">
      App shell、Trips、records、photos 使用本機快取／IndexedDB。<br>
      ${offline
        ? `離線地圖：${esc(offline.name)} · ${(offline.size/1024/1024).toFixed(1)} MB · 已可使用`
        : "離線地圖：尚未匯入。請選擇一個 raster .pmtiles 檔。"}
    </span>`;
}

async function exportBackup(){
  const photos=(await byProfile("photos",state.profile.id));const photoData=[];for(const p of photos){const b64=await blobToBase64(p.blob);photoData.push({...p,blob:null,dataUrl:b64})}
  const caches=await byProfile("cache",state.profile.id);downloadText("fieldscout_backup.json","application/json",JSON.stringify({version:"0.9.6",profile:state.profile,settings:state.settings,trips:state.trips,records:state.records,photos:photoData,cache:caches,offlineMap:state.offlineArchive?{name:state.offlineArchive.name,size:state.offlineArchive.size,note:"PMTiles binary is not embedded in JSON backup; re-import it separately."}:null,exportedAt:new Date().toISOString()},null,2))
}
function blobToBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(blob)})}
async function dataUrlToBlob(url){return await (await fetch(url)).blob()}
async function restoreBackup(e){
  const f=e.target.files?.[0];if(!f)return;
  try{const d=JSON.parse(await f.text());if(!d.profile?.email)throw new Error("無效 backup");if(d.profile.id!==state.profile.id&&!confirm(`Backup 屬於 ${d.profile.email}，仍要匯入目前 profile？`))return;
    if(d.settings)await put("settings",{...d.settings,id:`${state.profile.id}:settings`,profileId:state.profile.id});
    for(const t of d.trips||[])await put("trips",{...t,profileId:state.profile.id});
    for(const r of d.records||[])await put("records",{...r,profileId:state.profile.id});
    for(const p of d.photos||[])await put("photos",{...p,profileId:state.profile.id,blob:await dataUrlToBlob(p.dataUrl)});
    for(const c of d.cache||[])await put("cache",{...c,profileId:state.profile.id});
    state.settings=await get("settings",`${state.profile.id}:settings`);await loadProfileData();renderAll();setStatus("Backup 還原完成。")
  }catch(err){setStatus("還原失敗："+err.message)}e.target.value=""
}
function switchProfile(){location.reload()}
async function deleteProfile(){if(!confirm(`永久刪除 ${state.profile.email} 在此瀏覽器的所有 FieldScout 資料？`))return;await deleteProfileData(state.profile.id);location.reload()}
function showModal(html){$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden")}

function renderAll(){renderTrips();renderRecords();renderDashboard();renderOfflineInfo()}
boot();
