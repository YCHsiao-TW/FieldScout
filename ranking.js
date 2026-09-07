import {haversineKm} from "./utils.js?v=1.1.2";

function validCoordinate(lat,lon){
  return Number.isFinite(lat)&&Number.isFinite(lon)&&
    lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
}

function numericValue(value){
  if(value===null||value===undefined||String(value).trim()==="")return null;
  const number=Number(value);
  return Number.isFinite(number)?number:null;
}

function eventYear(value,currentYear){
  const match=String(value||"").match(/^(\d{4})(?:-|$)/);
  if(!match)return null;
  const year=Number(match[1]);
  return Number.isInteger(year)&&year>0&&year<=currentYear?year:null;
}

function eventMonth(value){
  const match=String(value||"").match(/^\d{4}-(\d{2})(?:-|$)/);
  if(!match)return null;
  const month=Number(match[1]);
  return Number.isInteger(month)&&month>=1&&month<=12?month:null;
}

function median(values){
  if(!values.length)return 500;
  const middle=Math.floor(values.length/2);
  return values.length%2
    ? values[middle]
    : (values[middle-1]+values[middle])/2;
}

export function rankCandidates(records,currentPos,targetMonth){
  const groups=new Map();

  for(const r of records||[]){
    const lat=numericValue(r.lat),lon=numericValue(r.lon);
    if(!validCoordinate(lat,lon))continue;
    const k=`${lat.toFixed(2)},${lon.toFixed(2)}`;
    if(!groups.has(k))groups.set(k,[]);
    groups.get(k).push(r);
  }

  const now=new Date();
  const requestedMonth=Number(targetMonth);
  const m=Number.isInteger(requestedMonth)&&requestedMonth>=1&&requestedMonth<=12
    ? requestedMonth
    : now.getMonth()+1;
  const nowY=now.getFullYear();
  const currentLat=numericValue(currentPos?.lat),currentLon=numericValue(currentPos?.lon);
  const validCurrentPos=validCoordinate(currentLat,currentLon)
    ? {lat:currentLat,lon:currentLon}
    : null;

  const out=[...groups.values()].map(arr=>{
    const lat=arr.reduce((s,r)=>s+Number(r.lat),0)/arr.length;
    const lon=arr.reduce((s,r)=>s+Number(r.lon),0)/arr.length;

    const years=arr.map(r=>eventYear(r.eventDate,nowY)).filter(y=>y!==null);

    // Avoid spreading a very large occurrence group into Math.max(), which
    // can exceed JavaScript's argument limit after unrestricted pagination.
    const newest=years.length
      ? years.reduce((latest,year)=>Math.max(latest,year),years[0])
      : null;
    const mh=arr.filter(r=>eventMonth(r.eventDate)===m).length;

    const density=Math.min(25,6*Math.log2(arr.length+1));
    const recency=newest==null
      ? 5
      : Math.max(0,Math.min(20,20-(nowY-newest)*1.3));
    const season=20*(mh/arr.length);

    const dist=validCurrentPos?haversineKm(validCurrentPos,{lat,lon}):null;
    const access=dist==null
      ? 8
      : Math.max(0,15-Math.min(15,dist/8));

    const unc=arr
      .map(r=>numericValue(r.uncertaintyM))
      .filter(v=>v!==null&&v>=0)
      .sort((a,b)=>a-b);

    const med=median(unc);
    const coord=Math.max(0,10-Math.min(10,med/150));

    const sourceSet=new Set();
    for(const record of arr){
      for(const source of record.sources||[])sourceSet.add(source);
    }
    const sources=[...sourceSet];
    // The current release integrates two occurrence sources. One source earns
    // half credit; independent support from both earns the full 10 points.
    const multi=Math.min(10,sources.length*5);

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
