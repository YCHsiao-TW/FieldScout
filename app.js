const TBIA = "https://tbiadata.tw/api/v1/occurrence";
const state = {
  map:null, markers:L.layerGroup(), me:null, currentPos:null, records:[], candidates:[],
  trip:JSON.parse(localStorage.getItem("fieldscout_trip")||"[]"),
  saved:JSON.parse(localStorage.getItem("fieldscout_records")||"[]"),
  capturePos:null
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

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
function locality(r){ return r.locality || r.county || r.municipality || "地點未提供"; }

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
    setStatus("GPS 已取得。可搜尋物種或查看附近紀錄。");
  },err=>setStatus("無法取得 GPS："+err.message),{enableHighAccuracy:true,timeout:12000,maximumAge:10000});
}

async function searchTBIA(){
  const name=$("#taxonInput").value.trim();
  if(!name){ setStatus("請先輸入物種名稱。"); return; }
  $("#recordTaxon").value=name;
  setStatus("正在查詢 TBIA…");
  $("#searchBtn").disabled=true;
  try{
    const u=new URL(TBIA);
    u.searchParams.set("name",name);
    u.searchParams.set("bioGroup","蜘蛛");
    u.searchParams.set("limit","300");
    const res=await fetch(u.toString(),{headers:{"Accept":"application/json"}});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const json=await res.json();
    const data=Array.isArray(json.data)?json.data:(Array.isArray(json)?json:[]);
    state.records=data.filter(r=>Number.isFinite(getLat(r))&&Number.isFinite(getLon(r)));
    drawRecords();
    renderRecords();
    rankCandidates();
    setStatus(`TBIA 回傳 ${data.length} 筆；其中 ${state.records.length} 筆具有可繪製座標。`);
  }catch(e){
    console.error(e);
    setStatus("瀏覽器無法直接讀取 TBIA API（可能是 CORS 或網路限制）。目前仍可使用 GPS、行程與採集紀錄；正式公開版可加一個極薄的 API proxy 解決。");
  }finally{$("#searchBtn").disabled=false}
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
    const m=L.circleMarker([lat,lon],{radius:6,weight:2,fillOpacity:.7})
      .bindPopup(`<b>${esc(recordName(r))}</b><br>${esc(locality(r))}<br>${esc(eventDate(r))}`);
    m.addTo(state.markers); bounds.push([lat,lon]);
  });
  if(bounds.length) state.map.fitBounds(bounds,{padding:[25,25],maxZoom:12});
}
function nearbyFiltered(){
  if(!state.currentPos) return state.records.slice(0,50);
  const r=Number($("#radiusSelect").value);
  return state.records.map(x=>({...x,_dist:distanceKm(state.currentPos,{lat:getLat(x),lon:getLon(x)})}))
    .filter(x=>x._dist<=r).sort((a,b)=>a._dist-b._dist);
}
function renderRecords(){
  const list=nearbyFiltered();
  $("#resultMeta").textContent=state.currentPos?`${list.length} 筆位於目前位置設定半徑內`:`${state.records.length} 筆有座標紀錄`;
  $("#recordList").innerHTML=list.length?list.slice(0,80).map(r=>`
    <article class="card">
      <div class="card-top">
        <div><h3>${esc(recordName(r))}</h3><div class="meta">${esc(locality(r))}<br>${esc(eventDate(r))}${r._dist!=null?` · ${r._dist.toFixed(2)} km`:``}</div></div>
      </div>
      <div class="actions">
        <button data-show="${getLat(r)},${getLon(r)}">地圖定位</button>
        <button data-addrec="${esc(r.id||r.occurrenceID||crypto.randomUUID())}" data-lat="${getLat(r)}" data-lon="${getLon(r)}" data-name="${esc(locality(r))}">加入行程</button>
      </div>
    </article>`).join(""):`<div class="empty">目前沒有符合條件的紀錄。</div>`;
  $$("[data-show]").forEach(b=>b.onclick=()=>{const [lat,lon]=b.dataset.show.split(",").map(Number);state.map.setView([lat,lon],15)});
  $$("[data-addrec]").forEach(b=>b.onclick=()=>addTrip({id:b.dataset.addrec,name:b.dataset.name,lat:+b.dataset.lat,lon:+b.dataset.lon,source:"TBIA"}));
}
function rankCandidates(){
  if(!state.records.length){ state.candidates=[]; renderCandidates(); return; }
  const clusters=new Map();
  for(const r of state.records){
    const lat=getLat(r),lon=getLon(r), key=`${lat.toFixed(2)},${lon.toFixed(2)}`;
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
    return {id:key,name:locality(arr[0]),lat,lon,count:arr.length,recent,dist,score:Math.round(density+recency+access)};
  }).sort((a,b)=>b.score-a.score).slice(0,12);
  renderCandidates();
}
function renderCandidates(){
  $("#candidateList").innerHTML=state.candidates.length?state.candidates.map((c,i)=>`
    <article class="card">
      <div class="card-top">
        <div><h3>#${i+1} ${esc(c.name)}</h3><div class="meta">${c.count} 筆附近紀錄 · 最近 ${c.recent||"不明"}${c.dist!=null?` · ${c.dist.toFixed(1)} km`:``}</div></div>
        <div class="score">${c.score}</div>
      </div>
      <div class="actions"><button data-cshow="${c.lat},${c.lon}">看地圖</button><button data-cadd="${i}">加入行程</button></div>
    </article>`).join(""):`<div class="empty">搜尋物種後才會產生候選探點。</div>`;
  $$("[data-cshow]").forEach(b=>b.onclick=()=>{const [lat,lon]=b.dataset.cshow.split(",").map(Number);state.map.setView([lat,lon],14)});
  $$("[data-cadd]").forEach(b=>b.onclick=()=>addTrip({...state.candidates[+b.dataset.cadd],source:"ranking"}));
}
function addTrip(x){
  if(!state.trip.some(t=>t.id===x.id)) state.trip.push(x);
  persist(); renderTrip(); setStatus(`已加入行程：${x.name}`);
}
function renderTrip(){
  $("#tripList").innerHTML=state.trip.length?state.trip.map((t,i)=>`
    <article class="card"><div class="card-top"><div><h3>${i+1}. ${esc(t.name)}</h3><div class="meta">${Number(t.lat).toFixed(5)}, ${Number(t.lon).toFixed(5)}</div></div></div>
    <div class="actions"><button data-tripshow="${t.lat},${t.lon}">看地圖</button><button data-remove="${i}">移除</button></div></article>`).join(""):`<div class="empty">尚未加入探點。</div>`;
  $$("[data-tripshow]").forEach(b=>b.onclick=()=>{const [lat,lon]=b.dataset.tripshow.split(",").map(Number);state.map.setView([lat,lon],15)});
  $$("[data-remove]").forEach(b=>b.onclick=()=>{state.trip.splice(+b.dataset.remove,1);persist();renderTrip()});
}
function renderSaved(){
  $("#savedList").innerHTML=state.saved.length?state.saved.map(r=>`
    <article class="card"><h3>${esc(r.specimen)} · ${esc(r.taxon)}</h3>
    <div class="meta">${r.count} 隻 · ${esc(r.microhabitat)} · ${esc(r.method)}<br>${r.lat!=null?`${r.lat.toFixed(5)}, ${r.lon.toFixed(5)} · ±${Math.round(r.accuracy||0)} m`:"無 GPS"}<br>${esc(r.time)}</div>
    ${r.notes?`<div class="meta">${esc(r.notes)}</div>`:""}</article>`).join(""):`<div class="empty">尚未建立採集紀錄。</div>`;
}
function switchPanel(mode){
  $$(".chip").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  $$(".panel").forEach(p=>p.classList.add("hidden"));
  $(`#panel-${mode}`).classList.remove("hidden");
}
function captureGPS(){
  if(!navigator.geolocation){$("#captureGpsText").textContent="此瀏覽器不支援 GPS";return}
  $("#captureGpsText").textContent="定位中…";
  navigator.geolocation.getCurrentPosition(pos=>{
    state.capturePos={lat:pos.coords.latitude,lon:pos.coords.longitude,accuracy:pos.coords.accuracy};
    $("#captureGpsText").textContent=`${state.capturePos.lat.toFixed(5)}, ${state.capturePos.lon.toFixed(5)} ±${Math.round(state.capturePos.accuracy)} m`;
  },e=>$("#captureGpsText").textContent="GPS 失敗："+e.message,{enableHighAccuracy:true,timeout:12000});
}
function download(name,type,text){
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function exportGeoJSON(){
  const fc={type:"FeatureCollection",features:state.trip.map(t=>({type:"Feature",geometry:{type:"Point",coordinates:[+t.lon,+t.lat]},properties:{name:t.name,score:t.score??null,source:t.source??null}}))};
  download("fieldscout_trip.geojson","application/geo+json",JSON.stringify(fc,null,2));
}
function exportCSV(){
  const rows=[["name","latitude","longitude","score","source"],...state.trip.map(t=>[t.name,t.lat,t.lon,t.score??"",t.source??""])];
  const q=v=>`"${String(v).replaceAll('"','""')}"`;
  download("fieldscout_trip.csv","text/csv;charset=utf-8","\ufeff"+rows.map(r=>r.map(q).join(",")).join("\n"));
}

window.addEventListener("online",()=>$("#netBadge").textContent="ONLINE");
window.addEventListener("offline",()=>$("#netBadge").textContent="OFFLINE");
$("#searchBtn").onclick=searchTBIA;
$("#taxonInput").addEventListener("keydown",e=>{if(e.key==="Enter")searchTBIA()});
$("#locateBtn").onclick=()=>locate(true);
$("#radiusSelect").onchange=renderRecords;
$("#rankBtn").onclick=rankCandidates;
$("#clearTripBtn").onclick=()=>{if(confirm("清空今日行程？")){state.trip=[];persist();renderTrip()}};
$("#geojsonBtn").onclick=exportGeoJSON; $("#csvBtn").onclick=exportCSV;
$$(".chip").forEach(b=>b.onclick=()=>switchPanel(b.dataset.mode));
$("#captureGpsBtn").onclick=captureGPS;
$("#fieldForm").onsubmit=e=>{
  e.preventDefault();
  const r={
    specimen:$("#specimenId").value.trim(),count:Math.max(1,+$("#count").value||1),
    taxon:$("#recordTaxon").value.trim()||$("#taxonInput").value.trim(),
    microhabitat:$("#microhabitat").value,method:$("#method").value,notes:$("#notes").value.trim(),
    lat:state.capturePos?.lat??null,lon:state.capturePos?.lon??null,accuracy:state.capturePos?.accuracy??null,
    time:new Date().toLocaleString("zh-TW")
  };
  state.saved.unshift(r);persist();renderSaved();e.target.reset();$("#count").value=1;$("#recordTaxon").value=$("#taxonInput").value.trim();
  state.capturePos=null;$("#captureGpsText").textContent="尚未記錄 GPS";setStatus(`已儲存 ${r.specimen}。`);
};
initMap();renderTrip();renderSaved();renderCandidates();
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(console.warn);
