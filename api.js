function createAbortError(){
  try{return new DOMException("搜尋已取消","AbortError")}
  catch(_){const error=new Error("搜尋已取消");error.name="AbortError";return error}
}

function throwIfAborted(signal){
  if(signal?.aborted)throw createAbortError();
}

async function abortableDelay(ms,signal){
  if(!ms)return;
  throwIfAborted(signal);
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(done,ms);
    function done(){
      signal?.removeEventListener("abort",aborted);
      resolve();
    }
    function aborted(){
      clearTimeout(timer);
      reject(createAbortError());
    }
    signal?.addEventListener("abort",aborted,{once:true});
  });
}

async function fetchJson(url,options={}){
  const timeout=Number(options.timeout)||18000;
  const parentSignal=options.signal;
  throwIfAborted(parentSignal);

  const c=new AbortController();
  let timedOut=false;
  const abortFromParent=()=>c.abort();
  parentSignal?.addEventListener("abort",abortFromParent,{once:true});
  const timer=setTimeout(()=>{
    timedOut=true;
    c.abort();
  },timeout);

  try{
    const r=await fetch(url,{
      headers:{Accept:"application/json"},
      signal:c.signal,
      cache:"no-store"
    });
    if(!r.ok){
      const error=new Error(`HTTP ${r.status}`);
      error.status=r.status;
      const retryAfter=r.headers?.get?.("retry-after");
      if(retryAfter){
        const seconds=Number(retryAfter);
        const dateMs=Date.parse(retryAfter)-Date.now();
        error.retryAfterMs=Number.isFinite(seconds)
          ? Math.max(0,seconds*1000)
          : Math.max(0,dateMs||0);
      }
      throw error;
    }
    return await r.json();
  }catch(error){
    if(timedOut&&!parentSignal?.aborted){
      const timeoutError=new Error(`Request timeout after ${timeout} ms`);
      timeoutError.status=408;
      throw timeoutError;
    }
    throw error;
  }finally{
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort",abortFromParent);
  }
}

async function fetchJsonWithRetry(url,options={}){
  const requestedRetries=Number(options.retries);
  const retries=Number.isFinite(requestedRetries)
    ? Math.max(0,Math.trunc(requestedRetries))
    : 2;
  let lastError=null;

  for(let attempt=0;attempt<=retries;attempt++){
    try{return await fetchJson(url,options)}
    catch(error){
      if(options.signal?.aborted)throw createAbortError();
      lastError=error;
      const retryable=
        error?.status===408||error?.status===429||error?.status>=500||
        error?.status===undefined;
      if(!retryable||attempt>=retries)throw error;
      const delay=Number.isFinite(error.retryAfterMs)
        ? error.retryAfterMs
        : (Number(options.retryDelayMs)||800)*(2**attempt);
      await abortableDelay(delay,options.signal);
    }
  }
  throw lastError;
}

function reportProgress(onProgress,detail){
  if(typeof onProgress!=="function")return;
  try{onProgress(detail)}catch(error){console.warn("Occurrence progress callback failed",error)}
}

function n(v){
  if(v===null||v===undefined||v==="")return null;
  const x=Number(v);
  return Number.isFinite(x)?x:null;
}

