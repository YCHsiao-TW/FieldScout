const SPIDER_SOCIETY_DATASET_UUID="3edadeb1-36e6-4dc0-9a4c-8c6ca9c44618";

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

function absTbnUrl(u){
  if(!u)return "";
  if(/^https?:\/\//i.test(u))return u;
  return `https://www.tbn.org.tw${String(u).startsWith("/")?"":"/"}${u}`;
}

function splitMediaString(v){
  if(!v)return [];
  return String(v)
    .split(/[;\n]+/)
    .map(x=>x.trim())
    .filter(x=>/^https?:\/\//i.test(x));
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
        splitMediaString(m).forEach(add);
      }else if(m&&typeof m==="object"){
        add(m.thumbnail);
        add(m.identifier);
        add(m.url);
        add(m.references);
      }
    }
  }else if(typeof value==="string"){
    splitMediaString(value).forEach(add);
  }else if(value&&typeof value==="object"){
    add(value.thumbnail);
    add(value.identifier);
    add(value.url);
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

function parseTBIAData(j){
  if(Array.isArray(j))return j;
  if(Array.isArray(j?.data))return j.data;
  if(Array.isArray(j?.results))return j.results;
  return [];
}

function normalizeTBIA(r){
  const lat=n(r.standardLatitude??r.decimalLatitude??r.latitude),
        lon=n(r.standardLongitude??r.decimalLongitude??r.longitude);
  if(lat==null||lon==null)return null;

  const imgs=[
    ...mediaUrls(r.associatedMedia),
    ...mediaUrls(r.media),
    ...mediaUrls(r.multimedia)
  ];

  return {
    id:`tbia:${r.id||r.occurrenceID||r.tbiaOccurrenceID||crypto.randomUUID()}`,
    scientificName:cleanScientificName(r.scientificName||r.name||""),
    commonName:r.vernacularName||r.commonName||"",
    locality:r.locality||r.county||r.municipality||r.eventPlaceAdminarea||"",
    eventDate:r.eventDate||r.date||r.year||"",
    lat,lon,
    uncertaintyM:n(r.coordinateUncertaintyInMeters),
    basisOfRecord:r.basisOfRecord||"",
    hasPhoto:imgs.length>0||r.hasMedia==="image"||r.imagePresence===true,
    imageUrls:imgs,
    mediaLicense:r.mediaLicense||"",
    sources:["TBIA"],
    sourceUrls:[r.source,r.references,r.occurrenceURL].filter(x=>/^https?:\/\//i.test(String(x||""))),
    datasetUUID:r.datasetUUID||r.tbiaDatasetID||"",
    datasetName:r.datasetName||"",
    datasetURL:r.datasetURL||"",
    license:r.license||"",
    sensitiveCategory:r.sensitiveCategory||r.dataSensitiveCategory||"",
    dataGeneralizations:Boolean(r.dataGeneralizations)
  };
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
    imageUrls:imgs,
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
    imageUrls:imgs,
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

function normalizeTBN(r){
  const lat=n(r.decimalLatitude),lon=n(r.decimalLongitude);
  if(lat==null||lon==null)return null;

  const datasetUUID=String(r.datasetUUID||"");
  const isSpiderSociety=
    datasetUUID.toLowerCase()===SPIDER_SOCIETY_DATASET_UUID ||
    /臺灣蛛式會社|蜘蛛公民科學調查/.test(String(r.datasetName||""));

  const sources=["TBN"];
  if(isSpiderSociety)sources.push("臺灣蛛式會社");

  const imgs=mediaUrls(r.associatedMedia);
  const sourceUrl=absTbnUrl(r.source);
  const datasetURL=absTbnUrl(r.datasetURL);
  const occurrenceURL=r.occurrenceID
    ? `https://www.tbn.org.tw/occurrence/${encodeURIComponent(r.occurrenceID)}`
    : "";

  let eventDate="";
  if(r.year&&r.month&&r.day){
    eventDate=`${String(r.year).padStart(4,"0")}-${String(r.month).padStart(2,"0")}-${String(r.day).padStart(2,"0")}`;
  }else if(r.year&&r.month){
    eventDate=`${String(r.year).padStart(4,"0")}-${String(r.month).padStart(2,"0")}`;
  }else if(r.year){
    eventDate=String(r.year);
  }

  return {
    id:`tbn:${r.occurrenceID||r.externalID||crypto.randomUUID()}`,
    scientificName:r.simplifiedScientificName||cleanScientificName(r.scientificName)||"",
    commonName:r.vernacularName||"",
    locality:[r.county,r.municipality].filter(Boolean).join("")||"",
    eventDate,
    lat,lon,
    uncertaintyM:n(r.coordinateUncertaintyInMeters),
    basisOfRecord:r.basisOfRecord||"",
    hasPhoto:imgs.length>0,
    imageUrls:imgs,
    mediaLicense:r.mediaLicense||"",
    sources,
    sourceUrls:[sourceUrl,occurrenceURL,datasetURL].filter(Boolean),
    datasetUUID,
    datasetName:r.datasetName||"",
    datasetURL,
    datasetAuthor:r.datasetAuthor||"",
    datasetPublisher:r.datasetPublisher||"",
    license:r.license||"",
    recordedBy:r.recordedBy||"",
    identifiedBy:r.identifiedBy||"",
    identificationVerificationStatus:r.identificationVerificationStatus||"",
    taxonGroup:r.taxonGroup||"",
    taxonRank:r.taxonRank||"",
    familyScientificName:r.familyScientificName||"",
    taiCOLTaxonID:r.taiCOLTaxonID||r.taiColTaxonID||"",
    sensitiveCategory:r.sensitiveCategory||r.dataSensitiveCategory||"",
    dataGeneralizations:Boolean(r.dataGeneralizations),
    coordinatePrecision:n(r.coordinatePrecision),
    minimumElevationM:n(r.minimumElevationInMeters),
    isSpiderSociety
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
    x.imageUrls=[...new Set([...(x.imageUrls||[]),...(r.imageUrls||[])])].slice(0,8);
    x.hasPhoto=x.imageUrls.length>0||x.hasPhoto||r.hasPhoto;
    x.dataGeneralizations=x.dataGeneralizations||r.dataGeneralizations;
    x.isSpiderSociety=x.isSpiderSociety||r.isSpiderSociety;

    if((r.uncertaintyM??Infinity)<(x.uncertaintyM??Infinity))x.uncertaintyM=r.uncertaintyM;
    for(const k of ["locality","commonName","datasetName","datasetUUID","datasetURL","license","mediaLicense","sensitiveCategory"]){
      if(!x[k]&&r[k])x[k]=r[k];
    }
  }
  return [...m.values()];
}

function chooseTbnTaxon(list,q,preferredScientific){
  const target=String(preferredScientific||q||"").toLowerCase().trim();
  const qlow=String(q||"").toLowerCase().trim();
  return (
    list.find(x=>String(x.simplifiedScientificName||"").toLowerCase()===target) ||
    list.find(x=>String(x.vernacularName||"").toLowerCase()===qlow) ||
    list.find(x=>String(x.simplifiedScientificName||"").toLowerCase()===qlow) ||
    list[0] ||
    null
  );
}

export async function taxonomy(q){
  const defs=[
    {name:"TaiCOL",promise:fetchJson(`https://api.taicol.tw/v2/nameMatch?name=${encodeURIComponent(q)}`)},
    {name:"GBIF taxonomy",promise:fetchJson(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(q)}`)},
    {name:"iNaturalist taxonomy",promise:fetchJson(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(q)}&locale=zh-TW&per_page=10`)},
    {name:"TBN taxonomy",promise:fetchJson(`https://www.tbn.org.tw/api/v26/taxon?name=${encodeURIComponent(q)}&limit=100`)}
  ];
  const jobs=await Promise.allSettled(defs.map(x=>x.promise));

  const tai=jobs[0].status==="fulfilled"?(jobs[0].value?.data?.[0]||null):null;
  const gb=jobs[1].status==="fulfilled"?jobs[1].value:null;
  const il=jobs[2].status==="fulfilled"?(jobs[2].value?.results||[]):[];
  const tbnList=jobs[3].status==="fulfilled"?(jobs[3].value?.data||[]):[];

  const sci=
    tai?.matched_name ||
    gb?.scientificName ||
    gb?.canonicalName ||
    il[0]?.name ||
    tbnList[0]?.simplifiedScientificName ||
    q;

  const ib=il.find(x=>String(x.name||"").toLowerCase()===String(sci).toLowerCase())||il[0];
  const tb=chooseTbnTaxon(tbnList,q,sci);

  const best={
    query:q,
    scientificName:sci,
    commonName:ib?.preferred_common_name||tb?.vernacularName||"",
    rank:tai?.rank||gb?.rank||ib?.rank||tb?.taxonRank||"",
    kingdom:tb?.kingdom||gb?.kingdom||"",
    phylum:tb?.phylum||gb?.phylum||"",
    className:tb?.class||gb?.class||"",
    order:tb?.order||gb?.order||"",
    family:tb?.family||gb?.family||"",
    genus:tb?.genus||"",
    gbifKey:gb?.usageKey||gb?.speciesKey||null,
    inatTaxonId:ib?.id||null,
    tbnTaxonUUID:tb?.taxonUUID||null,
    tbnTaxonGroup:tb?.taxonGroup||"",
    tbnSensitiveCategory:tb?.sensitiveCategory||"",
    taiCOLTaxonID:tb?.taiCOLTaxonID||tb?.taiColTaxonID||tai?.taxon_id||null,
    sources:[
      ...(tai?["TaiCOL"]:[]),
      ...(tb?["TBN"]:[]),
      ...(gb?["GBIF"]:[]),
      ...(ib?["iNaturalist"]:[])
    ]
  };

  const suggestions=[
    ...tbnList.slice(0,10).map(x=>({
      scientificName:x.simplifiedScientificName||cleanScientificName(x.scientificName)||"",
      commonName:x.vernacularName||"",
      rank:x.taxonRank||"",
      family:x.family||"",
      order:x.order||"",
      tbnTaxonUUID:x.taxonUUID||null,
      tbnTaxonGroup:x.taxonGroup||"",
      sources:["TBN"]
    })),
    ...il.slice(0,10).map(x=>({
      scientificName:x.name||"",
      commonName:x.preferred_common_name||"",
      rank:x.rank||"",
      inatTaxonId:x.id||null,
      sources:["iNaturalist"]
    }))
  ];

  const seen=new Set(),dedup=[];
  for(const s of suggestions){
    const k=`${String(s.scientificName).toLowerCase()}|${String(s.commonName).toLowerCase()}`;
    if(seen.has(k))continue;
    seen.add(k);
    dedup.push(s);
  }

  return {
    best,
    suggestions:dedup.slice(0,12),
    warnings:defs.flatMap((x,i)=>jobs[i].status==="rejected"?[x.name]:[])
  };
}

async function fetchTBIA(sci){
  const u=new URL("https://tbiadata.tw/api/v1/occurrence");
  u.searchParams.set("name",sci);
  u.searchParams.set("limit","500");
  return await fetchJson(u);
}

async function fetchTBN(taxonUUID){
  const u=new URL("https://www.tbn.org.tw/api/v26/occurrence");
  u.searchParams.set("taxonUUID",taxonUUID);
  u.searchParams.set("limit","1000");
  return await fetchJson(u);
}

export async function occurrences(taxon){
  const sci=taxon.scientificName||taxon.query;

  let tbnTaxonUUID=taxon.tbnTaxonUUID||null;
  if(!tbnTaxonUUID){
    try{
      const tj=await fetchJson(`https://www.tbn.org.tw/api/v26/taxon?name=${encodeURIComponent(sci)}&limit=100`);
      tbnTaxonUUID=chooseTbnTaxon(tj?.data||[],sci,sci)?.taxonUUID||null;
    }catch(_){}
  }

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
    {name:"TBIA",promise:fetchTBIA(sci)},
    ...(tbnTaxonUUID?[{name:"TBN",promise:fetchTBN(tbnTaxonUUID)}]:[]),
    {name:"GBIF",promise:fetchJson(gbif)},
    {name:"iNaturalist",promise:fetchJson(inat)}
  ];

  const jobs=await Promise.allSettled(defs.map(x=>x.promise));
  const byName=Object.fromEntries(defs.map((x,i)=>[x.name,jobs[i]]));

  const tbiaRaw=byName.TBIA?.status==="fulfilled"?parseTBIAData(byName.TBIA.value):[];
  const tbnRaw=byName.TBN?.status==="fulfilled"?(byName.TBN.value?.data||[]):[];
  const gbifRaw=byName.GBIF?.status==="fulfilled"?(byName.GBIF.value?.results||[]):[];
  const inatRaw=byName.iNaturalist?.status==="fulfilled"?(byName.iNaturalist.value?.results||[]):[];

  const tbiaN=tbiaRaw.map(normalizeTBIA).filter(Boolean);
  const tbnN=tbnRaw.map(normalizeTBN).filter(Boolean);
  const gbifN=gbifRaw.map(normalizeGBIF).filter(Boolean);
  const inatN=inatRaw.map(normalizeINat).filter(Boolean);

  const sourceStatus={
    TBIA:byName.TBIA?.status==="fulfilled"?"ok":"unavailable",
    TBN:tbnTaxonUUID
      ? (byName.TBN?.status==="fulfilled"?"ok":"unavailable")
      : "skipped",
    GBIF:byName.GBIF?.status==="fulfilled"?"ok":"unavailable",
    iNaturalist:byName.iNaturalist?.status==="fulfilled"?"ok":"unavailable"
  };

  const spiderSocietyCount=tbnN.filter(r=>r.isSpiderSociety).length;
  const tbnTotal=byName.TBN?.status==="fulfilled"
    ? Number(byName.TBN.value?.meta?.total||tbnRaw.length)
    : 0;

  return {
    records:merge([...tbiaN,...tbnN,...gbifN,...inatN]),
    sourceCounts:{
      TBIA:tbiaN.length,
      TBN:tbnN.length,
      "臺灣蛛式會社":spiderSocietyCount,
      GBIF:gbifN.length,
      iNaturalist:inatN.length
    },
    sourceStatus,
    tbn:{
      total:tbnTotal,
      fetched:tbnRaw.length,
      publicCoordinateRecords:tbnN.length,
      truncated:tbnTotal>tbnRaw.length
    },
    warnings:defs.flatMap((x,i)=>jobs[i].status==="rejected"?[x.name]:[])
  };
}

export const constants={SPIDER_SOCIETY_DATASET_UUID};
