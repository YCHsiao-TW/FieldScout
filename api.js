async function fetchJson(url,timeout=15000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);
  try{const r=await fetch(url,{headers:{Accept:"application/json"},signal:c.signal});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json()}finally{clearTimeout(t)}
}
function n(v){const x=Number(v);return Number.isFinite(x)?x:null}
function normalizeTBIA(r){
  const lat=n(r.standardLatitude??r.decimalLatitude??r.latitude),lon=n(r.standardLongitude??r.decimalLongitude??r.longitude);if(lat==null||lon==null)return null;
  return {id:`tbia:${r.id||r.occurrenceID||crypto.randomUUID()}`,scientificName:r.scientificName||r.name||"",commonName:r.vernacularName||"",locality:r.locality||r.county||r.municipality||"",eventDate:r.eventDate||r.year||"",lat,lon,uncertaintyM:n(r.coordinateUncertaintyInMeters),basisOfRecord:r.basisOfRecord||"",hasPhoto:Boolean(r.associatedMedia||r.media),sources:["TBIA"],sourceUrls:[]}
}
function normalizeGBIF(r){
  const lat=n(r.decimalLatitude),lon=n(r.decimalLongitude);if(lat==null||lon==null)return null;
  return {id:`gbif:${r.key}`,scientificName:r.scientificName||r.acceptedScientificName||r.species||"",commonName:r.vernacularName||"",locality:r.locality||r.municipality||r.stateProvince||"",eventDate:r.eventDate||r.year||"",lat,lon,uncertaintyM:n(r.coordinateUncertaintyInMeters),basisOfRecord:r.basisOfRecord||"",hasPhoto:Array.isArray(r.media)&&r.media.length>0,sources:["GBIF"],sourceUrls:r.key?[`https://www.gbif.org/occurrence/${r.key}`]:[]}
}
function normalizeINat(o){
  const c=o.geojson?.coordinates;if(!Array.isArray(c))return null;const lon=n(c[0]),lat=n(c[1]);if(lat==null||lon==null)return null;
  return {id:`inat:${o.id}`,scientificName:o.taxon?.name||"",commonName:o.taxon?.preferred_common_name||"",locality:o.place_guess||"",eventDate:o.observed_on||o.time_observed_at||"",lat,lon,uncertaintyM:n(o.positional_accuracy),basisOfRecord:"OBSERVATION",hasPhoto:Array.isArray(o.photos)&&o.photos.length>0,sources:["iNaturalist"],sourceUrls:o.uri?[o.uri]:[]}
}
function merge(records){
  const m=new Map();
  for(const r of records.filter(Boolean)){
    const key=[String(r.scientificName).toLowerCase(),String(r.eventDate).slice(0,10),r.lat.toFixed(4),r.lon.toFixed(4)].join("|");
    if(!m.has(key)){m.set(key,{...r});continue}
    const x=m.get(key);x.sources=[...new Set([...(x.sources||[]),...(r.sources||[])])];x.sourceUrls=[...new Set([...(x.sourceUrls||[]),...(r.sourceUrls||[])])];x.hasPhoto=x.hasPhoto||r.hasPhoto;
    if((r.uncertaintyM??Infinity)<(x.uncertaintyM??Infinity))x.uncertaintyM=r.uncertaintyM;
  }
  return [...m.values()];
}
export async function taxonomy(q){
  const jobs=await Promise.allSettled([
    fetchJson(`https://api.taicol.tw/v2/nameMatch?name=${encodeURIComponent(q)}`),
    fetchJson(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(q)}`),
    fetchJson(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(q)}&locale=zh-TW&per_page=10`)
  ]);
  const tai=jobs[0].status==="fulfilled"?(jobs[0].value?.data?.[0]||null):null;
  const gb=jobs[1].status==="fulfilled"?jobs[1].value:null;
  const il=jobs[2].status==="fulfilled"?(jobs[2].value?.results||[]):[];
  const sci=tai?.matched_name||gb?.scientificName||gb?.canonicalName||il[0]?.name||q;
  const ib=il.find(x=>String(x.name||"").toLowerCase()===String(sci).toLowerCase())||il[0];
  return {
    best:{query:q,scientificName:sci,commonName:ib?.preferred_common_name||"",rank:tai?.rank||gb?.rank||ib?.rank||"",family:gb?.family||"",order:gb?.order||"",gbifKey:gb?.usageKey||gb?.speciesKey||null,inatTaxonId:ib?.id||null,sources:[...(tai?["TaiCOL"]:[]),...(gb?["GBIF"]:[]),...(ib?["iNaturalist"]:[])]},
    suggestions:il.slice(0,10).map(x=>({scientificName:x.name||"",commonName:x.preferred_common_name||"",rank:x.rank||"",inatTaxonId:x.id||null}))
  };
}
export async function occurrences(taxon){
  const sci=taxon.scientificName||taxon.query;
  const tbia=new URL("https://tbiadata.tw/api/v1/occurrence");tbia.searchParams.set("name",sci);tbia.searchParams.set("limit","500");
  const gbif=new URL("https://api.gbif.org/v1/occurrence/search");if(taxon.gbifKey)gbif.searchParams.set("taxonKey",taxon.gbifKey);else gbif.searchParams.set("scientificName",sci);gbif.searchParams.set("country","TW");gbif.searchParams.set("hasCoordinate","true");gbif.searchParams.set("limit","300");
  const inat=new URL("https://api.inaturalist.org/v1/observations");if(taxon.inatTaxonId)inat.searchParams.set("taxon_id",taxon.inatTaxonId);else inat.searchParams.set("taxon_name",sci);inat.searchParams.set("place_id","7887");inat.searchParams.set("geo","true");inat.searchParams.set("verifiable","true");inat.searchParams.set("per_page","200");
  const jobs=await Promise.allSettled([fetchJson(tbia),fetchJson(gbif),fetchJson(inat)]);
  const tr=jobs[0].status==="fulfilled"?(jobs[0].value?.data||[]):[],gr=jobs[1].status==="fulfilled"?(jobs[1].value?.results||[]):[],ir=jobs[2].status==="fulfilled"?(jobs[2].value?.results||[]):[];
  return {records:merge([...tr.map(normalizeTBIA),...gr.map(normalizeGBIF),...ir.map(normalizeINat)]),sourceCounts:{TBIA:tr.length,GBIF:gr.length,iNaturalist:ir.length},warnings:jobs.map((x,i)=>x.status==="rejected"?["TBIA","GBIF","iNaturalist"][i]:null).filter(Boolean)};
}