function validCoordinate(lat,lon){
  return Number.isFinite(lat)&&Number.isFinite(lon)&&
    lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
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

export function normalizeGBIF(r){
  const lat=n(r.decimalLatitude),lon=n(r.decimalLongitude);
  if(!validCoordinate(lat,lon))return null;
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

export function normalizeINat(o){
  const c=o.geojson?.coordinates;
  if(!Array.isArray(c)||c.length<2)return null;
  const lon=n(c[0]),lat=n(c[1]);
  if(!validCoordinate(lat,lon))return null;

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

export function mergeOccurrences(records){
  const m=new Map();

  for(const r of (records||[]).filter(Boolean)){
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

async function resolveInatCountryPlaceId(countryCode,countryName,options={}){
  if(!countryCode||countryCode==="ALL")return null;
  if(inatPlaceCache.has(countryCode))return inatPlaceCache.get(countryCode);

  const q=countryName||countryCode;
  const url=new URL("https://api.inaturalist.org/v1/places/autocomplete");
  url.searchParams.set("q",q);
  url.searchParams.set("per_page","20");

  const d=await fetchJsonWithRetry(url,options);
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
      promise:fetchJson(`https://api.taicol.tw/v2/nameMatch?name=${encodeURIComponent(q)}`,{signal:context.signal})
    });
  }

  defs.push(
    {
      name:"GBIF taxonomy",
      promise:fetchJson(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(q)}`,{signal:context.signal})
    },
    {
      name:"iNaturalist taxonomy",
      promise:fetchJson(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(q)}&locale=${context.language==="en"?"en":"zh-TW"}&per_page=10`,{signal:context.signal})
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

function sourceFailure(source,error,loadedRecords=[],fetched=0,total=null,onProgress=null){
  const cancelled=error?.name==="AbortError";
  const status=cancelled
    ? "cancelled"
    : (loadedRecords.length||fetched)?"partial":"unavailable";
  const result={
    source,records:loadedRecords,fetched,total,status,capped:false,
    error:cancelled?null:(error?.message||String(error||"Unknown error"))
  };
  reportProgress(onProgress,{...result,loaded:loadedRecords.length,done:true});
  return result;
}

async function fetchAllGbif(baseUrl,options={}){
  const source="GBIF";
  const pageSize=300;
  const hardLimit=100000;
  const records=[];
  let fetched=0,total=null,page=0;
  reportProgress(options.onProgress,{source,loaded:0,fetched:0,total:null,page:0,status:"loading",done:false});

  try{
    while(fetched<hardLimit){
      throwIfAborted(options.signal);
      const limit=Math.min(pageSize,hardLimit-fetched);
      const url=new URL(baseUrl);
      url.searchParams.set("limit",String(limit));
      url.searchParams.set("offset",String(fetched));
      const data=await fetchJsonWithRetry(url,options);
      const raw=Array.isArray(data?.results)?data.results:[];
      const normalized=raw.map(normalizeGBIF).filter(Boolean);
      records.push(...normalized);
      fetched+=raw.length;
      page++;
      const reportedTotal=n(data?.count);
      if(reportedTotal!==null)total=reportedTotal;

      if(raw.length===0&&total!==null&&fetched<Math.min(total,hardLimit)){
        throw new Error("GBIF returned an empty page before all records were available");
      }

      const complete=
        data?.endOfRecords===true||raw.length===0||
        (total!==null&&fetched>=Math.min(total,hardLimit));
      const capped=complete&&total!==null&&total>hardLimit&&fetched>=hardLimit;
      reportProgress(options.onProgress,{
        source,loaded:records.length,fetched,total,page,
        status:complete?(capped?"capped":"ok"):"loading",
        capped,done:complete
      });
      if(complete){
        return {source,records,fetched,total,status:capped?"capped":"ok",capped,error:null};
      }
      await abortableDelay(options.gbifDelayMs??120,options.signal);
    }

    const capped=total===null||total>hardLimit;
    const status=capped?"capped":"ok";
    const result={source,records,fetched,total,status,capped,error:null};
    reportProgress(options.onProgress,{...result,loaded:records.length,page,done:true});
    return result;
  }catch(error){
    return sourceFailure(source,error,records,fetched,total,options.onProgress);
  }
}

async function fetchAllINat(baseUrl,options={}){
  const source="iNaturalist";
  const pageSize=200;
  const records=[];
  let fetched=0,total=null,page=1;
  reportProgress(options.onProgress,{source,loaded:0,fetched:0,total:null,page:0,status:"loading",done:false});

  try{
    while(true){
      throwIfAborted(options.signal);
      const url=new URL(baseUrl);
      url.searchParams.set("per_page",String(pageSize));
      url.searchParams.set("page",String(page));
      const data=await fetchJsonWithRetry(url,options);
      const raw=Array.isArray(data?.results)?data.results:[];
      const normalized=raw.map(normalizeINat).filter(Boolean);
      records.push(...normalized);
      fetched+=raw.length;
      const reportedTotal=n(data?.total_results);
      if(reportedTotal!==null)total=reportedTotal;

      if(raw.length===0&&total!==null&&fetched<total){
        throw new Error("iNaturalist returned an empty page before all records were available");
      }

      const complete=total!==null
        ? fetched>=total
        : raw.length<pageSize;
      reportProgress(options.onProgress,{
        source,loaded:records.length,fetched,total,page,
        status:complete?"ok":"loading",capped:false,done:complete
      });
      if(complete)return {source,records,fetched,total,status:"ok",capped:false,error:null};

      page++;
      // iNaturalist allows 100 requests/minute and asks clients to stay at or
      // below 60. A 1.1 second interval remains below that recommendation.
      await abortableDelay(options.inatDelayMs??1100,options.signal);
    }
  }catch(error){
    return sourceFailure(source,error,records,fetched,total,options.onProgress);
  }
}

export async function occurrences(taxon,context={},options={}){
  const sci=taxon.scientificName||taxon.query;
  const countryCode=String(context.countryCode||"TW").toUpperCase();
  const countryName=context.countryName||countryCode;

  const gbif=new URL("https://api.gbif.org/v1/occurrence/search");
  if(taxon.gbifKey)gbif.searchParams.set("taxonKey",taxon.gbifKey);
  else gbif.searchParams.set("scientificName",sci);
  if(countryCode!=="ALL")gbif.searchParams.set("country",countryCode);
  gbif.searchParams.set("hasCoordinate","true");

  const buildINat=async()=>{
    const inat=new URL("https://api.inaturalist.org/v1/observations");
    if(taxon.inatTaxonId)inat.searchParams.set("taxon_id",taxon.inatTaxonId);
    else inat.searchParams.set("taxon_name",sci);

    if(countryCode!=="ALL"){
      const placeId=await resolveInatCountryPlaceId(countryCode,countryName,options);
      inat.searchParams.set("place_id",String(placeId));
    }

    inat.searchParams.set("geo","true");
    inat.searchParams.set("verifiable","true");
    inat.searchParams.set("order_by","observed_on");
    inat.searchParams.set("order","desc");
    return inat;
  };

  const gbifJob=fetchAllGbif(gbif,options);
  const inatJob=(async()=>{
    try{return await fetchAllINat(await buildINat(),options)}
    catch(error){return sourceFailure("iNaturalist",error,[],0,null,options.onProgress)}
  })();
  const [gbifResult,inatResult]=await Promise.all([gbifJob,inatJob]);
  const results={GBIF:gbifResult,iNaturalist:inatResult};
  const warnings=Object.values(results)
    .filter(result=>["partial","unavailable"].includes(result.status))
    .map(result=>result.source);

  return {
    records:mergeOccurrences([...gbifResult.records,...inatResult.records]),
    sourceCounts:{
      GBIF:gbifResult.records.length,
      iNaturalist:inatResult.records.length
    },
    sourceFetched:{
      GBIF:gbifResult.fetched,
      iNaturalist:inatResult.fetched
    },
    sourceStatus:{
      GBIF:gbifResult.status,
      iNaturalist:inatResult.status
    },
    sourceTotals:{
      GBIF:gbifResult.total,
      iNaturalist:inatResult.total
    },
    sourceTruncated:{
      GBIF:gbifResult.status!=="ok"||
        (gbifResult.total!==null&&gbifResult.fetched<gbifResult.total),
      iNaturalist:inatResult.status!=="ok"||
        (inatResult.total!==null&&inatResult.fetched<inatResult.total)
    },
    sourceCapped:{GBIF:gbifResult.capped,iNaturalist:false},
    sourceErrors:{GBIF:gbifResult.error,iNaturalist:inatResult.error},
    warnings,
    cancelled:Boolean(options.signal?.aborted)||
      Object.values(results).some(result=>result.status==="cancelled"),
    countryCode
  };
}
