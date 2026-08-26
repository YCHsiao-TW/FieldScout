const SPIDER_SOCIETY_DATASET_UUID="3edadeb1-36e6-4dc0-9a4c-8c6ca9c44618";

async function fetchJson(url,timeout=18000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);
  try{
    const r=await fetch(url,{headers:{Accept:"application/json"},signal:c.signal});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }finally{clearTimeout(t)}
}

function n(v){
  if(v===null||v===undefined||v==="")return null;
  const x=Number(v);
  return Number.isFinite(x)?x:null;
}

function absTbnUrl(u){
  if(!u)return "";
  if(/^https?:\/\//i.test(u))return u;
  return `https://www.tbn.org.tw${String(u).startsWith("/")?"":"/"}${u}`;
}

function cleanScientificName(s){
  return String(s||"").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
}

function normalizeTBIA(r){
  const lat=n(r.standardLatitude??r.decimalLatitude??r.latitude),
        lon=n(r.standardLongitude??r.decimalLongitude??r.longitude);
  if(lat==null||lon==null)return null;
  return {
    id:`tbia:${r.id||r.occurrenceID||crypto.randomUUID()}`,
    scientificName:r.scientificName||r.name||"",
    commonName:r.vernacularName||r.commonName||"",
    locality:r.locality||r.county||r.municipality||"",
    eventDate:r.eventDate||r.year||"",
    lat,lon,
    uncertaintyM:n(r.coordinateUncertaintyInMeters),
    basisOfRecord:r.basisOfRecord||"",
    hasPhoto:Boolean(r.associatedMedia||r.media),
    sources:["TBIA"],
    sourceUrls:[],
    datasetUUID:r.datasetUUID||"",
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
  return {
    id:`gbif:${r.key}`,
    scientificName:r.scientificName||r.acceptedScientificName||r.species||"",
    commonName:r.vernacularName||"",
    locality:r.locality||r.municipality||r.stateProvince||"",
    eventDate:r.eventDate||r.year||"",
    lat,lon,
    uncertaintyM:n(r.coordinateUncertaintyInMeters),
    basisOfRecord:r.basisOfRecord||"",
    hasPhoto:Array.isArray(r.media)&&r.media.length>0,
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
  return {
    id:`inat:${o.id}`,
    scientificName:o.taxon?.name||"",
    commonName:o.taxon?.preferred_common_name||"",
    locality:o.place_guess||"",
    eventDate:o.observed_on||o.time_observed_at||"",
    lat,lon,
    uncertaintyM:n(o.positional_accuracy),
    basisOfRecord:"OBSERVATION",
    hasPhoto:Array.isArray(o.photos)&&o.photos.length>0,
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
  // TBN may intentionally withhold coordinates for sensitive records.
  // Records without public coordinates are not plotted by this map-centric app.
  if(lat==null||lon==null)return null;

  const isSpiderSociety=
    String(r.datasetUUID||"").toLowerCase()===SPIDER_SOCIETY_DATASET_UUID ||
    /臺灣蛛式會社|蜘蛛公民科學調查/.test(String(r.datasetName||""));

  const sources=["TBN"];
  if(isSpiderSociety)sources.push("臺灣蛛式會社");

  const sourceUrl=absTbnUrl(r.source);
  const datasetURL=absTbnUrl(r.datasetURL);
  const occurrenceURL=r.occurrenceID
    ? `https://www.tbn.org.tw/occurrence/${encodeURIComponent(r.occurrenceID)}`
    : "";

  return {
    id:`tbn:${r.occurrenceID||r.externalID||crypto.randomUUID()}`,
    scientificName:r.simplifiedScientificName||cleanScientificName(r.scientificName)||"",
    commonName:r.vernacularName||"",
    locality:[r.county,r.municipality].filter(Boolean).join("")||"",
    eventDate:
      (r.year&&r.month&&r.day)
        ? `${String(r.year).padStart(4,"0")}-${String(r.month).padStart(2,"0")}-${String(r.day).padStart(2,"0")}`
        : (r.year&&r.month)
          ? `${String(r.year).padStart(4,"0")}-${String(r.month).padStart(2,"0")}`
          : (r.year?String(r.year):""),
    lat,lon,
    uncertaintyM:n(r.coordinateUncertaintyInMeters),
    basisOfRecord:r.basisOfRecord||"",
    hasPhoto:Boolean(r.associatedMedia),
    sources,
    sourceUrls:[sourceUrl,occurrenceURL,datasetURL].filter(Boolean),
    datasetUUID:r.datasetUUID||"",
    datasetName:r.datasetName||"",
    datasetURL,
    datasetAuthor:r.datasetAuthor||"",
    datasetPublisher:r.datasetPublisher||"",
    license:r.license||"",
    mediaLicense:r.mediaLicense||"",
    associatedMedia:r.associatedMedia||"",
    recordedBy:r.recordedBy||"",
    identifiedBy:r.identifiedBy||"",
    identificationVerificationStatus:r.identificationVerificationStatus||"",
    taxonGroup:r.taxonGroup||"",
    taxonRank:r.taxonRank||"",
    familyScientificName:r.familyScientificName||"",
    taiCOLTaxonID:r.taiCOLTaxonID||"",
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
      m.set(key,{...r});
      continue;
    }

    const x=m.get(key);
    x.sources=[...new Set([...(x.sources||[]),...(r.sources||[])])];
    x.sourceUrls=[...new Set([...(x.sourceUrls||[]),...(r.sourceUrls||[])])];
    x.hasPhoto=x.hasPhoto||r.hasPhoto;
    x.dataGeneralizations=x.dataGeneralizations||r.dataGeneralizations;
    x.isSpiderSociety=x.isSpiderSociety||r.isSpiderSociety;

    if((r.uncertaintyM??Infinity)<(x.uncertaintyM??Infinity))x.uncertaintyM=r.uncertaintyM;
    if(!x.locality&&r.locality)x.locality=r.locality;
    if(!x.commonName&&r.commonName)x.commonName=r.commonName;
    if(!x.datasetName&&r.datasetName)x.datasetName=r.datasetName;
    if(!x.datasetUUID&&r.datasetUUID)x.datasetUUID=r.datasetUUID;
    if(!x.datasetURL&&r.datasetURL)x.datasetURL=r.datasetURL;
    if(!x.license&&r.license)x.license=r.license;
    if(!x.sensitiveCategory&&r.sensitiveCategory)x.sensitiveCategory=r.sensitiveCategory;
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
  const jobs=await Promise.allSettled([
    fetchJson(`https://api.taicol.tw/v2/nameMatch?name=${encodeURIComponent(q)}`),
    fetchJson(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(q)}`),
    fetchJson(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(q)}&locale=zh-TW&per_page=10`),
    fetchJson(`https://www.tbn.org.tw/api/v26/taxon?name=${encodeURIComponent(q)}&limit=100`)
  ]);

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
    taiCOLTaxonID:tb?.taiCOLTaxonID||tai?.taxon_id||null,
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

  const dedup=[];
  const seen=new Set();
  for(const s of suggestions){
    const k=`${String(s.scientificName).toLowerCase()}|${String(s.commonName).toLowerCase()}`;
    if(seen.has(k))continue;
    seen.add(k);
    dedup.push(s);
  }

  return {
    best,
    suggestions:dedup.slice(0,12),
    warnings:[
      ...(jobs[0].status==="rejected"?["TaiCOL"]:[]),
      ...(jobs[1].status==="rejected"?["GBIF taxonomy"]:[]),
      ...(jobs[2].status==="rejected"?["iNaturalist taxonomy"]:[]),
      ...(jobs[3].status==="rejected"?["TBN taxonomy"]:[])
    ]
  };
}

export async function occurrences(taxon){
  const sci=taxon.scientificName||taxon.query;

  const tbia=new URL("https://tbiadata.tw/api/v1/occurrence");
  tbia.searchParams.set("name",sci);
  tbia.searchParams.set("limit","500");

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

  let tbnTaxonUUID=taxon.tbnTaxonUUID||null;

  if(!tbnTaxonUUID){
    try{
      const tj=await fetchJson(`https://www.tbn.org.tw/api/v26/taxon?name=${encodeURIComponent(sci)}&limit=100`);
      const tb=chooseTbnTaxon(tj?.data||[],sci,sci);
      tbnTaxonUUID=tb?.taxonUUID||null;
    }catch(_){}
  }

  const tbn=tbnTaxonUUID
    ? new URL("https://www.tbn.org.tw/api/v26/occurrence")
    : null;

  if(tbn){
    tbn.searchParams.set("taxonUUID",tbnTaxonUUID);
    tbn.searchParams.set("limit","1000");
  }

  const requestDefs=[
    {name:"TBIA",promise:fetchJson(tbia)},
    {name:"GBIF",promise:fetchJson(gbif)},
    {name:"iNaturalist",promise:fetchJson(inat)},
    ...(tbn?[{name:"TBN",promise:fetchJson(tbn)}]:[])
  ];

  const jobs=await Promise.allSettled(requestDefs.map(x=>x.promise));
  const byName=Object.fromEntries(requestDefs.map((x,i)=>[x.name,jobs[i]]));

  const tr=byName.TBIA?.status==="fulfilled"?(byName.TBIA.value?.data||[]):[];
  const gr=byName.GBIF?.status==="fulfilled"?(byName.GBIF.value?.results||[]):[];
  const ir=byName.iNaturalist?.status==="fulfilled"?(byName.iNaturalist.value?.results||[]):[];
  const tnr=byName.TBN?.status==="fulfilled"?(byName.TBN.value?.data||[]):[];

  const tbnTotal=byName.TBN?.status==="fulfilled"
    ? Number(byName.TBN.value?.meta?.total||tnr.length)
    : 0;

  const tbnNormalized=tnr.map(normalizeTBN).filter(Boolean);
  const spiderSocietyCount=tbnNormalized.filter(r=>r.isSpiderSociety).length;

  const records=merge([
    ...tr.map(normalizeTBIA),
    ...tbnNormalized,
    ...gr.map(normalizeGBIF),
    ...ir.map(normalizeINat)
  ]);

  return {
    records,
    sourceCounts:{
      TBIA:tr.length,
      TBN:tbnNormalized.length,
      "臺灣蛛式會社":spiderSocietyCount,
      GBIF:gr.length,
      iNaturalist:ir.length
    },
    tbn:{
      total:tbnTotal,
      fetched:tnr.length,
      publicCoordinateRecords:tbnNormalized.length,
      truncated:tbnTotal>tnr.length
    },
    warnings:requestDefs.flatMap((x,i)=>jobs[i].status==="rejected"?[x.name]:[])
  };
}

export const constants={
  SPIDER_SOCIETY_DATASET_UUID
};
