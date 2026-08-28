async function fetchJson(url,timeout=18000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);
  try{
    const r=await fetch(url,{
      headers:{Accept:"application/json"},
      signal:c.signal,
      cache:"no-store"
    });
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }finally{
    clearTimeout(t);
  }
}

function n(v){
  if(v===null||v===undefined||v==="")return null;
  const x=Number(v);
  return Number.isFinite(x)?x:null;
}

function cleanScientificName(s){
  return String(s||"").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
}

function mediaUrls(value){
  const out=[];
  const add=u=>{
    if(!u)return;
    const s=String(u).trim();
    if(/^https?:\/\//i.test(s))out.push(s);
  };

  if(Array.isArray(value)){
    for(const m of value){
      if(typeof m==="string"){
        add(m);
      }else if(m&&typeof m==="object"){
        add(m.thumbnail);
        add(m.identifier);
        add(m.url);
        add(m.references);
      }
    }
  }else if(typeof value==="string"){
    add(value);
  }
  return [...new Set(out)];
}

function inatPhotoUrls(photos){
  return [...new Set((photos||[]).flatMap(p=>{
    const u=p?.url||p?.medium_url||p?.large_url;
    if(!u)return [];
    return [String(u).replace(/\/square\./,"/medium.")];
  }))];
}

function normalizeGBIF(r){
  const lat=n(r.decimalLatitude),lon=n(r.decimalLongitude);
  if(lat==null||lon==null)return null;
  const imgs=mediaUrls(r.media);

  return {
    id:`gbif:${r.key}`,
    scientificName:cleanScientificName(r.scientificName||r.acceptedScientificName||r.species||""),
    commonName:r.vernacularName||"",
    locality:r.locality||r.municipality||r.stateProvince||"",
    eventDate:r.eventDate||r.year||"",
    lat,lon,
    uncertaintyM:n(r.coordinateUncertaintyInMeters),
    basisOfRecord:r.basisOfRecord||"",
    hasPhoto:imgs.length>0,
    imageUrls:imgs.slice(0,6),
    mediaLicense:(r.media||[]).map(x=>x?.license).filter(Boolean).join("; "),
    sources:["GBIF"],
    sourceUrls:r.key?[`https://www.gbif.org/occurrence/${r.key}`]:[],
    datasetUUID:r.datasetKey||"",
    datasetName:r.datasetTitle||"",
    datasetURL:"",
    license:r.license||"",
    sensitiveCategory:"",
    dataGeneralizations:false
  };
}

function normalizeINat(o){
  const c=o.geojson?.coordinates;
  if(!Array.isArray(c)||c.length<2)return null;
  const lon=n(c[0]),lat=n(c[1]);
  if(lat==null||lon==null)return null;

  const imgs=inatPhotoUrls(o.photos);
  return {
    id:`inat:${o.id}`,
    scientificName:cleanScientificName(o.taxon?.name||""),
    commonName:o.taxon?.preferred_common_name||"",
    locality:o.place_guess||"",
    eventDate:o.observed_on||o.time_observed_at||"",
    lat,lon,
    uncertaintyM:n(o.positional_accuracy),
    basisOfRecord:"OBSERVATION",
    hasPhoto:imgs.length>0,
    imageUrls:imgs.slice(0,6),
    mediaLicense:(o.photos||[]).map(p=>p?.license_code).filter(Boolean).join("; "),
    sources:["iNaturalist"],
    sourceUrls:o.uri?[o.uri]:[`https://www.inaturalist.org/observations/${o.id}`],
    datasetUUID:"",
    datasetName:"iNaturalist",
    datasetURL:"https://www.inaturalist.org/",
    license:o.license_code||"",
    sensitiveCategory:o.obscured?"obscured":"",
    dataGeneralizations:Boolean(o.obscured)
  };
}

function merge(records){
  const m=new Map();

  for(const r of records.filter(Boolean)){
    const key=[
      String(r.scientificName||"").toLowerCase().trim(),
      String(r.eventDate||"").slice(0,10),
      Number(r.lat).toFixed(4),
      Number(r.lon).toFixed(4)
    ].join("|");

    if(!m.has(key)){
      m.set(key,{...r,imageUrls:[...(r.imageUrls||[])]});
      continue;
    }

    const x=m.get(key);
    x.sources=[...new Set([...(x.sources||[]),...(r.sources||[])])];
    x.sourceUrls=[...new Set([...(x.sourceUrls||[]),...(r.sourceUrls||[])])];
    x.imageUrls=[...new Set([...(x.imageUrls||[]),...(r.imageUrls||[])])].slice(0,6);
    x.hasPhoto=x.imageUrls.length>0||x.hasPhoto||r.hasPhoto;
    x.dataGeneralizations=x.dataGeneralizations||r.dataGeneralizations;

    if((r.uncertaintyM??Infinity)<(x.uncertaintyM??Infinity)){
      x.uncertaintyM=r.uncertaintyM;
    }
    if(!x.locality&&r.locality)x.locality=r.locality;
    if(!x.commonName&&r.commonName)x.commonName=r.commonName;
    if(!x.datasetName&&r.datasetName)x.datasetName=r.datasetName;
    if(!x.datasetUUID&&r.datasetUUID)x.datasetUUID=r.datasetUUID;
    if(!x.license&&r.license)x.license=r.license;
  }

  return [...m.values()];
}

export async function taxonomy(q){
  const defs=[
    {
      name:"TaiCOL",
      promise:fetchJson(`https://api.taicol.tw/v2/nameMatch?name=${encodeURIComponent(q)}`)
    },
    {
      name:"GBIF taxonomy",
      promise:fetchJson(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(q)}`)
    },
    {
      name:"iNaturalist taxonomy",
      promise:fetchJson(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(q)}&locale=zh-TW&per_page=10`)
    }
  ];

  const jobs=await Promise.allSettled(defs.map(x=>x.promise));

  const tai=jobs[0].status==="fulfilled"?(jobs[0].value?.data?.[0]||null):null;
  const gb=jobs[1].status==="fulfilled"?jobs[1].value:null;
  const il=jobs[2].status==="fulfilled"?(jobs[2].value?.results||[]):[];

  const sci=
    tai?.matched_name ||
    gb?.scientificName ||
    gb?.canonicalName ||
    il[0]?.name ||
    q;

  const ib=
    il.find(x=>String(x.name||"").toLowerCase()===String(sci).toLowerCase()) ||
    il[0];

  const best={
    query:q,
    scientificName:sci,
    commonName:ib?.preferred_common_name||"",
    rank:tai?.rank||gb?.rank||ib?.rank||"",
    kingdom:gb?.kingdom||"",
    phylum:gb?.phylum||"",
    className:gb?.class||"",
    order:gb?.order||"",
    family:gb?.family||"",
    gbifKey:gb?.usageKey||gb?.speciesKey||null,
    inatTaxonId:ib?.id||null,
    taiCOLTaxonID:tai?.taxon_id||null,
    sources:[
      ...(tai?["TaiCOL"]:[]),
      ...(gb?["GBIF"]:[]),
      ...(ib?["iNaturalist"]:[])
    ]
  };

  const suggestions=il.slice(0,12).map(x=>({
    scientificName:x.name||"",
    commonName:x.preferred_common_name||"",
    rank:x.rank||"",
    inatTaxonId:x.id||null,
    sources:["iNaturalist"]
  }));

  return {
    best,
    suggestions,
    warnings:defs.flatMap((x,i)=>jobs[i].status==="rejected"?[x.name]:[])
  };
}

