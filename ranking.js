import {haversineKm} from "./utils.js";
export function rankCandidates(records,currentPos,targetMonth){
  const groups=new Map();
  for(const r of records){const k=`${r.lat.toFixed(2)},${r.lon.toFixed(2)}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}
  const m=Number(targetMonth)||new Date().getMonth()+1,nowY=new Date().getFullYear();
  const out=[...groups.values()].map(arr=>{
    const lat=arr.reduce((s,r)=>s+r.lat,0)/arr.length,lon=arr.reduce((s,r)=>s+r.lon,0)/arr.length;
    const years=arr.map(r=>+String(r.eventDate).slice(0,4)).filter(Number.isFinite),newest=years.length?Math.max(...years):null;
    const mh=arr.filter(r=>+String(r.eventDate).slice(5,7)===m).length;
    const density=Math.min(25,6*Math.log2(arr.length+1)),recency=newest==null?5:Math.max(0,20-Math.min(20,(nowY-newest)*1.3)),season=20*(mh/arr.length);
    const dist=currentPos?haversineKm(currentPos,{lat,lon}):null,access=dist==null?8:Math.max(0,15-Math.min(15,dist/8));
    const unc=arr.map(r=>Number(r.uncertaintyM)).filter(Number.isFinite).sort((a,b)=>a-b),med=unc.length?unc[Math.floor(unc.length/2)]:500,coord=Math.max(0,10-Math.min(10,med/150));
    const sources=[...new Set(arr.flatMap(r=>r.sources||[]))],multi=Math.min(10,sources.length*3.5);
    return {id:`cand:${lat.toFixed(4)}:${lon.toFixed(4)}`,name:arr.find(r=>r.locality)?.locality||"候選探點",lat,lon,count:arr.length,newest,monthHits:mh,dist,medianUnc:med,sources,score:Math.round(Math.min(100,density+recency+season+access+coord+multi))}
  }).sort((a,b)=>b.score-a.score).slice(0,20);
  out.forEach((c,i)=>c.rank=i+1);return out;
}
