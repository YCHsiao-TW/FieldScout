import {haversineKm} from "./utils.js";

export function rankCandidates(records,currentPos,targetMonth){
  const groups=new Map();

  for(const r of records){
    const lat=Number(r.lat),lon=Number(r.lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
    const k=`${lat.toFixed(2)},${lon.toFixed(2)}`;
    if(!groups.has(k))groups.set(k,[]);
    groups.get(k).push(r);
  }

  const m=Number(targetMonth)||new Date().getMonth()+1;
  const nowY=new Date().getFullYear();

  const out=[...groups.values()].map(arr=>{
    const lat=arr.reduce((s,r)=>s+Number(r.lat),0)/arr.length;
    const lon=arr.reduce((s,r)=>s+Number(r.lon),0)/arr.length;

    const years=arr
      .map(r=>+String(r.eventDate||"").slice(0,4))
      .filter(Number.isFinite);

    const newest=years.length?Math.max(...years):null;
    const mh=arr.filter(r=>+String(r.eventDate||"").slice(5,7)===m).length;

    const density=Math.min(25,6*Math.log2(arr.length+1));
    const recency=newest==null
      ? 5
      : Math.max(0,20-Math.min(20,(nowY-newest)*1.3));
    const season=20*(mh/arr.length);

    const dist=currentPos?haversineKm(currentPos,{lat,lon}):null;
    const access=dist==null
      ? 8
      : Math.max(0,15-Math.min(15,dist/8));

    const unc=arr
      .map(r=>Number(r.uncertaintyM))
      .filter(Number.isFinite)
      .sort((a,b)=>a-b);

    const med=unc.length?unc[Math.floor(unc.length/2)]:500;
    const coord=Math.max(0,10-Math.min(10,med/150));

    const sources=[...new Set(arr.flatMap(r=>r.sources||[]))];
    const multi=Math.min(10,sources.length*3.5);

    const breakdown={
      density:+density.toFixed(1),
      recency:+recency.toFixed(1),
      season:+season.toFixed(1),
      access:+access.toFixed(1),
      coordinate:+coord.toFixed(1),
      multiSource:+multi.toFixed(1)
    };

    const raw=Object.values(breakdown).reduce((s,v)=>s+v,0);

    return {
      id:`cand:${lat.toFixed(4)}:${lon.toFixed(4)}`,
      name:arr.find(r=>r.locality)?.locality||"候選探點",
      lat,lon,count:arr.length,newest,monthHits:mh,targetMonth:m,
      dist,medianUnc:med,sources,breakdown,
      score:Math.round(Math.min(100,raw))
    };
  })
  .sort((a,b)=>b.score-a.score)
  .slice(0,20);

  out.forEach((c,i)=>c.rank=i+1);
  return out;
}
