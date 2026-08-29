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
  const generalized=Boolean(r.dataGeneralizations||r.informationWithheld);

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
    datasetURL:r.datasetKey?`https://www.gbif.org/dataset/${r.datasetKey}`:"",
    datasetAuthor:r.institutionCode||r.collectionCode||"",
    recordedBy:Array.isArray(r.recordedBy)?r.recordedBy.join("; "):(r.recordedBy||""),
    identificationVerificationStatus:r.identificationVerificationStatus||"",
    minimumElevationM:n(r.minimumElevationInMeters),
    license:r.license||"",
    sensitiveCategory:r.dataGeneralizations?"generalized":r.informationWithheld?"withheld":"",
    dataGeneralizations:generalized
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
    // Obscured observations must use the public uncertainty radius. Using the
    // original positional_accuracy would overstate precision for the displayed
    // generalized coordinate and distort candidate ranking.
    uncertaintyM:n(o.obscured
      ? (o.public_positional_accuracy??o.positional_accuracy)
      : o.positional_accuracy),
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
    sensitiveCategory:o.geoprivacy||(o.obscured?"obscured":""),
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
    x.mediaLicense=[...new Set(
      [x.mediaLicense,r.mediaLicense].filter(Boolean).flatMap(v=>String(v).split("; ").filter(Boolean))
    )].join("; ");

    if((r.uncertaintyM??Infinity)<(x.uncertaintyM??Infinity)){
      x.uncertaintyM=r.uncertaintyM;
    }
    if(!x.locality&&r.locality)x.locality=r.locality;
    if(!x.commonName&&r.commonName)x.commonName=r.commonName;
    if(!x.datasetName&&r.datasetName)x.datasetName=r.datasetName;
    if(!x.datasetUUID&&r.datasetUUID)x.datasetUUID=r.datasetUUID;
    if(!x.datasetURL&&r.datasetURL)x.datasetURL=r.datasetURL;
    if(!x.sensitiveCategory&&r.sensitiveCategory)x.sensitiveCategory=r.sensitiveCategory;
    if(!x.license&&r.license)x.license=r.license;
  }

  return [...m.values()];
}


const inatPlaceCache=new Map([["TW",7887]]);

async function resolveInatCountryPlaceId(countryCode,countryName){
  if(!countryCode||countryCode==="ALL")return null;
  if(inatPlaceCache.has(countryCode))return inatPlaceCache.get(countryCode);

  const q=countryName||countryCode;
  const url=new URL("https://api.inaturalist.org/v1/places/autocomplete");
  url.searchParams.set("q",q);
  url.searchParams.set("per_page","20");

  const d=await fetchJson(url);
  const results=d?.results||[];

  const normalize=s=>String(s||"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
  const nq=normalize(q);

  const exactCountry=
    results.find(p=>Number(p.admin_level)===0 && normalize(p.name)===nq) ||
    results.find(p=>Number(p.admin_level)===0 && normalize(p.display_name)===nq) ||
    results.find(p=>Number(p.admin_level)===0) ||
    results.find(p=>normalize(p.name)===nq) ||
    results[0];

  if(!exactCountry?.id){
    throw new Error(`iNaturalist 無法解析國家：${q}`);
  }

  inatPlaceCache.set(countryCode,exactCountry.id);
  return exactCountry.id;
}

export async function taxonomy(q,context={}){
  const countryCode=String(context.countryCode||"TW").toUpperCase();
  const defs=[];

  if(countryCode==="TW"){
    defs.push({
      name:"TaiCOL",
      promise:fetchJson(`https://api.taicol.tw/v2/nameMatch?name=${encodeURIComponent(q)}`)
    });
  }

  defs.push(
    {
      name:"GBIF taxonomy",
      promise:fetchJson(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(q)}`)
    },
    {
      name:"iNaturalist taxonomy",
      promise:fetchJson(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(q)}&locale=${context.language==="en"?"en":"zh-TW"}&per_page=10`)
    }
  );

  const jobs=await Promise.allSettled(defs.map(x=>x.promise));
  const resultByName=new Map(
    defs.map((d,i)=>[d.name,jobs[i].status==="fulfilled"?jobs[i].value:null])
  );

  const tai=resultByName.get("TaiCOL")?.data?.[0]||null;
  const gb=resultByName.get("GBIF taxonomy")||null;
  const il=resultByName.get("iNaturalist taxonomy")?.results||[];

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
    countryCode,
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

export async function occurrences(taxon,context={}){
  const sci=taxon.scientificName||taxon.query;
  const countryCode=String(context.countryCode||"TW").toUpperCase();
  const countryName=context.countryName||countryCode;

  const gbif=new URL("https://api.gbif.org/v1/occurrence/search");
  if(taxon.gbifKey)gbif.searchParams.set("taxonKey",taxon.gbifKey);
  else gbif.searchParams.set("scientificName",sci);
  if(countryCode!=="ALL")gbif.searchParams.set("country",countryCode);
  gbif.searchParams.set("hasCoordinate","true");
  gbif.searchParams.set("limit","300");

  const buildINat=async()=>{
    const inat=new URL("https://api.inaturalist.org/v1/observations");
    if(taxon.inatTaxonId)inat.searchParams.set("taxon_id",taxon.inatTaxonId);
    else inat.searchParams.set("taxon_name",sci);

    if(countryCode!=="ALL"){
      const placeId=await resolveInatCountryPlaceId(countryCode,countryName);
      inat.searchParams.set("place_id",String(placeId));
    }

    inat.searchParams.set("geo","true");
    inat.searchParams.set("verifiable","true");
    inat.searchParams.set("per_page","200");
    inat.searchParams.set("order_by","observed_on");
    inat.searchParams.set("order","desc");
    return await fetchJson(inat);
  };

  const defs=[
    {name:"GBIF",promise:fetchJson(gbif)},
    {name:"iNaturalist",promise:buildINat()}
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
    warnings:defs.flatMap((x,i)=>jobs[i].status==="rejected"?[x.name]:[]),
    countryCode
  };
}
