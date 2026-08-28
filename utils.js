export const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
export function hashEmail(email){
  let h=2166136261;
  for(const c of email.trim().toLowerCase()){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
  return `profile-${(h>>>0).toString(16)}`;
}
export function haversineKm(a,b){
  const R=6371,rad=x=>x*Math.PI/180,dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon);
  const x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}
export function googleMapsUrl(lat,lon){return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lon}`)}`}
export function googleMapsRouteUrl(points){
  const valid=(points||[])
    .map(p=>({lat:Number(p.lat),lon:Number(p.lon)}))
    .filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon));

  if(!valid.length)return "";
  if(valid.length===1)return googleMapsUrl(valid[0].lat,valid[0].lon);

  const destination=valid[valid.length-1];
  const waypoints=valid.slice(0,-1)
    .map(p=>`${p.lat},${p.lon}`)
    .join("|");

  const u=new URL("https://www.google.com/maps/dir/");
  u.searchParams.set("api","1");
  u.searchParams.set("destination",`${destination.lat},${destination.lon}`);
  u.searchParams.set("travelmode","driving");
  if(waypoints)u.searchParams.set("waypoints",waypoints);
  return u.toString();
}

export function googleMapsRouteSegments(points,options={}){
  const valid=(points||[])
    .map(p=>({...p,lat:Number(p.lat),lon:Number(p.lon)}))
    .filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon));

  if(!valid.length)return [];

  // FieldScout itself has no Trip-point limit.
  // Google Maps multi-stop URLs are split conservatively for cross-device
  // reliability. Each next segment repeats the previous destination as origin context.
  const maxStops=Math.max(2,Number(options.maxStops)||10);
  const maxUrlLength=Math.max(800,Number(options.maxUrlLength)||1800);

  const segments=[];
  let current=[];

  for(const p of valid){
    const candidate=[...current,p];
    const testUrl=googleMapsRouteUrl(candidate);

    if(current.length>=2 && (candidate.length>maxStops || testUrl.length>maxUrlLength)){
      segments.push(current);
      current=[current[current.length-1],p];
    }else{
      current=candidate;
    }
  }

  if(current.length)segments.push(current);
  return segments;
}

export function downloadText(name,type,text){
  const a=document.createElement("a"),url=URL.createObjectURL(new Blob([text],{type}));
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function csvEscape(v){return `"${String(v??"").replaceAll('"','""')}"`}
export function toCSV(rows){return "\ufeff"+rows.map(r=>r.map(csvEscape).join(",")).join("\n")}
export function geojsonPoints(items,propsFn){
  return {type:"FeatureCollection",features:items.map(x=>({type:"Feature",geometry:x.lat!=null&&x.lon!=null?{type:"Point",coordinates:[+x.lon,+x.lat]}:null,properties:propsFn(x)}))}
}
export function gpxWaypoints(points,name="FieldScout Trip"){
  const xe=s=>String(s??"").replace(/[<>&'"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[c]));
  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="FieldScout" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${xe(name)}</name></metadata>${points.map(p=>`<wpt lat="${p.lat}" lon="${p.lon}"><name>${xe(p.name||"Point")}</name></wpt>`).join("")}</gpx>`;
}
export function gpxTrack(points,name="FieldScout Track"){
  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="FieldScout" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${name}</name><trkseg>${points.map(p=>`<trkpt lat="${p.lat}" lon="${p.lon}"><time>${new Date(p.time).toISOString()}</time></trkpt>`).join("")}</trkseg></trk></gpx>`;
}
export function parseGpx(text){
  const d=new DOMParser().parseFromString(text,"application/xml");
  return [...d.querySelectorAll("wpt")].map((n,i)=>({id:crypto.randomUUID(),name:n.querySelector("name")?.textContent||`GPX ${i+1}`,lat:+n.getAttribute("lat"),lon:+n.getAttribute("lon"),source:"GPX",visitStatus:"unvisited"})).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon));
}
export async function sanitizeImage(file){
  const bmp=await createImageBitmap(file),max=1600,s=Math.min(1,max/Math.max(bmp.width,bmp.height));
  const c=document.createElement("canvas");c.width=Math.max(1,Math.round(bmp.width*s));c.height=Math.max(1,Math.round(bmp.height*s));
  c.getContext("2d",{alpha:false}).drawImage(bmp,0,0,c.width,c.height);bmp.close?.();
  return await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error("影像轉換失敗")),"image/jpeg",.82));
}
export function obscurePoint(lat,lon,radiusM=1000,seed=""){
  let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;
  const angle=(h%360)*Math.PI/180,radial=radiusM*(.45+((h>>>8)%55)/100);
  return {lat:lat+(radial*Math.cos(angle))/111320,lon:lon+(radial*Math.sin(angle))/(111320*Math.max(.15,Math.cos(lat*Math.PI/180)))};
}
export function qcRecord(r,records){
  const issues=[];
  if(!r.specimenId)issues.push("缺標本／紀錄號");
  if(r.lat==null||r.lon==null)issues.push("缺 GPS");
  if(r.accuracyM!=null&&r.accuracyM>1000)issues.push("GPS 誤差 > 1000 m");
  if(r.lat!=null&&(r.lat<20||r.lat>27||r.lon<118||r.lon>124))issues.push("座標可能不在臺灣");
  if(records.some(x=>x.id!==r.id&&x.specimenId===r.specimenId))issues.push("標本／紀錄號重複");
  if((r.count||0)<1)issues.push("數量異常");
  return issues;
}