export async function occurrences(taxon){
  const sci=taxon.scientificName||taxon.query;

  const gbif=new URL("https://api.gbif.org/v1/occurrence/search");
  if(taxon.gbifKey)gbif.searchParams.set("taxonKey",taxon.gbifKey);
  else gbif.searchParams.set("scientificName",sci);
  gbif.searchParams.set("country","TW");
  gbif.searchParams.set("hasCoordinate","true");
  gbif.searchParams.set("limit","300");

  const inat=new URL("https://api.inaturalist.org/v1/observations");
  if(taxon.inatTaxonId)inat.searchParams.set("taxon_id",taxon.inatTaxonId);
  else inat.searchParams.set("taxon_name",sci);
  inat.searchParams.set("place_id","7887");
  inat.searchParams.set("geo","true");
  inat.searchParams.set("verifiable","true");
  inat.searchParams.set("per_page","200");
  inat.searchParams.set("order_by","observed_on");
  inat.searchParams.set("order","desc");

  const defs=[
    {name:"GBIF",promise:fetchJson(gbif)},
    {name:"iNaturalist",promise:fetchJson(inat)}
  ];

  const jobs=await Promise.allSettled(defs.map(x=>x.promise));

  const gbifRaw=jobs[0].status==="fulfilled"?(jobs[0].value?.results||[]):[];
  const inatRaw=jobs[1].status==="fulfilled"?(jobs[1].value?.results||[]):[];

  const gbifN=gbifRaw.map(normalizeGBIF).filter(Boolean);
  const inatN=inatRaw.map(normalizeINat).filter(Boolean);

  return {
    records:merge([...gbifN,...inatN]),
    sourceCounts:{
      GBIF:gbifN.length,
      iNaturalist:inatN.length
    },
    sourceStatus:{
      GBIF:jobs[0].status==="fulfilled"?"ok":"unavailable",
      iNaturalist:jobs[1].status==="fulfilled"?"ok":"unavailable"
    },
    warnings:defs.flatMap((x,i)=>jobs[i].status==="rejected"?[x.name]:[])
  };
}
