import {put,get,del,byProfile,deleteProfileData,all} from "./db.js?v=0.16.0";
import {hashEmail,esc,haversineKm,googleMapsUrl,googleMapsRouteUrl,googleMapsRouteSegments,downloadText,toCSV,geojsonPoints,gpxWaypoints,gpxTrack,parseGpx,sanitizeImage,obscurePoint,qcRecord} from "./utils.js?v=0.16.0";
import {taxonomy,occurrences} from "./api.js?v=0.16.0";
import {rankCandidates} from "./ranking.js?v=0.16.0";

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

const COUNTRIES=[["AF","Afghanistan"],["AL","Albania"],["DZ","Algeria"],["AS","American Samoa"],["AD","Andorra"],["AO","Angola"],["AI","Anguilla"],["AQ","Antarctica"],["AG","Antigua and Barbuda"],["AR","Argentina"],["AM","Armenia"],["AW","Aruba"],["AU","Australia"],["AT","Austria"],["AZ","Azerbaijan"],["BS","Bahamas"],["BH","Bahrain"],["BD","Bangladesh"],["BB","Barbados"],["BY","Belarus"],["BE","Belgium"],["BZ","Belize"],["BJ","Benin"],["BM","Bermuda"],["BT","Bhutan"],["BO","Bolivia"],["BQ","Bonaire, Sint Eustatius and Saba"],["BA","Bosnia and Herzegovina"],["BW","Botswana"],["BV","Bouvet Island"],["BR","Brazil"],["IO","British Indian Ocean Territory"],["BN","Brunei"],["BG","Bulgaria"],["BF","Burkina Faso"],["BI","Burundi"],["CV","Cabo Verde"],["KH","Cambodia"],["CM","Cameroon"],["CA","Canada"],["KY","Cayman Islands"],["CF","Central African Republic"],["TD","Chad"],["CL","Chile"],["CN","China"],["CX","Christmas Island"],["CC","Cocos (Keeling) Islands"],["CO","Colombia"],["KM","Comoros"],["CK","Cook Islands"],["CR","Costa Rica"],["HR","Croatia"],["CU","Cuba"],["CW","Curaçao"],["CY","Cyprus"],["CZ","Czechia"],["CI","Côte d'Ivoire"],["CD","Democratic Republic of the Congo"],["DK","Denmark"],["DJ","Djibouti"],["DM","Dominica"],["DO","Dominican Republic"],["EC","Ecuador"],["EG","Egypt"],["SV","El Salvador"],["GQ","Equatorial Guinea"],["ER","Eritrea"],["EE","Estonia"],["SZ","Eswatini"],["ET","Ethiopia"],["FK","Falkland Islands (Malvinas)"],["FO","Faroe Islands"],["FJ","Fiji"],["FI","Finland"],["FR","France"],["GF","French Guiana"],["PF","French Polynesia"],["TF","French Southern Territories"],["GA","Gabon"],["GM","Gambia"],["GE","Georgia"],["DE","Germany"],["GH","Ghana"],["GI","Gibraltar"],["GR","Greece"],["GL","Greenland"],["GD","Grenada"],["GP","Guadeloupe"],["GU","Guam"],["GT","Guatemala"],["GG","Guernsey"],["GN","Guinea"],["GW","Guinea-Bissau"],["GY","Guyana"],["HT","Haiti"],["HM","Heard Island and McDonald Islands"],["HN","Honduras"],["HK","Hong Kong"],["HU","Hungary"],["IS","Iceland"],["IN","India"],["ID","Indonesia"],["IR","Iran"],["IQ","Iraq"],["IE","Ireland"],["IM","Isle of Man"],["IL","Israel"],["IT","Italy"],["JM","Jamaica"],["JP","Japan"],["JE","Jersey"],["JO","Jordan"],["KZ","Kazakhstan"],["KE","Kenya"],["KI","Kiribati"],["KW","Kuwait"],["KG","Kyrgyzstan"],["LA","Laos"],["LV","Latvia"],["LB","Lebanon"],["LS","Lesotho"],["LR","Liberia"],["LY","Libya"],["LI","Liechtenstein"],["LT","Lithuania"],["LU","Luxembourg"],["MO","Macao"],["MG","Madagascar"],["MW","Malawi"],["MY","Malaysia"],["MV","Maldives"],["ML","Mali"],["MT","Malta"],["MH","Marshall Islands"],["MQ","Martinique"],["MR","Mauritania"],["MU","Mauritius"],["YT","Mayotte"],["MX","Mexico"],["FM","Micronesia"],["MD","Moldova"],["MC","Monaco"],["MN","Mongolia"],["ME","Montenegro"],["MS","Montserrat"],["MA","Morocco"],["MZ","Mozambique"],["MM","Myanmar"],["NA","Namibia"],["NR","Nauru"],["NP","Nepal"],["NL","Netherlands"],["NC","New Caledonia"],["NZ","New Zealand"],["NI","Nicaragua"],["NE","Niger"],["NG","Nigeria"],["NU","Niue"],["NF","Norfolk Island"],["KP","North Korea"],["MK","North Macedonia"],["MP","Northern Mariana Islands"],["NO","Norway"],["OM","Oman"],["PK","Pakistan"],["PW","Palau"],["PS","Palestine"],["PA","Panama"],["PG","Papua New Guinea"],["PY","Paraguay"],["PE","Peru"],["PH","Philippines"],["PN","Pitcairn"],["PL","Poland"],["PT","Portugal"],["PR","Puerto Rico"],["QA","Qatar"],["CG","Republic of the Congo"],["RO","Romania"],["RU","Russia"],["RW","Rwanda"],["RE","Réunion"],["BL","Saint Barthélemy"],["SH","Saint Helena, Ascension and Tristan da Cunha"],["KN","Saint Kitts and Nevis"],["LC","Saint Lucia"],["MF","Saint Martin (French part)"],["PM","Saint Pierre and Miquelon"],["VC","Saint Vincent and the Grenadines"],["WS","Samoa"],["SM","San Marino"],["ST","Sao Tome and Principe"],["SA","Saudi Arabia"],["SN","Senegal"],["RS","Serbia"],["SC","Seychelles"],["SL","Sierra Leone"],["SG","Singapore"],["SX","Sint Maarten (Dutch part)"],["SK","Slovakia"],["SI","Slovenia"],["SB","Solomon Islands"],["SO","Somalia"],["ZA","South Africa"],["GS","South Georgia and the South Sandwich Islands"],["KR","South Korea"],["SS","South Sudan"],["ES","Spain"],["LK","Sri Lanka"],["SD","Sudan"],["SR","Suriname"],["SJ","Svalbard and Jan Mayen"],["SE","Sweden"],["CH","Switzerland"],["SY","Syria"],["TW","Taiwan"],["TJ","Tajikistan"],["TZ","Tanzania"],["TH","Thailand"],["TL","Timor-Leste"],["TG","Togo"],["TK","Tokelau"],["TO","Tonga"],["TT","Trinidad and Tobago"],["TN","Tunisia"],["TM","Turkmenistan"],["TC","Turks and Caicos Islands"],["TV","Tuvalu"],["TR","Türkiye"],["UG","Uganda"],["UA","Ukraine"],["AE","United Arab Emirates"],["GB","United Kingdom"],["US","United States"],["UM","United States Minor Outlying Islands"],["UY","Uruguay"],["UZ","Uzbekistan"],["VU","Vanuatu"],["VA","Vatican City"],["VE","Venezuela"],["VN","Vietnam"],["VG","Virgin Islands, British"],["VI","Virgin Islands, U.S."],["WF","Wallis and Futuna"],["EH","Western Sahara"],["YE","Yemen"],["ZM","Zambia"],["ZW","Zimbabwe"],["AX","Åland Islands"]];
const countryDisplayNames=typeof Intl.DisplayNames==="function"
  ? new Intl.DisplayNames(["zh-Hant"],{type:"region"})
  : null;

function countryLabel(code,englishName=""){
  if(code==="ALL")return "全球（不限制國家）";
  try{return countryDisplayNames?.of(code)||englishName||code}
  catch(_){return englishName||code}
}

function searchContext(){
  return {
    countryCode:state.profile?.countryCode||"TW",
    countryName:state.profile?.countryName||"Taiwan"
  };
}

const state={
  profile:null,settings:null,map:null,cluster:null,tripLayer:null,me:null,currentPos:null,
  taxon:null,allRecords:[],filtered:[],markerMap:new Map(),candidates:[],
  trips:[],activeTrip:null,records:[],recordGps:null,track:[],trackWatch:null,
  baseLayers:{},activeBaseLayer:null,
  selectedOccurrenceId:null,selectedTripPointId:null,
  fieldModeIndex:0,fieldModeReturn:false,
  customPointDraft:null,customPointPickMode:false,customPointTempMarker:null,customPointPreviewMarker:null
};
const setStatus=t=>$("#status").textContent=t;

async function boot(){
  setupCountrySelector();
  setupGate();
  setupStatic();
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(console.warn);
}

function setupCountrySelector(){
  const select=$("#profileCountry");
  if(!select)return;

  const priority=["TW","JP","KR","CN","HK","MO","SG","MY","TH","PH","ID","VN","AU","NZ","US","CA","GB"];
  const byCode=new Map(COUNTRIES);

  const options=[
    ["ALL","Global"],
    ...priority.map(code=>[code,byCode.get(code)]).filter(x=>x[1]),
    ...COUNTRIES.filter(([code])=>!priority.includes(code))
      .sort((a,b)=>countryLabel(a[0],a[1]).localeCompare(countryLabel(b[0],b[1]),"zh-Hant"))
  ];

  const seen=new Set();
  select.innerHTML=options
    .filter(([code])=>{
      if(seen.has(code))return false;
      seen.add(code);
      return true;
    })
    .map(([code,name])=>`<option value="${esc(code)}" data-name="${esc(name)}">${esc(countryLabel(code,name))}${code!=="ALL"?` (${code})`:""}</option>`)
    .join("");

  select.value="TW";
}

function setupGate(){
  $("#openProfileBtn").onclick=openProfile;
  $("#profileEmail").addEventListener("keydown",e=>{if(e.key==="Enter")openProfile()});
}
async function openProfile(){
  const email=$("#profileEmail").value.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    $("#profileError").textContent="請輸入有效電子郵件。";
    return;
  }

  const btn=$("#openProfileBtn");
  btn.disabled=true;
  btn.textContent="正在開啟…";
  $("#profileError").textContent="";

  try{
    const countryCode=$("#profileCountry").value||"TW";
    const selectedOption=$("#profileCountry").selectedOptions?.[0];
    const countryName=selectedOption?.dataset?.name||countryCode;
    const countryLabelText=countryLabel(countryCode,countryName);

    // Keep Taiwan on the legacy email-only profile ID so existing users retain
    // all previous Taiwan data. Other countries get their own local workspace.
    const id=countryCode==="TW"
      ? hashEmail(email)
      : hashEmail(`${email}|${countryCode}`);

    const existing=await get("profiles",id);
    state.profile={
      ...(existing||{}),
      id,
      email,
      countryCode,
      countryName,
      countryLabel:countryLabelText,
      createdAt:existing?.createdAt||new Date().toISOString()
    };
    await put("profiles",{...state.profile,lastOpenedAt:new Date().toISOString()});

    state.settings=
      await get("settings",`${id}:settings`) ||
      {id:`${id}:settings`,profileId:id,specimenPrefix:"FS",specimenCounter:1,customPoints:[]};

    if(!Array.isArray(state.settings.customPoints))state.settings.customPoints=[];
    await put("settings",state.settings);

    // v0.14.0 removed Offline PMTiles. Clean legacy map blobs if present.
    await del("cache",`${id}:offline-map`);
    await del("offlineMaps",`${id}:offline`);

    await loadProfileData();

    // Enter the app before initializing optional map integrations.
    $("#profileGate").classList.add("hidden");
    $("#app").classList.remove("hidden");
    $("#profileLabel").textContent=email;
    $("#countryBadge").textContent=countryCode==="ALL"?"GLOBAL":countryCode;
    $("#countryBadge").title=countryLabelText;
    $("#profileSummary").innerHTML=
      `${esc(email)}<br>${esc(countryLabelText)} (${esc(countryCode)})<br><span class="meta">本機 workspace ID：${esc(id)}</span>`;
    $("#specimenPrefix").value=state.settings.specimenPrefix||"FS";
    $("#specimenCounter").value=state.settings.specimenCounter||1;

    try{
      if(!state.map)await initMap();
    }catch(mapError){
      console.error("Map initialization failed",mapError);
      $("#map").innerHTML=
        `<div class="map-load-error">地圖載入失敗，但 Local Profile 已成功開啟。<br><small>${esc(mapError.message||mapError)}</small></div>`;
      setStatus("Local Profile 已開啟；地圖插件載入失敗，請重新整理或檢查網路。");
    }

    renderAll();
  }catch(err){
    console.error("Open profile failed",err);
    $("#profileError").textContent=
      `無法開啟本機資料：${err.message||err}`;
  }finally{
    btn.disabled=false;
    btn.textContent="開啟 FieldScout";
  }
}
async function loadProfileData(){
  state.trips=(await byProfile("trips",state.profile.id)).sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||""));
  state.records=(await byProfile("records",state.profile.id)).sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||""));

  // One-time migration from v0.2–v0.6 localStorage.
  if(!state.settings.legacyMigrationChecked){
    let legacyTrip=[],legacyRecords=[];
    try{legacyTrip=JSON.parse(localStorage.getItem("fieldscout_trip")||"[]")}catch(_){}
    try{legacyRecords=JSON.parse(localStorage.getItem("fieldscout_records")||"[]")}catch(_){}

    if((legacyTrip.length||legacyRecords.length) &&
       confirm(`偵測到舊版 FieldScout 資料：${legacyTrip.length} 個行程點、${legacyRecords.length} 筆採集紀錄。\n\n要匯入目前 profile：${state.profile.email} 嗎？`)){
      if(legacyTrip.length){
        const now=new Date().toISOString();
        const trip={
          id:crypto.randomUUID(),profileId:state.profile.id,
          name:"Migrated legacy trip",date:now.slice(0,10),
          targetTaxon:"",status:"planned",notes:"由舊版 localStorage 自動匯入",
          points:legacyTrip.map((p,i)=>({
            id:String(p.id||`legacy-trip-${i}`),
            name:p.name||`Legacy point ${i+1}`,
            lat:Number(p.lat),lon:Number(p.lon),
            source:p.source||"legacy",visitStatus:"unvisited"
          })).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)),
          track:[],createdAt:now,updatedAt:now
        };
        await put("trips",trip);
      }

      for(let i=0;i<legacyRecords.length;i++){
        const r=legacyRecords[i],now=new Date().toISOString();
        await put("records",{
          id:String(r.id||crypto.randomUUID()),profileId:state.profile.id,
          specimenId:r.specimenId||r.specimen||`LEGACY-${i+1}`,
          count:Math.max(1,Number(r.count)||1),
          taxon:r.taxon||"",microhabitat:r.microhabitat||"",
          method:r.method||"",notes:r.notes||"",
          lat:r.lat==null?null:Number(r.lat),lon:r.lon==null?null:Number(r.lon),
          accuracyM:r.accuracyM??r.accuracy??null,
          batchSiteId:null,photoIds:[],
          createdAt:r.createdAt||r.time||now,
          updatedAt:r.updatedAt||r.time||now
        });
      }
      state.settings.legacyMigrationChecked=true;
      await put("settings",state.settings);
      setStatus("舊版資料已匯入目前 Local Profile。");
    }else{
      state.settings.legacyMigrationChecked=true;
      await put("settings",state.settings);
    }
  }

  state.trips=(await byProfile("trips",state.profile.id)).sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||""));
  state.records=(await byProfile("records",state.profile.id)).sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||""));
  state.activeTrip=state.trips[0]||null;
}

function setupStatic(){
  $$(".tab").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  $("#locateBtn").onclick=()=>locate(true);
  $("#customPointBtn").onclick=()=>openCustomPointEditor();
  $("#newCustomPointBtn").onclick=()=>openCustomPointEditor();
  $("#manageCustomPointsBtn").onclick=showCustomPointManager;
  $("#customPointPickDoneBtn").onclick=finishCustomPointMapPick;
  $("#customPointPickCancelBtn").onclick=cancelCustomPointMapPick;
  $("#basemapSelect").onchange=()=>selectBasemap($("#basemapSelect").value);
  $("#searchBtn").onclick=searchTaxon;$("#taxonInput").addEventListener("keydown",e=>{if(e.key==="Enter")searchTaxon()});
  let at=null;$("#taxonInput").addEventListener("input",()=>{clearTimeout(at);const q=$("#taxonInput").value.trim();if(q.length<2){$("#autocomplete").classList.add("hidden");return}at=setTimeout(()=>autocomplete(q),250)});
  $("#applyFiltersBtn").onclick=applyFilters;
  $("#resetFiltersBtn").onclick=resetFilters;
  $("#sortMode").onchange=applyFilters;
  $("#clearMonthChartBtn").onclick=()=>{
    $("#filterMonth").value="";
    applyFilters();
    setStatus("已顯示全部月份。");
  };
  $("#addAllBtn").onclick=addAllVisible;$("#rerankBtn").onclick=rerank;
  $("#searchCsvBtn").onclick=exportSearchCsv;$("#searchGeojsonBtn").onclick=exportSearchGeoJSON;
  $("#fieldGoTripBtn").onclick=()=>switchTab("trips");
  $("#fieldEmptyTripBtn").onclick=()=>switchTab("trips");
  $("#manageTripsBtn").onclick=showTripManager;
  $("#fieldManageTripsBtn").onclick=showTripManager;
  $("#fieldTripSelect").onchange=()=>{
    selectTrip($("#fieldTripSelect").value);
    state.fieldModeIndex=preferredFieldModeIndex();
    renderFieldMode();
  };
  $("#fieldModePrevBtn").onclick=()=>moveFieldMode(-1);
  $("#fieldModeNextBtn").onclick=()=>moveFieldMode(1);
  $("#fieldModeLocateBtn").onclick=refreshFieldModeGps;
  $("#fieldModeArrivedBtn").onclick=()=>setFieldPointStatus("arrived");
  $("#fieldModeSurveyedBtn").onclick=()=>setFieldPointStatus("surveyed");
  $("#fieldModeInaccessibleBtn").onclick=()=>setFieldPointStatus("inaccessible");
  $("#fieldModeRevisitBtn").onclick=()=>setFieldPointStatus("revisit");
  $("#fieldModeQuickRecordBtn").onclick=quickRecordFromFieldMode;
  $("#newTripBtn").onclick=newTrip;
  $("#tripSelect").onchange=()=>selectTrip($("#tripSelect").value);
  $("#saveTripMetaBtn").onclick=saveTripMeta;
  $("#routeOptimizeBtn").onclick=optimizeRoute;
  $("#routeNorthSouthBtn").onclick=sortRouteNorthSouth;
  $("#clearTripPointsBtn").onclick=clearAllTripPoints;
  $("#tripCsvBtn").onclick=exportTripCsv;$("#tripGeojsonBtn").onclick=exportTripGeoJSON;$("#tripGpxBtn").onclick=exportTripGpx;$("#gpxImport").onchange=importGpx;
  $("#trackStartBtn").onclick=startTrack;$("#trackStopBtn").onclick=stopTrack;$("#trackExportBtn").onclick=()=>downloadText("fieldscout_track.gpx","application/gpx+xml",gpxTrack(state.track));
  $("#recordGpsBtn").onclick=captureRecordGps;
  $("#useTripPointGpsBtn").onclick=useTripPointGps;
  $("#nextSpecimenBtn").onclick=nextSpecimen;
  $("#recordForm").onsubmit=saveRecord;
  $("#cancelEditBtn").onclick=()=>{
    const returnToField=state.fieldModeReturn;
    resetRecordForm();
    if(returnToField){
      state.fieldModeReturn=false;
      switchTab("field");
      renderFieldMode();
    }
  };$("#recordsCsvBtn").onclick=exportRecordsCsv;$("#recordsGeojsonBtn").onclick=exportRecordsGeoJSON;$("#recordsSensitiveCsvBtn").onclick=exportSensitiveCsv;
  $("#saveSpecimenSettingsBtn").onclick=saveSpecimenSettings;
  $("#backupBtn").onclick=exportBackup;$("#restoreInput").onchange=restoreBackup;
  $("#switchProfileBtn").onclick=switchProfile;$("#profileBtn").onclick=()=>switchTab("settings");$("#deleteProfileBtn").onclick=deleteProfile;
  $("#modalClose").onclick=()=>$("#modal").classList.add("hidden");$("#modal").onclick=e=>{if(e.target===$("#modal"))$("#modal").classList.add("hidden")};
  window.addEventListener("online",()=>$("#netBadge").textContent="ONLINE");window.addEventListener("offline",()=>$("#netBadge").textContent="OFFLINE");
}

function switchTab(name){
  $$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  $$(".tab-panel").forEach(p=>p.classList.add("hidden"));
  const panel=$(`#tab-${name}`);
  if(panel)panel.classList.remove("hidden");

  if(name==="field"){
    state.fieldModeIndex=preferredFieldModeIndex();
    renderFieldMode();
    if(!state.currentPos)refreshFieldModeGps(false);
  }

  if(state.map)setTimeout(()=>state.map.invalidateSize(),60);
}

async function initMap(){
  const initialView=state.profile?.countryCode==="TW"
    ? {center:[23.7,121],zoom:7}
    : {center:[20,0],zoom:2};
  state.map=L.map("map",{zoomControl:false}).setView(initialView.center,initialView.zoom);

  state.baseLayers.osm=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
  });

  state.baseLayers.topo=L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",{
    maxZoom:17,
    attribution:'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org/" target="_blank">OpenTopoMap</a> (CC-BY-SA)'
  });

  state.baseLayers.satellite=L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom:19,
      attribution:'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    }
  );

  state.activeBaseLayer=state.baseLayers.osm;
  state.activeBaseLayer.addTo(state.map);

  state.cluster=(typeof L.markerClusterGroup==="function")
    ? L.markerClusterGroup({showCoverageOnHover:false,spiderfyOnMaxZoom:true})
    : L.layerGroup();
  state.cluster.addTo(state.map);

  if(typeof L.markerClusterGroup!=="function"){
    console.warn("Leaflet.markercluster unavailable; using normal layer group.");
  }

  state.tripLayer=L.layerGroup().addTo(state.map);
  L.control.zoom({position:"topright"}).addTo(state.map);

  state.map.on("moveend",()=>{
    if($("#filterMapBounds")?.checked)applyFilters();
  });

  state.map.on("click",e=>{
    if(!state.customPointPickMode)return;
    const ll=e.latlng;
    state.customPointDraft={...(state.customPointDraft||{}),lat:ll.lat,lon:ll.lng};
    if(state.customPointTempMarker){
      state.customPointTempMarker.setLatLng(ll);
    }else{
      state.customPointTempMarker=L.marker(ll,{draggable:true}).addTo(state.map);
    }
  });
}

function selectBasemap(kind){
  const next=state.baseLayers[kind]||state.baseLayers.osm;

  if(state.activeBaseLayer && state.map.hasLayer(state.activeBaseLayer)){
    state.map.removeLayer(state.activeBaseLayer);
  }

  state.activeBaseLayer=next;
  if(!state.map.hasLayer(next))next.addTo(state.map);
}

function locate(zoom){
  navigator.geolocation.getCurrentPosition(p=>{state.currentPos={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};if(state.me)state.map.removeLayer(state.me);state.me=L.circleMarker([state.currentPos.lat,state.currentPos.lon],{radius:9,weight:3}).addTo(state.map);if(zoom)state.map.setView([state.currentPos.lat,state.currentPos.lon],14);applyFilters();setStatus(`GPS ±${Math.round(state.currentPos.accuracy)} m`)},e=>setStatus("GPS："+e.message),{enableHighAccuracy:true,timeout:15000});
}

async function autocomplete(q){
  try{const x=await taxonomy(q,searchContext());const l=x.suggestions||[];$("#autocomplete").innerHTML=l.map((r,i)=>`<button data-auto="${i}"><strong>${esc(r.commonName||r.scientificName)}</strong><div class="meta"><i>${esc(r.scientificName)}</i> · ${esc(r.rank||"")}</div></button>`).join("")||`<div class="empty">無建議</div>`;$("#autocomplete").classList.remove("hidden");$$("[data-auto]").forEach(b=>b.onclick=()=>{$("#taxonInput").value=l[+b.dataset.auto].scientificName;$("#autocomplete").classList.add("hidden")})}catch(_){}
}
async function searchTaxon(){
  const q=$("#taxonInput").value.trim();if(!q)return;
  $("#searchBtn").disabled=true;setStatus("正在查詢 GBIF、iNaturalist…");
  try{
    const t=await taxonomy(q,searchContext());state.taxon=t.best;renderTaxon();
    const o=await occurrences(state.taxon,searchContext());state.allRecords=o.records||[];
    await put("cache",{
      id:`${state.profile.id}:occ:${state.taxon.scientificName.toLowerCase()}`,
      profileId:state.profile.id,query:q.toLowerCase(),taxon:state.taxon,
      countryCode:state.profile.countryCode,
      records:state.allRecords,savedAt:new Date().toISOString()
    });
    applyFilters();
    updateSourceHealth(o.sourceStatus||{},o.sourceCounts||{});
    setStatus(`${state.profile.countryLabel}：整合 ${state.allRecords.length} 筆；GBIF ${o.sourceCounts.GBIF}、iNaturalist ${o.sourceCounts.iNaturalist}${o.warnings.length?`；本次不可用：${o.warnings.join(", ")}`:""}`);
  }catch(e){
    const caches=await byProfile("cache",state.profile.id);
    const key=q.toLowerCase();
    const hit=caches
      .filter(x=>x.query===key||String(x.taxon?.scientificName||"").toLowerCase()===key)
      .sort((a,b)=>String(b.savedAt).localeCompare(String(a.savedAt)))[0];
    if(hit){
      state.taxon=hit.taxon;state.allRecords=hit.records||[];
      renderTaxon();applyFilters();
      setStatus(`目前無法連線，已載入 ${new Date(hit.savedAt).toLocaleString("zh-TW")} 快取的 ${state.allRecords.length} 筆紀錄。`);
    }else{
      setStatus("搜尋失敗，且此物種尚無本機快取："+e.message);
    }
  }finally{$("#searchBtn").disabled=false}
}
function updateSourceHealth(status,counts){
  const box=$("#sourceHealth");
  if(!box)return;
  box.classList.remove("hidden");

  const labels=[
    ["GBIF","GBIF"],
    ["iNaturalist","iNaturalist"]
  ];

  box.innerHTML=labels.map(([key,label])=>{
    const s=status[key]||"skip";
    const cls=s==="ok"?"ok":s==="unavailable"?"bad":"skip";
    const symbol=s==="ok"?"✓":s==="unavailable"?"×":"–";
    const count=counts[key]??0;
    return `<span class="source-health-tag ${cls}">${esc(label)} ${symbol}${s==="ok"?` ${count}`:""}</span>`;
  }).join("");
}

function renderTaxon(){
  const x=state.taxon;
  if(!x)return;

  $("#taxonCard").classList.remove("hidden");
  $("#taxonCard").innerHTML=`
    <strong>${esc(x.commonName||x.scientificName||"")}</strong>
    <div><i>${esc(x.scientificName||"")}</i></div>
    <div class="meta">${esc([x.order,x.family,x.rank].filter(Boolean).join(" → "))}</div>
    <div class="source-tags">
      ${(x.sources||[]).map(s=>`<span class="source-tag">${esc(s)}</span>`).join("")}
    </div>`;
}

function applyFilters(){
  let l=[...state.allRecords];

  const st=$("#filterStart").value;
  const en=$("#filterEnd").value;
  const mo=+$("#filterMonth").value;
  const src=$("#filterSource").value;
  const bas=$("#filterBasis").value;
  const unc=+$("#filterUncertainty").value;
  const photo=$("#filterPhoto").checked;
  const rad=+$("#filterRadius").value;
  const locality=$("#filterLocality").value.trim().toLowerCase();
  const mapBounds=$("#filterMapBounds").checked && state.map
    ? state.map.getBounds()
    : null;

  l=l.filter(r=>{
    const d=String(r.eventDate||"").slice(0,10);
    if(st&&d&&d<st)return false;
    if(en&&d&&d>en)return false;
    if(mo&&+d.slice(5,7)!==mo)return false;
    if(src&&!(r.sources||[]).includes(src))return false;
    if(bas&&!String(r.basisOfRecord||"").toUpperCase().includes(bas))return false;
    if(unc&&Number(r.uncertaintyM??Infinity)>unc)return false;
    if(photo&&!r.hasPhoto)return false;
    if(locality&&!String(r.locality||"").toLowerCase().includes(locality))return false;
    if(rad&&state.currentPos&&haversineKm(state.currentPos,{lat:r.lat,lon:r.lon})>rad)return false;
    if(mapBounds&&!mapBounds.contains([Number(r.lat),Number(r.lon)]))return false;
    return true;
  });

  const mode=$("#sortMode").value;
  l.sort((a,b)=>
    mode==="date_desc"
      ? String(b.eventDate).localeCompare(String(a.eventDate))
      : mode==="date_asc"
        ? String(a.eventDate).localeCompare(String(b.eventDate))
        : mode==="uncertainty"
          ? (a.uncertaintyM??Infinity)-(b.uncertaintyM??Infinity)
          : mode==="source_count"
            ? (b.sources?.length||0)-(a.sources?.length||0)
            : state.currentPos
              ? haversineKm(state.currentPos,{lat:a.lat,lon:a.lon})-haversineKm(state.currentPos,{lat:b.lat,lon:b.lon})
              : 0
  );

  state.filtered=l;
  renderOccurrences();
  rerank();
  renderMonthChart();
  $("#resultMeta").textContent=
    `${l.length} / ${state.allRecords.length} 筆${mapBounds?" · 目前地圖範圍":""}`;
}

function resetFilters(){
  ["filterStart","filterEnd","filterMonth","filterRadius","filterSource","filterBasis","filterUncertainty","filterLocality"]
    .forEach(id=>$("#"+id).value="");
  $("#filterPhoto").checked=false;
  $("#filterMapBounds").checked=false;
  applyFilters();
}
function renderOccurrences(){
  if(state.cluster)state.cluster.clearLayers();
  state.markerMap.clear();
  const bounds=[];

  for(const r of state.filtered){
    if(!window.L||!state.cluster)break;
    const icon=L.divIcon({
      className:`occ-marker-wrap ${state.selectedOccurrenceId===r.id?"selected-occ-marker":""}`,
      html:`<span class="occ-marker-dot"></span>`,
      iconSize:[18,18],
      iconAnchor:[9,9]
    });
    const popupImage=(r.imageUrls||[])[0];
    const popupHtml=`
      ${popupImage?`<img src="${esc(popupImage)}" alt="" style="width:110px;height:82px;object-fit:cover;border-radius:8px;margin-bottom:7px;display:block">`:""}
      <b>${esc(r.commonName||r.scientificName)}</b><br>
      <span class="meta"><i>${esc(r.scientificName||"")}</i><br>${esc(r.locality||"")}<br>${esc(r.eventDate||"")}<br>${esc((r.sources||[]).join(" + "))}</span>
      <div class="popup-actions">
        <a class="popup-nav" href="${googleMapsUrl(r.lat,r.lon)}" target="_blank" rel="noopener">Google Maps 導航</a>
        <button type="button" data-popup-add>加入行程</button>
      </div>`;
    const m=L.marker([r.lat,r.lon],{icon}).bindPopup(popupHtml);
    m.on("click",()=>selectOccurrence(r.id,true));
    m.on("popupopen",e=>{
      const btn=e.popup.getElement()?.querySelector("[data-popup-add]");
      if(btn)btn.onclick=()=>addToTrip(r);
    });
    m.addTo(state.cluster);
    state.markerMap.set(r.id,m);
    bounds.push([r.lat,r.lon]);
  }

  if(bounds.length&&state.map)state.map.fitBounds(bounds,{padding:[20,20],maxZoom:12});

  $("#resultList").innerHTML=state.filtered.length
    ? state.filtered.slice(0,200).map((r,i)=>{
        const img=(r.imageUrls||[])[0];
        return `<article class="card ${state.selectedOccurrenceId===r.id?"selected":""}" data-card="${esc(r.id)}">
          <div class="occ-card-layout">
            ${img
              ? `<div class="occ-thumb-wrap"><img class="occ-thumb" data-occ-thumb src="${esc(img)}" alt="${esc(r.commonName||r.scientificName||"occurrence")}"></div>`
              : `<div class="occ-card-no-image">No image</div>`}
            <div>
              <div class="card-top">
                <div>
                  <h3>${esc(r.commonName||r.scientificName)}</h3>
                  <div class="meta"><i>${esc(r.scientificName)}</i><br>${esc(r.locality||"")} · ${esc(r.eventDate||"")} ${r.uncertaintyM!=null?`· ±${Math.round(r.uncertaintyM)} m`:""}</div>
                  <div class="source-tags">${(r.sources||[]).map(s=>`<span class="source-tag">${esc(s)}</span>`).join("")}</div>
                  ${img?`<div class="source-media-note">${esc(r.mediaLicense||"原始資料圖片")}</div>`:""}
                </div>
              </div>
              <div class="actions">
                <button data-focus="${i}">地圖</button>
                <button data-detail="${i}">詳情${(r.imageUrls||[]).length?` / 圖片 ${(r.imageUrls||[]).length}`:""}</button>
                <a class="nav-link" target="_blank" rel="noopener" href="${googleMapsUrl(r.lat,r.lon)}">Google Maps</a>
                <button data-add="${i}">加入行程</button>
              </div>
            </div>
          </div>
        </article>`;
      }).join("")
    : `<div class="empty">無符合紀錄。</div>`;

  $$("[data-focus]").forEach(b=>b.onclick=()=>{
    const r=state.filtered[+b.dataset.focus];
    if(state.map)state.map.setView([r.lat,r.lon],16);
    selectOccurrence(r.id,false);
    state.markerMap.get(r.id)?.openPopup();
  });
  $$("[data-detail]").forEach(b=>b.onclick=()=>showOccurrenceDetail(state.filtered[+b.dataset.detail]));
  $$("[data-add]").forEach(b=>b.onclick=()=>addToTrip(state.filtered[+b.dataset.add]));
  $$("[data-occ-thumb]").forEach(img=>img.addEventListener("error",()=>{
    const wrap=img.closest(".occ-thumb-wrap");
    if(wrap)wrap.innerHTML='<div class="occ-card-no-image">Image unavailable</div>';
  },{once:true}));

  if(state.selectedOccurrenceId && !state.filtered.some(r=>r.id===state.selectedOccurrenceId)){
    state.selectedOccurrenceId=null;
  }
  applyOccurrenceSelection();
}
function showOccurrenceDetail(r){
  const uniqueLinks=[...new Set((r.sourceUrls||[]).filter(Boolean))];
  const links=uniqueLinks.map((u,i)=>`<a class="nav-link" href="${esc(u)}" target="_blank" rel="noopener">${i===0?"原始紀錄":`來源 ${i+1}`}</a>`).join("");
  const images=[...new Set((r.imageUrls||[]).filter(Boolean))].slice(0,4);
  const gallery=images.length
    ? `<div class="source-image-gallery">${images.map((u,i)=>`
        <a href="${esc(u)}" target="_blank" rel="noopener" title="開啟原始圖片">
          <img src="${esc(u)}" alt="${esc(r.commonName||r.scientificName||"occurrence")} ${i+1}">
        </a>`).join("")}</div>
       <div class="meta">圖片授權：${esc(r.mediaLicense||"請以原始資料來源標示為準")}</div>`
    : `<div class="meta">此筆資料沒有可直接顯示的原始圖片。</div>`;

  showModal(`<h2>${esc(r.commonName||r.scientificName||"Occurrence")}</h2>
    ${gallery}
    <div class="summary-box">
      <div><i>${esc(r.scientificName||"")}</i></div>
      <div class="meta">
        地點：${esc(r.locality||"未提供")}<br>
        日期：${esc(r.eventDate||"未提供")}<br>
        座標：${r.lat.toFixed(6)}, ${r.lon.toFixed(6)}<br>
        座標誤差：${r.uncertaintyM!=null?`±${Math.round(r.uncertaintyM)} m`:"未提供"}<br>
        Basis：${esc(r.basisOfRecord||"未提供")}<br>
        來源：${esc((r.sources||[]).join(" + "))}
        ${r.datasetName?`<br>資料集：${esc(r.datasetName)}`:""}
        ${r.datasetUUID?`<br>Dataset UUID：${esc(r.datasetUUID)}`:""}
        ${r.datasetAuthor?`<br>資料集作者：${esc(r.datasetAuthor)}`:""}
        ${r.license?`<br>資料授權：${esc(r.license)}`:""}
        ${r.recordedBy?`<br>記錄者：${esc(r.recordedBy)}`:""}
        ${r.identificationVerificationStatus?`<br>鑑定狀態：${esc(r.identificationVerificationStatus)}`:""}
        ${r.minimumElevationM!=null?`<br>海拔：${Math.round(r.minimumElevationM)} m`:""}
        ${r.sensitiveCategory?`<br><strong>敏感資料：${esc(r.sensitiveCategory)}</strong>`:""}
        ${r.dataGeneralizations?`<br>座標／資料已由來源端泛化或模糊化`:""}
      </div>
      <div class="button-row">${links}<a class="nav-link" href="${googleMapsUrl(r.lat,r.lon)}" target="_blank" rel="noopener">Google Maps</a></div>
    </div>`);
}

function linkToCard(id){
  selectOccurrence(id,true);
}

function applyOccurrenceSelection(){
  document.querySelectorAll("[data-card]").forEach(card=>{
    card.classList.toggle("selected",card.dataset.card===state.selectedOccurrenceId);
  });

  for(const [id,marker] of state.markerMap.entries()){
    const el=marker.getElement?.();
    if(el)el.classList.toggle("selected-occ-marker",id===state.selectedOccurrenceId);
  }
}

function selectOccurrence(id,scroll=false){
  state.selectedOccurrenceId=id||null;
  applyOccurrenceSelection();

  if(!id)return;
  const c=document.querySelector(`[data-card="${CSS.escape(id)}"]`);
  if(!c)return;

  if(scroll){
    const pane=$("#contentPane");
    const paneRect=pane.getBoundingClientRect();
    const cardRect=c.getBoundingClientRect();
    const target=pane.scrollTop+(cardRect.top-paneRect.top)-8;
    pane.scrollTo({top:Math.max(0,target),behavior:"smooth"});
  }
}

function rerank(){state.candidates=rankCandidates(state.filtered,state.currentPos,$("#filterMonth").value);renderCandidates()}
function candidateCard(c,i,featured=false){
  return `<article class="card">
    <div class="card-top">
      <div>
        <h3>${featured?`<span class="candidate-rank-badge">${c.rank}</span>`:`#${c.rank} `}${esc(c.name)}</h3>
        <div class="meta">${c.count} 筆 · 最新 ${c.newest||"?"} · 月份匹配 ${c.monthHits}/${c.count}${c.dist!=null?` · ${c.dist.toFixed(1)} km`:""} · median ±${Math.round(c.medianUnc)} m</div>
        <div class="source-tags">${c.sources.map(s=>`<span class="source-tag">${esc(s)}</span>`).join("")}</div>
      </div>
      <div class="score">${c.score}</div>
    </div>
    <div class="actions">
      <button data-cfocus="${i}">地圖</button>
      <button data-cwhy="${i}">為什麼推薦？</button>
      <a class="nav-link" target="_blank" rel="noopener" href="${googleMapsUrl(c.lat,c.lon)}">Google Maps</a>
      <button data-cadd="${i}">加入行程</button>
    </div>
  </article>`;
}

function showCandidateWhy(c){
  const b=c.breakdown||{};
  const rows=[
    ["紀錄密度",b.density,25,`${c.count} 筆 occurrence`],
    ["近期性",b.recency,20,c.newest?`最新 ${c.newest}`:"缺少年份"],
    ["月份支持",b.season,20,`${c.targetMonth} 月 ${c.monthHits}/${c.count} 筆`],
    ["距離／可達性",b.access,15,c.dist!=null?`${c.dist.toFixed(1)} km`:"尚未取得 GPS"],
    ["座標品質",b.coordinate,10,`median ±${Math.round(c.medianUnc)} m`],
    ["多來源支持",b.multiSource,10,(c.sources||[]).join(" + ")||"單一來源"]
  ];

  showModal(`
    <h2>#${c.rank} ${esc(c.name)}</h2>
    <div class="summary-box">
      <strong>Ranking score：${c.score} / 100</strong>
      <div class="meta">這是 FieldScout 的 heuristic field-scouting score，不是 SDM 或棲地適合度。</div>
    </div>
    <div class="candidate-breakdown">
      ${rows.map(([name,val,max,note])=>`
        <div>
          <strong>${esc(name)}</strong>
          <div class="meta">${esc(note)}</div>
        </div>
        <strong>${Number(val||0).toFixed(1)} / ${max}</strong>
      `).join("")}
    </div>
    <div class="button-row">
      <a class="nav-link" target="_blank" rel="noopener" href="${googleMapsUrl(c.lat,c.lon)}">Google Maps</a>
    </div>
  `);
}

function renderCandidates(){
  const top=state.candidates.slice(0,5);
  const rest=state.candidates.slice(5);

  $("#candidateTopList").innerHTML=top.length
    ? top.map((c,i)=>candidateCard(c,i,true)).join("")
    : `<div class="empty">尚無候選樣點。</div>`;

  $("#candidateOtherList").innerHTML=rest.length
    ? rest.map((c,j)=>candidateCard(c,j+5,false)).join("")
    : `<div class="empty">沒有其他候選樣點。</div>`;

  $("#otherCandidateCount").textContent=`(${rest.length})`;
  $("#otherCandidatesBlock").classList.toggle("hidden",rest.length===0);

  $$("[data-cfocus]").forEach(b=>b.onclick=()=>{
    const c=state.candidates[+b.dataset.cfocus];
    if(state.map)state.map.setView([c.lat,c.lon],15);
  });
  $$("[data-cwhy]").forEach(b=>b.onclick=()=>{
    showCandidateWhy(state.candidates[+b.dataset.cwhy]);
  });
  $$("[data-cadd]").forEach(b=>b.onclick=()=>{
    const c=state.candidates[+b.dataset.cadd];
    addPointToTrip({...c,source:"ranking"});
  });
}

function normalizeTripPoint(p){
  const lat=Number(p?.lat),lon=Number(p?.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)){
    throw new Error("點位缺少有效經緯度");
  }
  return {
    ...p,
    id:String(p?.id||crypto.randomUUID()),
    name:String(p?.name||"FieldScout point"),
    lat,lon,
    source:String(p?.source||"unknown"),
    visitStatus:String(p?.visitStatus||"unvisited")
  };
}

function normalizeTrip(t){
  if(!t)return null;
  t.countryCode=t.countryCode||state.profile?.countryCode||"TW";
  t.countryName=t.countryName||state.profile?.countryName||"Taiwan";
  t.points=Array.isArray(t.points)
    ? t.points.map(p=>{
        try{return normalizeTripPoint(p)}catch(_){return null}
      }).filter(Boolean)
    : [];
  t.track=Array.isArray(t.track)?t.track:[];
  return t;
}

async function createDefaultTrip(){
  const now=new Date();
  const t={
    id:crypto.randomUUID(),
    profileId:state.profile.id,
    name:`Field Trip ${now.toLocaleDateString("zh-TW")}`,
    date:now.toISOString().slice(0,10),
    targetTaxon:state.taxon?.scientificName||"",
    status:"planned",
    notes:"",
    countryCode:state.profile?.countryCode||"TW",
    countryName:state.profile?.countryName||"Taiwan",
    points:[],
    track:[],
    createdAt:now.toISOString(),
    updatedAt:now.toISOString()
  };
  await put("trips",t);
  state.trips.unshift(t);
  state.activeTrip=t;
  renderTrips();
  setStatus(`已自動建立行程「${t.name}」。`);
  return t;
}

async function ensureTrip(){
  if(state.activeTrip){
    state.activeTrip=normalizeTrip(state.activeTrip);
    return state.activeTrip;
  }

  if(state.trips.length){
    state.activeTrip=normalizeTrip(state.trips[0]);
    return state.activeTrip;
  }

  return await createDefaultTrip();
}

async function newTrip(){
  const proposed=`Field Trip ${new Date().toLocaleDateString("zh-TW")}`;
  const name=prompt("行程名稱",proposed);
  if(!name)return;

  const now=new Date();
  const t={
    id:crypto.randomUUID(),
    profileId:state.profile.id,
    name,
    date:now.toISOString().slice(0,10),
    targetTaxon:state.taxon?.scientificName||"",
    status:"planned",
    notes:"",
    countryCode:state.profile?.countryCode||"TW",
    countryName:state.profile?.countryName||"Taiwan",
    points:[],
    track:[],
    createdAt:now.toISOString(),
    updatedAt:now.toISOString()
  };

  await put("trips",t);
  state.trips.unshift(t);
  state.activeTrip=t;
  renderTrips();
  setStatus(`已建立行程「${name}」。`);
}

function selectTrip(id){
  state.activeTrip=normalizeTrip(state.trips.find(t=>t.id===id)||null);
  state.selectedTripPointId=null;
  renderTrips();
}

async function saveTrip(){
  if(!state.activeTrip)return;
  state.activeTrip=normalizeTrip(state.activeTrip);
  state.activeTrip.updatedAt=new Date().toISOString();
  await put("trips",state.activeTrip);

  const i=state.trips.findIndex(t=>t.id===state.activeTrip.id);
  if(i>=0)state.trips[i]=state.activeTrip;
}

async function saveTripMeta(){
  if(!state.activeTrip)return;
  state.activeTrip.targetTaxon=$("#tripTargetTaxon").value.trim();
  state.activeTrip.date=$("#tripDate").value;
  state.activeTrip.status=$("#tripStatus").value;
  state.activeTrip.notes=$("#tripNotes").value;
  await saveTrip();
  setStatus("行程資訊已儲存。");
}

async function deleteTripById(id){
  const trip=state.trips.find(t=>t.id===id);
  if(!trip)return false;

  const linkedRecords=state.records.filter(r=>r.tripId===id);
  const promptText=
    `刪除行程「${trip.name}」？\n\n`+
    `${trip.points?.length||0} 個採集目標`+
    (linkedRecords.length?`，${linkedRecords.length} 筆採集紀錄會保留，但解除行程連結。`:"。");

  if(!confirm(promptText))return false;

  for(const r of linkedRecords){
    r.tripId=null;
    r.tripPointId=null;
    r.updatedAt=new Date().toISOString();
    await put("records",r);
  }

  await del("trips",id);
  state.trips=state.trips.filter(t=>t.id!==id);

  if(state.activeTrip?.id===id){
    state.activeTrip=normalizeTrip(state.trips[0]||null);
    state.selectedTripPointId=null;
    state.fieldModeIndex=0;
  }

  renderTrips();
  renderRecords();
  renderFieldMode();
  setStatus(`已刪除行程「${trip.name}」；採集紀錄已保留。`);
  return true;
}

function tripManagerRow(t){
  const linked=state.records.filter(r=>r.tripId===t.id).length;
  const isActive=state.activeTrip?.id===t.id;
  return `
    <article class="trip-manager-item ${isActive?"active":""}" data-manager-trip="${esc(t.id)}">
      <div class="trip-manager-status">
        <span class="trip-manager-dot"></span>
        <span>${isActive?"目前行程":esc(t.status||"planned")}</span>
      </div>
      <label class="trip-manager-name">行程名稱
        <input data-trip-rename="${esc(t.id)}" value="${esc(t.name||"Unnamed trip")}" maxlength="120">
      </label>
      <div class="trip-manager-meta">
        <span>${esc(t.date||"未設定日期")}</span>
        <span>${t.points?.length||0} 個採集目標</span>
        <span>${linked} 筆紀錄</span>
      </div>
      <div class="trip-manager-actions">
        <button data-trip-use="${esc(t.id)}" ${isActive?"disabled":""}>${isActive?"使用中":"設為目前"}</button>
        <button data-trip-save-name="${esc(t.id)}" class="primary">儲存名稱</button>
        <button data-trip-delete="${esc(t.id)}" class="danger-soft">刪除</button>
      </div>
    </article>`;
}

function wireTripManager(){
  $$("[data-trip-use]").forEach(b=>b.onclick=()=>{
    selectTrip(b.dataset.tripUse);
    showTripManager();
    setStatus("已切換目前行程。");
  });

  $$("[data-trip-save-name]").forEach(b=>b.onclick=async()=>{
    const id=b.dataset.tripSaveName;
    const input=document.querySelector(`[data-trip-rename="${CSS.escape(id)}"]`);
    const name=input?.value.trim();
    if(!name){
      setStatus("行程名稱不能留空。");
      input?.focus();
      return;
    }

    const trip=state.trips.find(t=>t.id===id);
    if(!trip)return;
    trip.name=name;
    trip.updatedAt=new Date().toISOString();
    await put("trips",trip);

    if(state.activeTrip?.id===id){
      state.activeTrip=normalizeTrip(trip);
    }

    renderTrips();
    renderFieldMode();
    showTripManager();
    setStatus(`行程已改名為「${name}」。`);
  });

  $$("[data-trip-delete]").forEach(b=>b.onclick=async()=>{
    const deleted=await deleteTripById(b.dataset.tripDelete);
    if(deleted)showTripManager();
  });

  document.getElementById("tripManagerNewBtn")?.addEventListener("click",async()=>{
    $("#modal").classList.add("hidden");
    await newTrip();
    showTripManager();
  });
}

function showTripManager(){
  const rows=state.trips.length
    ? state.trips.map(tripManagerRow).join("")
    : `<div class="trip-manager-empty">尚未建立行程。</div>`;

  showModal(`
    <div class="trip-manager-modal">
      <div class="trip-manager-head">
        <div>
          <div class="page-kicker">TRIP LIBRARY</div>
          <h2>編輯行程</h2>
          <p class="meta">改名、切換或刪除行程。刪除行程不會刪除採集紀錄。</p>
        </div>
        <button id="tripManagerNewBtn" type="button" class="primary">＋ 新增行程</button>
      </div>
      <div class="trip-manager-list">${rows}</div>
    </div>
  `);

  wireTripManager();
}



function fieldModePoints(){
  return state.activeTrip?.points||[];
}

function currentFieldModePoint(){
  const pts=fieldModePoints();
  if(!pts.length)return null;
  state.fieldModeIndex=Math.max(0,Math.min(state.fieldModeIndex,pts.length-1));
  return pts[state.fieldModeIndex]||null;
}

function preferredFieldModeIndex(){
  const pts=fieldModePoints();
  if(!pts.length)return 0;

  if(state.selectedTripPointId){
    const selected=pts.findIndex(p=>p.id===state.selectedTripPointId);
    if(selected>=0)return selected;
  }

  const pending=pts.findIndex(p=>!["surveyed","inaccessible"].includes(p.visitStatus||"unvisited"));
  return pending>=0?pending:0;
}

function statusLabel(status){
  return ({
    unvisited:"未訪查",
    arrived:"已到達",
    surveyed:"已完成",
    inaccessible:"無法到達",
    revisit:"需要再訪"
  })[status]||status||"未訪查";
}

function renderFieldMode(){
  const pts=fieldModePoints();
  const point=currentFieldModePoint();
  const trip=state.activeTrip;

  const fieldSelect=$("#fieldTripSelect");
  if(fieldSelect){
    fieldSelect.innerHTML=
      `<option value="">選擇行程</option>`+
      state.trips.map(t=>`<option value="${esc(t.id)}">${esc(t.name||"Unnamed trip")}</option>`).join("");
    if(trip)fieldSelect.value=trip.id;
  }

  const hasTarget=!!(trip&&point);
  $("#fieldEmptyState").classList.toggle("hidden",hasTarget);
  $("#fieldActiveContent").classList.toggle("hidden",!hasTarget);

  if(!hasTarget){
    if(state.map)setTimeout(()=>state.map.invalidateSize(),40);
    return;
  }

  const i=state.fieldModeIndex;
  const completed=pts.filter(p=>["surveyed","inaccessible"].includes(p.visitStatus||"unvisited")).length;
  const progress=pts.length?Math.round(100*completed/pts.length):0;
  const status=point.visitStatus||"unvisited";
  const linked=state.records.filter(r=>r.tripId===trip.id&&r.tripPointId===point.id).length;
  const dist=state.currentPos
    ? haversineKm(state.currentPos,{lat:Number(point.lat),lon:Number(point.lon)})
    : null;

  $("#fieldModeTripName").textContent=trip.name||"Field Trip";
  $("#fieldModeProgressText").textContent=`${completed} / ${pts.length} 完成`;
  $("#fieldModeProgressBar").style.width=`${progress}%`;
  $("#fieldGpsBadge").textContent=state.currentPos
    ? `GPS ±${Math.round(Number(state.currentPos.accuracy)||0)} m`
    : "GPS —";

  $("#fieldModeLetter").textContent=String.fromCharCode(65+(i%26));
  $("#fieldModeName").textContent=point.name||"Point";
  $("#fieldModeStatus").textContent=statusLabel(status);
  $("#fieldModeStatus").dataset.status=status;
  $("#fieldModeDistance").textContent=dist==null?"距離 —":`${dist.toFixed(dist<10?1:0)} km`;
  $("#fieldModeMeta").textContent=
    `${Number(point.lat).toFixed(5)}, ${Number(point.lon).toFixed(5)} · ${point.source||""}`;
  $("#fieldModeRecordCount").textContent=`${linked} 筆採集紀錄`;
  $("#fieldModeNavigateBtn").href=googleMapsUrl(point.lat,point.lon);

  for(const [id,value] of [
    ["fieldModeArrivedBtn","arrived"],
    ["fieldModeSurveyedBtn","surveyed"],
    ["fieldModeInaccessibleBtn","inaccessible"],
    ["fieldModeRevisitBtn","revisit"]
  ]){
    $("#"+id).classList.toggle("active",status===value);
  }

  $("#fieldModePrevBtn").disabled=i===0;
  $("#fieldModeNextBtn").disabled=i===pts.length-1;

  const nextPending=pts.findIndex((p,idx)=>
    idx>i && !["surveyed","inaccessible"].includes(p.visitStatus||"unvisited")
  );

  $("#fieldModeNextHint").textContent=
    nextPending>=0
      ? `下一個未完成：${String.fromCharCode(65+(nextPending%26))}. ${pts[nextPending].name||"Point"}`
      : completed===pts.length
        ? "這個行程的所有採集目標都已完成／標記無法到達。"
        : "目前點之後沒有其他未完成目標。";

  state.selectedTripPointId=point.id;
  selectTripPoint(point.id,false);

  if(state.map){
    state.map.setView([Number(point.lat),Number(point.lon)],Math.max(state.map.getZoom(),14));
    setTimeout(()=>state.map.invalidateSize(),60);
  }
}

function moveFieldMode(delta){
  const pts=fieldModePoints();
  if(!pts.length)return;
  state.fieldModeIndex=Math.max(0,Math.min(pts.length-1,state.fieldModeIndex+delta));
  renderFieldMode();
}

function refreshFieldModeGps(showStatus=true){
  if(!navigator.geolocation){
    if(showStatus)setStatus("此裝置不支援 GPS。");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    p=>{
      state.currentPos={
        lat:p.coords.latitude,
        lon:p.coords.longitude,
        accuracy:p.coords.accuracy
      };
      if(state.me&&state.map)state.map.removeLayer(state.me);
      if(state.map){
        state.me=L.circleMarker(
          [state.currentPos.lat,state.currentPos.lon],
          {radius:9,weight:3}
        ).addTo(state.map);
      }
      renderFieldMode();
      if(showStatus)setStatus(`GPS 已更新：±${Math.round(state.currentPos.accuracy)} m`);
    },
    e=>{
      if(showStatus)setStatus("GPS："+e.message);
      renderFieldMode();
    },
    {enableHighAccuracy:true,timeout:15000,maximumAge:5000}
  );
}

async function setFieldPointStatus(status){
  const p=currentFieldModePoint();
  if(!p||!state.activeTrip)return;

  p.visitStatus=status;
  const now=new Date().toISOString();

  if(status==="arrived"){
    p.arrivalAt=now;
    if(state.currentPos){
      p.arrivalLat=state.currentPos.lat;
      p.arrivalLon=state.currentPos.lon;
      p.arrivalDistanceM=Math.round(haversineKm(state.currentPos,p)*1000);
    }
  }
  if(status==="surveyed")p.surveyedAt=now;
  if(status==="inaccessible")p.inaccessibleAt=now;
  if(status==="revisit")p.revisitAt=now;

  await saveTrip();
  renderTrips();
  renderFieldMode();
}

function quickRecordFromFieldMode(){
  const p=currentFieldModePoint();
  if(!p||!state.activeTrip)return;

  state.fieldModeReturn=true;
  state.selectedTripPointId=p.id;

  switchTab("records");
  renderRecordTripPointOptions(p.id);
  $("#recordTripPoint").value=p.id;

  if(!$("#recordTaxon").value.trim()){
    $("#recordTaxon").value=state.activeTrip.targetTaxon||state.taxon?.scientificName||"";
  }

  state.recordGps={
    lat:Number(p.lat),
    lon:Number(p.lon),
    accuracyM:null
  };
  renderRecordGps();

  if(!$("#specimenId").value.trim()){
    nextSpecimen().catch(console.warn);
  }

  $("#recordForm").scrollIntoView({behavior:"smooth",block:"start"});
  setStatus(`快速紀錄：已綁定 ${String.fromCharCode(65+(state.fieldModeIndex%26))}. ${p.name}。儲存後會回到「野外」頁。`);
}

async function unlinkRecordsFromTripPoints(tripId,pointIds){
  const ids=new Set((pointIds||[]).map(String));
  let changed=false;

  for(const r of state.records){
    if(r.tripId===tripId && ids.has(String(r.tripPointId||""))){
      r.tripId=null;
      r.tripPointId=null;
      r.updatedAt=new Date().toISOString();
      await put("records",r);
      changed=true;
    }
  }
  return changed;
}

async function clearAllTripPoints(){
  const t=state.activeTrip;
  if(!t){
    setStatus("目前沒有行程。");
    return;
  }

  const pts=t.points||[];
  if(!pts.length){
    setStatus("目前行程沒有採集目標。");
    return;
  }

  const linked=state.records.filter(r=>
    r.tripId===t.id && pts.some(p=>String(p.id)===String(r.tripPointId||""))
  ).length;

  const message=
    `移除「${t.name}」的全部 ${pts.length} 個採集目標？`+
    (linked?`\n\n${linked} 筆採集紀錄會保留，但會解除與這些行程點的連結。`:"");

  if(!confirm(message))return;

  await unlinkRecordsFromTripPoints(t.id,pts.map(p=>p.id));
  t.points=[];
  state.selectedTripPointId=null;
  await saveTrip();
  renderTrips();
  renderRecords();
  setStatus(`已清空行程「${t.name}」的所有採集目標；採集紀錄未刪除。`);
}

function routeStraightKm(points,startPos=null){
  const pts=(points||[]).filter(p=>Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon)));
  if(!pts.length)return 0;
  let total=0;
  let prev=startPos?{lat:Number(startPos.lat),lon:Number(startPos.lon)}:pts[0];
  const startIndex=startPos?0:1;
  for(let i=startIndex;i<pts.length;i++){
    total+=haversineKm(prev,{lat:Number(pts[i].lat),lon:Number(pts[i].lon)});
    prev=pts[i];
  }
  return total;
}

function nearestNeighborOrder(points,startPos=null){
  const remaining=(points||[]).map(p=>({...p}));
  if(remaining.length<2)return remaining;

  const ordered=[];
  let current;

  if(startPos){
    current={lat:Number(startPos.lat),lon:Number(startPos.lon)};
  }else{
    const first=remaining.shift();
    ordered.push(first);
    current={lat:Number(first.lat),lon:Number(first.lon)};
  }

  while(remaining.length){
    let bestIndex=0;
    let bestDist=Infinity;
    for(let i=0;i<remaining.length;i++){
      const d=haversineKm(current,{
        lat:Number(remaining[i].lat),
        lon:Number(remaining[i].lon)
      });
      if(d<bestDist){
        bestDist=d;
        bestIndex=i;
      }
    }
    const next=remaining.splice(bestIndex,1)[0];
    ordered.push(next);
    current={lat:Number(next.lat),lon:Number(next.lon)};
  }
  return ordered;
}

async function optimizeRoute(){
  try{
    const t=await ensureTrip();
    if((t.points||[]).length<2){
      setStatus("至少需要 2 個採集目標才能最佳化路線。");
      return;
    }

    const run=async start=>{
      const before=routeStraightKm(t.points,start);
      t.points=nearestNeighborOrder(t.points,start);
      const after=routeStraightKm(t.points,start);
      await saveTrip();
      renderTrips();
      setStatus(`已用最近鄰 heuristic 重排：估計直線路徑 ${before.toFixed(1)} → ${after.toFixed(1)} km。Google Maps 仍會依道路重新導航。`);
    };

    if(state.currentPos){
      await run(state.currentPos);
      return;
    }

    if(!navigator.geolocation){
      await run(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      p=>run({
        lat:p.coords.latitude,
        lon:p.coords.longitude,
        accuracy:p.coords.accuracy
      }).catch(e=>setStatus(`路線最佳化失敗：${e.message}`)),
      ()=>run(null).catch(e=>setStatus(`路線最佳化失敗：${e.message}`)),
      {enableHighAccuracy:true,timeout:10000}
    );
  }catch(e){
    setStatus(`路線最佳化失敗：${e.message}`);
  }
}

async function sortRouteNorthSouth(){
  try{
    const t=await ensureTrip();
    t.points=(t.points||[]).slice().sort((a,b)=>Number(b.lat)-Number(a.lat));
    await saveTrip();
    renderTrips();
    setStatus("行程已依北 → 南重新排序。");
  }catch(e){
    setStatus(`路線排序失敗：${e.message}`);
  }
}

function applyTripPointSelection(){
  document.querySelectorAll("[data-trip-card]").forEach(card=>{
    card.classList.toggle("selected",card.dataset.tripCard===state.selectedTripPointId);
  });

  if(state.tripLayer){
    state.tripLayer.eachLayer?.(layer=>{
      const el=layer.getElement?.();
      if(!el)return;
      const marker=el.querySelector?.(".trip-marker");
      if(marker)marker.classList.toggle(
        "selected",
        marker.closest?.(".leaflet-marker-icon")?.dataset?.pointId===state.selectedTripPointId
      );
    });
  }
}

function selectTripPoint(id,scroll=false){
  state.selectedTripPointId=id||null;

  document.querySelectorAll("[data-trip-card]").forEach(card=>{
    card.classList.toggle("selected",card.dataset.tripCard===state.selectedTripPointId);
  });

  const c=id?document.querySelector(`[data-trip-card="${CSS.escape(id)}"]`):null;
  if(c&&scroll){
    const pane=$("#contentPane");
    const paneRect=pane.getBoundingClientRect();
    const cardRect=c.getBoundingClientRect();
    const target=pane.scrollTop+(cardRect.top-paneRect.top)-8;
    pane.scrollTo({top:Math.max(0,target),behavior:"smooth"});
  }
}

function renderTrips(){
  renderCustomPointLibraryMeta();
  state.trips=state.trips.map(t=>normalizeTrip(t));
  if(state.activeTrip)state.activeTrip=normalizeTrip(state.activeTrip);

  $("#tripSelect").innerHTML=
    `<option value="">選擇行程</option>`+
    state.trips.map(t=>`<option value="${esc(t.id)}">${esc(t.name||"Unnamed trip")}</option>`).join("");

  if(state.activeTrip)$("#tripSelect").value=state.activeTrip.id;

  const t=state.activeTrip,pts=t?.points||[];
  if(state.selectedTripPointId && !pts.some(p=>p.id===state.selectedTripPointId)){
    state.selectedTripPointId=null;
  }
  $("#tripTargetTaxon").value=t?.targetTaxon||"";
  $("#tripDate").value=t?.date||"";
  $("#tripStatus").value=t?.status||"planned";
  $("#tripNotes").value=t?.notes||"";
  $("#tripMeta").textContent=t?`${pts.length} 個採集目標 · ${t.status||"planned"}`:"尚未選擇";

  $("#tripSummaryName").textContent=t?.name||"尚未選擇行程";
  if(t){
    const linked=state.records.filter(r=>r.tripId===t.id).length;
    $("#tripSummaryMeta").textContent=
      `${t.date||"未設定日期"} · ${pts.length} 個採集目標 · ${linked} 筆採集紀錄 · ${{planned:"規劃中",active:"進行中",completed:"已完成"}[t.status]||t.status||"規劃中"}`;
  }else{
    $("#tripSummaryMeta").textContent="建立或選擇一個行程後開始規劃。";
  }

  const fieldSelect=$("#fieldTripSelect");
  if(fieldSelect){
    fieldSelect.innerHTML=
      `<option value="">選擇行程</option>`+
      state.trips.map(x=>`<option value="${esc(x.id)}">${esc(x.name||"Unnamed trip")}</option>`).join("");
    if(t)fieldSelect.value=t.id;
  }

  renderRoutePlanner(t);
  renderRecordTripPointOptions();

  $("#tripPointList").innerHTML=pts.length
    ? pts.map((p,i)=>`
      <article class="card ${state.selectedTripPointId===p.id?"selected":""}" data-trip-card="${esc(p.id)}">
        <div class="card-top">
          <div>
            <h3>${String.fromCharCode(65+(i%26))}. ${esc(p.name||"Point")}</h3>
            <div class="meta">
              ${Number(p.lat).toFixed(5)}, ${Number(p.lon).toFixed(5)}
              · ${esc(p.source||"")}
              · ${esc(p.visitStatus||"unvisited")}
              · <span class="trip-record-count">${state.records.filter(r=>r.tripId===t?.id&&r.tripPointId===p.id).length} 筆採集紀錄</span>
            </div>
          </div>
        </div>
        <div class="actions">
          <button data-tfocus="${i}">地圖</button>
          <a class="nav-link" target="_blank" rel="noopener" href="${googleMapsUrl(p.lat,p.lon)}">導航此點</a>
          <button data-tvisit="${i}">狀態</button>
          ${p.customPointId?`<button data-tcustomedit="${i}">編輯自訂點</button>`:""}
          <button data-tup="${i}">上移</button>
          <button data-tdown="${i}">下移</button>
          <button data-tremove="${i}">移除</button>
        </div>
      </article>`).join("")
    : `<div class="empty">先從「探索」頁把想去的點加入行程。</div>`;

  if(state.tripLayer && window.L){
    state.tripLayer.clearLayers();
    if(pts.length>1){
      L.polyline(pts.map(p=>[Number(p.lat),Number(p.lon)]),{weight:3}).addTo(state.tripLayer);
    }
    const statusSymbol={
      unvisited:"•",
      arrived:"◎",
      surveyed:"✓",
      inaccessible:"×",
      revisit:"↻"
    };
    pts.forEach((p,i)=>{
      const status=p.visitStatus||"unvisited";
      const icon=L.divIcon({
        className:"trip-marker-wrap",
        html:`<div class="trip-marker ${esc(status)} ${state.selectedTripPointId===p.id?"selected":""}">${statusSymbol[status]||"•"}</div>`,
        iconSize:[30,30],
        iconAnchor:[15,15]
      });
      const linked=state.records.filter(r=>r.tripId===t?.id&&r.tripPointId===p.id).length;
      const marker=L.marker([Number(p.lat),Number(p.lon)],{icon})
        .bindPopup(`<strong>${String.fromCharCode(65+(i%26))}. ${esc(p.name||"Point")}</strong><br><span class="meta">${esc(status)} · ${linked} 筆採集紀錄</span>`)
        .addTo(state.tripLayer);
      marker.on("click",()=>selectTripPoint(p.id,true));
    });
  }

  $$("[data-tfocus]").forEach(b=>b.onclick=()=>{
    const p=pts[+b.dataset.tfocus];
    selectTripPoint(p.id,false);
    if(state.map)state.map.setView([p.lat,p.lon],16);
  });

  $$("[data-tcustomedit]").forEach(b=>b.onclick=()=>{
    const p=pts[+b.dataset.tcustomedit];
    const custom=customPoints().find(x=>x.id===p.customPointId);
    if(custom)openCustomPointEditor(custom);
  });

  $$("[data-tremove]").forEach(b=>b.onclick=async()=>{
    const i=+b.dataset.tremove;
    const removed=pts[i];
    if(!removed)return;

    const linked=state.records.filter(r=>
      r.tripId===t.id && String(r.tripPointId||"")===String(removed.id)
    ).length;

    if(linked && !confirm(`此點綁定 ${linked} 筆採集紀錄。移除點位後紀錄會保留，但解除行程點連結。仍要移除？`)){
      return;
    }

    await unlinkRecordsFromTripPoints(t.id,[removed.id]);
    pts.splice(i,1);
    if(state.selectedTripPointId===removed.id)state.selectedTripPointId=null;
    await saveTrip();
    renderTrips();
    renderRecords();
    setStatus("已從行程移除點位。");
  });

  $$("[data-tup]").forEach(b=>b.onclick=async()=>{
    const i=+b.dataset.tup;
    if(i<=0)return;
    [pts[i-1],pts[i]]=[pts[i],pts[i-1]];
    await saveTrip();
    renderTrips();
    setStatus("已調整路線順序。");
  });

  $$("[data-tdown]").forEach(b=>b.onclick=async()=>{
    const i=+b.dataset.tdown;
    if(i>=pts.length-1)return;
    [pts[i],pts[i+1]]=[pts[i+1],pts[i]];
    await saveTrip();
    renderTrips();
    setStatus("已調整路線順序。");
  });

  $$("[data-tvisit]").forEach(b=>b.onclick=async()=>{
    const p=pts[+b.dataset.tvisit];
    const order=["unvisited","arrived","surveyed","inaccessible","revisit"];
    p.visitStatus=order[(order.indexOf(p.visitStatus||"unvisited")+1)%order.length];
    if(p.visitStatus==="arrived"){
      p.arrivalAt=new Date().toISOString();
      if(state.currentPos){
        p.arrivalLat=state.currentPos.lat;
        p.arrivalLon=state.currentPos.lon;
        p.arrivalDistanceM=Math.round(haversineKm(state.currentPos,p)*1000);
      }
    }
    await saveTrip();
    renderTrips();
  });
}

function renderRoutePlanner(t){
  const box=$("#routePlannerCard");
  const pts=t?.points||[];

  if(!t||!pts.length){
    box.innerHTML=`<div class="route-empty">加入採集目標後，這裡會生成導航路線。</div>`;
    return;
  }

  const segments=googleMapsRouteSegments(pts,{maxStops:10,maxUrlLength:1800});
  const mainUrl=googleMapsRouteUrl(segments[0]);

  const stopHtml=pts.map((p,i)=>`
    <div class="route-stop">
      <div class="route-index">${String.fromCharCode(65+(i%26))}</div>
      <div>
        <div class="route-stop-name">${esc(p.name||"Point")}</div>
        <div class="route-stop-meta">${Number(p.lat).toFixed(5)}, ${Number(p.lon).toFixed(5)} · ${esc(p.visitStatus||"unvisited")}</div>
      </div>
    </div>`).join("");

  const segmentHtml=segments.length>1
    ? `<div class="route-segments">
        ${segments.map((seg,i)=>`
          <div class="route-segment">
            <span>路線 ${i+1} · ${seg.length} 個點</span>
            <a class="nav-link route-primary" target="_blank" rel="noopener" href="${googleMapsRouteUrl(seg)}">開啟 Google Maps</a>
          </div>`).join("")}
      </div>`
    : "";

  box.innerHTML=`
    <div class="route-head">
      <div>
        <h3>${esc(t.name||"本次採集行程")}</h3>
        <div class="route-count">${pts.length} 個採集目標 · 依目前排列順序導航</div>
      </div>
      ${segments.length===1
        ? `<a class="nav-link route-primary" target="_blank" rel="noopener" href="${mainUrl}">
             ${pts.length===1?"導航到此點":"開始多點導航"}
           </a>`
        : `<span class="meta">共 ${pts.length} 個點；Google Maps 已自動分成 ${segments.length} 段</span>`}
    </div>
    <div class="route-summary-line">
      <span>FieldScout 直線路徑估計：${routeStraightKm(pts,state.currentPos).toFixed(1)} km</span>
      <span>Google Maps 將依實際道路計算</span>
    </div>
    <div class="route-path">${stopHtml}</div>
    ${segmentHtml}
    <div class="meta">
      FieldScout 行程本身不限制點數。Google Maps 多點導航會依 URL 長度與跨裝置穩定性自動分段；
      野外模式則一次導航到目前目標，因此不受多 waypoint 影響。可用下方「上移／下移」調整採集順序。
    </div>`;
}

async function addToTrip(r){
  return addPointToTrip({
    id:r.id,
    name:r.locality||r.commonName||r.scientificName||"Occurrence",
    lat:r.lat,
    lon:r.lon,
    source:(r.sources||[]).join("+")||"occurrence",
    visitStatus:"unvisited"
  });
}

async function addPointToTrip(rawPoint){
  try{
    const t=await ensureTrip();
    const p=normalizeTripPoint(rawPoint);
    t.points=Array.isArray(t.points)?t.points:[];

    const duplicate=t.points.find(x=>
      String(x.id)===String(p.id) ||
      (
        Math.abs(Number(x.lat)-p.lat)<1e-7 &&
        Math.abs(Number(x.lon)-p.lon)<1e-7 &&
        String(x.name||"")===String(p.name||"")
      )
    );

    if(duplicate){
      setStatus(`此點已在行程「${t.name}」中。`);
      return false;
    }

    t.points.push(p);
    state.activeTrip=t;
    await saveTrip();
    renderTrips();
    setStatus(`已加入「${p.name}」→ ${t.name}（目前 ${t.points.length} 點）。`);
    return true;
  }catch(e){
    console.error("Add to trip failed",e);
    setStatus(`加入行程失敗：${e.message}`);
    return false;
  }
}

async function addAllVisible(){
  try{
    const t=await ensureTrip();
    t.points=Array.isArray(t.points)?t.points:[];
    let n=0,skipped=0;

    for(const r of state.filtered){
      let p;
      try{
        p=normalizeTripPoint({
          id:r.id,
          name:r.locality||r.commonName||r.scientificName||"Occurrence",
          lat:r.lat,lon:r.lon,
          source:(r.sources||[]).join("+")||"occurrence",
          visitStatus:"unvisited"
        });
      }catch(_){
        skipped++;
        continue;
      }

      const duplicate=t.points.some(x=>
        String(x.id)===String(p.id) ||
        (
          Math.abs(Number(x.lat)-p.lat)<1e-7 &&
          Math.abs(Number(x.lon)-p.lon)<1e-7 &&
          String(x.name||"")===String(p.name||"")
        )
      );

      if(duplicate){skipped++;continue}
      t.points.push(p);n++;
    }

    state.activeTrip=t;
    await saveTrip();
    renderTrips();
    setStatus(`已加入 ${n} 點至「${t.name}」${skipped?`；略過 ${skipped} 筆重複／無效點`:""}。`);
  }catch(e){
    console.error("Bulk add failed",e);
    setStatus(`全部加入失敗：${e.message}`);
  }
}

function customPoints(){
  if(!Array.isArray(state.settings.customPoints))state.settings.customPoints=[];
  return state.settings.customPoints;
}

function customPointTypeLabel(type){
  return ({
    scout:"自訂探點",
    sampling:"採集點",
    parking:"停車點",
    trailhead:"步道入口",
    access:"道路／入口",
    other:"其他"
  })[type]||"自訂探點";
}

function customPointPriorityLabel(priority){
  return ({high:"高",medium:"中",low:"低"})[priority]||"中";
}

function normalizeCustomPoint(p){
  return {
    id:String(p?.id||crypto.randomUUID()),
    profileId:state.profile.id,
    countryCode:state.profile?.countryCode||"",
    name:String(p?.name||"自訂探點"),
    lat:Number(p?.lat),
    lon:Number(p?.lon),
    type:String(p?.type||"scout"),
    priority:String(p?.priority||"medium"),
    targetTaxon:String(p?.targetTaxon||""),
    notes:String(p?.notes||""),
    createdAt:p?.createdAt||new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
}

async function persistCustomPoints(){
  state.settings.customPoints=customPoints();
  await put("settings",state.settings);
  renderCustomPointLibraryMeta();
}

function renderCustomPointLibraryMeta(){
  const box=$("#customPointLibraryMeta");
  if(box)box.textContent=`${customPoints().length} 個已儲存點位`;
}

function customPointTripOptions(selectedId=""){
  return `<option value="">只儲存到點位庫</option>`+
    state.trips.map(t=>`<option value="${esc(t.id)}" ${String(t.id)===String(selectedId)?"selected":""}>加入：${esc(t.name||"Unnamed trip")}</option>`).join("");
}

function readCustomPointFormIntoDraft(){
  const d=state.customPointDraft||{};
  const lat=Number($("#customPointLat")?.value);
  const lon=Number($("#customPointLon")?.value);
  return {
    ...d,
    id:d.id||crypto.randomUUID(),
    name:$("#customPointName")?.value.trim()||"自訂探點",
    lat:Number.isFinite(lat)?lat:d.lat,
    lon:Number.isFinite(lon)?lon:d.lon,
    type:$("#customPointType")?.value||"scout",
    priority:$("#customPointPriority")?.value||"medium",
    targetTaxon:$("#customPointTaxon")?.value.trim()||"",
    notes:$("#customPointNotes")?.value.trim()||"",
    addTripId:$("#customPointTrip")?.value||""
  };
}

function updateCustomPointCoordinateInputs(lat,lon,sourceLabel=""){
  if(Number.isFinite(Number(lat)))$("#customPointLat").value=Number(lat).toFixed(6);
  if(Number.isFinite(Number(lon)))$("#customPointLon").value=Number(lon).toFixed(6);
  const meta=$("#customPointCoordinateMeta");
  if(meta&&sourceLabel)meta.textContent=`座標來源：${sourceLabel}`;
}

function parseCoordinatePair(text){
  const m=String(text||"").trim().match(/(-?\d+(?:\.\d+)?)\s*[,，\s]\s*(-?\d+(?:\.\d+)?)/);
  if(!m)return null;
  const lat=Number(m[1]),lon=Number(m[2]);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<-90||lat>90||lon<-180||lon>180)return null;
  return {lat,lon};
}

function openCustomPointEditor(point=null,options={}){
  const mapCenter=state.map?.getCenter();
  const base=options.draft||point||{
    id:crypto.randomUUID(),
    name:"自訂探點",
    lat:mapCenter?.lat??null,
    lon:mapCenter?.lng??null,
    type:"scout",
    priority:"medium",
    targetTaxon:state.taxon?.scientificName||state.activeTrip?.targetTaxon||"",
    notes:"",
    createdAt:new Date().toISOString()
  };

  state.customPointDraft={
    ...base,
    addTripId:options.addTripId??base.addTripId??state.activeTrip?.id??""
  };

  const d=state.customPointDraft;
  const isEdit=customPoints().some(x=>x.id===d.id);

  showModal(`
    <div class="custom-point-editor">
      <div class="page-kicker">CUSTOM FIELD POINT</div>
      <h2>${isEdit?"編輯自訂採集點":"新增自訂採集點"}</h2>
      <p class="meta">點位會永久保存在目前 workspace，可重複加入不同 Trip。</p>

      <label>點位名稱
        <input id="customPointName" value="${esc(d.name||"")}" placeholder="例如 大雪山林道 23K">
      </label>

      <div class="coordinate-tool-card">
        <div class="coordinate-tool-head">
          <strong>座標</strong>
          <span id="customPointCoordinateMeta" class="meta">可用 GPS、地圖中心、點地圖或手動輸入</span>
        </div>
        <div class="two-col">
          <label>Latitude<input id="customPointLat" inputmode="decimal" value="${Number.isFinite(Number(d.lat))?Number(d.lat).toFixed(6):""}"></label>
          <label>Longitude<input id="customPointLon" inputmode="decimal" value="${Number.isFinite(Number(d.lon))?Number(d.lon).toFixed(6):""}"></label>
        </div>
        <div class="coordinate-buttons">
          <button id="customUseGpsBtn" type="button">目前 GPS</button>
          <button id="customUseCenterBtn" type="button">地圖中心</button>
          <button id="customPickMapBtn" type="button" class="primary">點地圖指定</button>
        </div>
        <div class="coordinate-paste-row">
          <input id="customCoordinatePaste" placeholder="貼上：24.21783, 120.97621">
          <button id="customCoordinatePasteBtn" type="button">套用</button>
        </div>
      </div>

      <div class="two-col">
        <label>點位類型
          <select id="customPointType">
            ${[
              ["scout","自訂探點"],["sampling","採集點"],["parking","停車點"],
              ["trailhead","步道入口"],["access","道路／入口"],["other","其他"]
            ].map(([v,l])=>`<option value="${v}" ${d.type===v?"selected":""}>${l}</option>`).join("")}
          </select>
        </label>
        <label>優先度
          <select id="customPointPriority">
            <option value="high" ${d.priority==="high"?"selected":""}>高</option>
            <option value="medium" ${d.priority==="medium"?"selected":""}>中</option>
            <option value="low" ${d.priority==="low"?"selected":""}>低</option>
          </select>
        </label>
      </div>

      <label>目標物種
        <input id="customPointTaxon" value="${esc(d.targetTaxon||"")}" placeholder="Scientific name / optional">
      </label>

      <label>備註
        <textarea id="customPointNotes" rows="3" placeholder="林相、道路狀況、探點理由…">${esc(d.notes||"")}</textarea>
      </label>

      <label>儲存後
        <select id="customPointTrip">${customPointTripOptions(d.addTripId||"")}</select>
      </label>

      <div class="button-row custom-editor-actions">
        <button id="saveCustomPointBtn" type="button" class="primary">${isEdit?"儲存變更":"儲存點位"}</button>
        ${isEdit?`<button id="deleteCustomPointFromEditorBtn" type="button" class="danger-soft">刪除點位</button>`:""}
      </div>
    </div>
  `);

  $("#customUseCenterBtn").onclick=()=>{
    const c=state.map?.getCenter();
    if(c)updateCustomPointCoordinateInputs(c.lat,c.lng,"目前地圖中心");
  };

  $("#customUseGpsBtn").onclick=()=>{
    if(!navigator.geolocation){
      setStatus("此裝置不支援 GPS。");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p=>{
        state.currentPos={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};
        updateCustomPointCoordinateInputs(p.coords.latitude,p.coords.longitude,`目前 GPS ±${Math.round(p.coords.accuracy)} m`);
      },
      e=>setStatus("GPS："+e.message),
      {enableHighAccuracy:true,timeout:15000,maximumAge:5000}
    );
  };

  $("#customCoordinatePasteBtn").onclick=()=>{
    const parsed=parseCoordinatePair($("#customCoordinatePaste").value);
    if(!parsed){
      setStatus("無法辨識座標，請使用「緯度, 經度」。");
      return;
    }
    updateCustomPointCoordinateInputs(parsed.lat,parsed.lon,"貼上座標");
  };

  $("#customPickMapBtn").onclick=startCustomPointMapPick;
  $("#saveCustomPointBtn").onclick=saveCustomPointFromEditor;

  $("#deleteCustomPointFromEditorBtn")?.addEventListener("click",async()=>{
    const id=state.customPointDraft?.id;
    $("#modal").classList.add("hidden");
    if(id)await deleteCustomPoint(id);
  });
}

function startCustomPointMapPick(){
  state.customPointDraft=readCustomPointFormIntoDraft();
  state.customPointPickMode=true;
  $("#modal").classList.add("hidden");
  $("#customPointPickBar").classList.remove("hidden");

  const lat=Number(state.customPointDraft.lat);
  const lon=Number(state.customPointDraft.lon);
  const start=Number.isFinite(lat)&&Number.isFinite(lon)
    ? L.latLng(lat,lon)
    : state.map.getCenter();

  if(state.customPointTempMarker)state.map.removeLayer(state.customPointTempMarker);
  state.customPointTempMarker=L.marker(start,{draggable:true}).addTo(state.map);
  state.customPointTempMarker.on("dragend",()=>{
    const ll=state.customPointTempMarker.getLatLng();
    state.customPointDraft.lat=ll.lat;
    state.customPointDraft.lon=ll.lng;
  });

  state.map.setView(start,Math.max(state.map.getZoom(),15));
  setStatus("地圖選點：點地圖或拖曳 marker，完成後按「完成」。");
}

function finishCustomPointMapPick(){
  if(!state.customPointPickMode)return;
  const ll=state.customPointTempMarker?.getLatLng();
  if(ll){
    state.customPointDraft.lat=ll.lat;
    state.customPointDraft.lon=ll.lng;
  }
  state.customPointPickMode=false;
  $("#customPointPickBar").classList.add("hidden");
  if(state.customPointTempMarker){
    state.map.removeLayer(state.customPointTempMarker);
    state.customPointTempMarker=null;
  }
  openCustomPointEditor(null,{draft:state.customPointDraft});
}

function cancelCustomPointMapPick(){
  state.customPointPickMode=false;
  $("#customPointPickBar").classList.add("hidden");
  if(state.customPointTempMarker){
    state.map.removeLayer(state.customPointTempMarker);
    state.customPointTempMarker=null;
  }
  openCustomPointEditor(null,{draft:state.customPointDraft});
}

async function addCustomPointToTrip(point,tripId){
  const trip=state.trips.find(t=>t.id===tripId)||state.activeTrip;
  if(!trip)return false;

  trip.points=Array.isArray(trip.points)?trip.points:[];
  if(trip.points.some(p=>p.customPointId===point.id)){
    setStatus(`「${point.name}」已在行程「${trip.name}」中。`);
    return false;
  }

  trip.points.push(normalizeTripPoint({
    id:crypto.randomUUID(),
    customPointId:point.id,
    name:point.name,
    lat:point.lat,
    lon:point.lon,
    source:"custom",
    customType:point.type,
    priority:point.priority,
    notes:point.notes,
    targetTaxon:point.targetTaxon,
    countryCode:point.countryCode,
    visitStatus:"unvisited"
  }));

  trip.updatedAt=new Date().toISOString();
  await put("trips",trip);

  if(state.activeTrip?.id===trip.id)state.activeTrip=normalizeTrip(trip);
  const idx=state.trips.findIndex(t=>t.id===trip.id);
  if(idx>=0)state.trips[idx]=trip;
  return true;
}

async function syncCustomPointToTrips(point){
  for(const trip of state.trips){
    let changed=false;
    trip.points=(trip.points||[]).map(p=>{
      if(p.customPointId!==point.id)return p;
      changed=true;
      return {
        ...p,
        name:point.name,
        lat:point.lat,
        lon:point.lon,
        customType:point.type,
        priority:point.priority,
        notes:point.notes,
        targetTaxon:point.targetTaxon,
        countryCode:point.countryCode
      };
    });
    if(changed){
      trip.updatedAt=new Date().toISOString();
      await put("trips",trip);
    }
  }
  if(state.activeTrip){
    state.activeTrip=normalizeTrip(state.trips.find(t=>t.id===state.activeTrip.id)||state.activeTrip);
  }
}

async function saveCustomPointFromEditor(){
  const d=readCustomPointFormIntoDraft();
  if(!d.name.trim()){
    setStatus("請輸入點位名稱。");
    return;
  }
  if(!Number.isFinite(Number(d.lat))||!Number.isFinite(Number(d.lon))||
     Number(d.lat)<-90||Number(d.lat)>90||Number(d.lon)<-180||Number(d.lon)>180){
    setStatus("請提供有效經緯度。");
    return;
  }

  const existed=customPoints().find(x=>x.id===d.id);
  const point=normalizeCustomPoint({...d,createdAt:existed?.createdAt||d.createdAt});
  const arr=customPoints();
  const idx=arr.findIndex(x=>x.id===point.id);
  if(idx>=0)arr[idx]=point;
  else arr.unshift(point);

  await persistCustomPoints();
  await syncCustomPointToTrips(point);

  let added=false;
  if(d.addTripId){
    added=await addCustomPointToTrip(point,d.addTripId);
  }

  $("#modal").classList.add("hidden");
  renderTrips();
  renderFieldMode();
  focusCustomPoint(point);
  setStatus(
    added
      ? `已儲存「${point.name}」並加入行程。`
      : `已儲存自訂點「${point.name}」。`
  );
}

function focusCustomPoint(point){
  if(!point||!state.map)return;
  const lat=Number(point.lat),lon=Number(point.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon))return;

  state.map.setView([lat,lon],Math.max(state.map.getZoom(),16));
  if(state.customPointPreviewMarker)state.map.removeLayer(state.customPointPreviewMarker);
  state.customPointPreviewMarker=L.marker([lat,lon])
    .bindPopup(`<strong>${esc(point.name)}</strong><br><span class="meta">${esc(customPointTypeLabel(point.type))} · 優先度 ${esc(customPointPriorityLabel(point.priority))}</span>`)
    .addTo(state.map)
    .openPopup();
}

async function deleteCustomPoint(id){
  const point=customPoints().find(x=>x.id===id);
  if(!point)return;
  const linked=state.trips.reduce((n,t)=>n+(t.points||[]).filter(p=>p.customPointId===id).length,0);

  if(!confirm(
    `刪除自訂點「${point.name}」？`+
    (linked?`\n\n它已被 ${linked} 個 Trip point 使用。Trip 中的點位會保留為獨立快照。`:"")
  ))return;

  state.settings.customPoints=customPoints().filter(x=>x.id!==id);
  await persistCustomPoints();

  for(const trip of state.trips){
    let changed=false;
    trip.points=(trip.points||[]).map(p=>{
      if(p.customPointId!==id)return p;
      changed=true;
      const copy={...p};
      delete copy.customPointId;
      return copy;
    });
    if(changed){
      trip.updatedAt=new Date().toISOString();
      await put("trips",trip);
    }
  }

  if(state.activeTrip){
    state.activeTrip=normalizeTrip(state.trips.find(t=>t.id===state.activeTrip.id)||state.activeTrip);
  }
  renderTrips();
  renderFieldMode();
  setStatus(`已刪除自訂點「${point.name}」，Trip 快照已保留。`);
}

function customPointManagerRow(p){
  const linked=state.trips.reduce((n,t)=>n+(t.points||[]).filter(x=>x.customPointId===p.id).length,0);
  return `
    <article class="custom-manager-item">
      <div class="card-top">
        <div>
          <h3>${esc(p.name)}</h3>
          <div class="meta">
            ${esc(customPointTypeLabel(p.type))} · 優先度 ${esc(customPointPriorityLabel(p.priority))}
            · ${Number(p.lat).toFixed(5)}, ${Number(p.lon).toFixed(5)}
            ${p.targetTaxon?`<br><i>${esc(p.targetTaxon)}</i>`:""}
            ${p.notes?`<br>${esc(p.notes)}`:""}
            ${linked?`<br>${linked} 個 Trip point 使用中`:""}
          </div>
        </div>
      </div>
      <div class="actions">
        <button data-custom-focus="${esc(p.id)}">地圖</button>
        <button data-custom-edit="${esc(p.id)}">編輯</button>
        <button data-custom-add="${esc(p.id)}" ${state.activeTrip?"":"disabled"}>加入目前行程</button>
        <button data-custom-delete="${esc(p.id)}" class="danger-soft">刪除</button>
      </div>
    </article>`;
}

function wireCustomPointManager(){
  $$("[data-custom-focus]").forEach(b=>b.onclick=()=>{
    const p=customPoints().find(x=>x.id===b.dataset.customFocus);
    $("#modal").classList.add("hidden");
    focusCustomPoint(p);
  });
  $$("[data-custom-edit]").forEach(b=>b.onclick=()=>{
    const p=customPoints().find(x=>x.id===b.dataset.customEdit);
    if(p)openCustomPointEditor(p);
  });
  $$("[data-custom-add]").forEach(b=>b.onclick=async()=>{
    const p=customPoints().find(x=>x.id===b.dataset.customAdd);
    if(!p||!state.activeTrip)return;
    const added=await addCustomPointToTrip(p,state.activeTrip.id);
    renderTrips();
    if(added)setStatus(`已將「${p.name}」加入目前行程。`);
    showCustomPointManager();
  });
  $$("[data-custom-delete]").forEach(b=>b.onclick=async()=>{
    $("#modal").classList.add("hidden");
    await deleteCustomPoint(b.dataset.customDelete);
    showCustomPointManager();
  });
  document.getElementById("customManagerNewBtn")?.addEventListener("click",()=>openCustomPointEditor());
}

function showCustomPointManager(){
  const pts=customPoints();
  showModal(`
    <div class="custom-point-manager">
      <div class="trip-manager-head">
        <div>
          <div class="page-kicker">CUSTOM POINT LIBRARY</div>
          <h2>自訂採集點</h2>
          <p class="meta">永久保存在目前 ${esc(state.profile?.countryLabel||"")} workspace，可重複加入不同 Trip。</p>
        </div>
        <button id="customManagerNewBtn" type="button" class="primary">＋ 新增點位</button>
      </div>
      <div class="custom-manager-list">
        ${pts.length?pts.map(customPointManagerRow).join(""):`<div class="trip-manager-empty">尚未建立自訂採集點。</div>`}
      </div>
    </div>
  `);
  wireCustomPointManager();
}

function exportTripCsv(){
  const pts=state.activeTrip?.points||[];
  const rows=[["order","name","latitude","longitude","source","customPointId","customType","priority","visitStatus","arrivalAt","arrivalDistanceM"]];
  pts.forEach((p,i)=>rows.push([i+1,p.name,p.lat,p.lon,p.source,p.customPointId||"",p.customType||"",p.priority||"",p.visitStatus,p.arrivalAt||"",p.arrivalDistanceM||""]));
  downloadText("fieldscout_trip.csv","text/csv;charset=utf-8",toCSV(rows));
}
function exportTripGeoJSON(){downloadText("fieldscout_trip.geojson","application/geo+json",JSON.stringify(geojsonPoints(state.activeTrip?.points||[],p=>({name:p.name,source:p.source,customPointId:p.customPointId||null,customType:p.customType||null,priority:p.priority||null,visitStatus:p.visitStatus})),null,2))}
function exportTripGpx(){downloadText("fieldscout_trip.gpx","application/gpx+xml",gpxWaypoints(state.activeTrip?.points||[],state.activeTrip?.name||"FieldScout Trip"))}
async function importGpx(e){
  const f=e.target.files?.[0];
  if(!f)return;
  try{
    const t=await ensureTrip();
    t.points=Array.isArray(t.points)?t.points:[];
    const imported=parseGpx(await f.text()).map(normalizeTripPoint);
    t.points.push(...imported);
    state.activeTrip=t;
    await saveTrip();
    renderTrips();
    setStatus(`GPX 已匯入 ${imported.length} 個 waypoint。`);
  }catch(err){
    console.error(err);
    setStatus(`GPX 匯入失敗：${err.message}`);
  }finally{
    e.target.value="";
  }
}
function startTrack(){
  if(!navigator.geolocation){
    setStatus("此裝置不支援 GPS Track。");
    return;
  }
  state.track=[];
  $("#trackStartBtn").disabled=true;
  $("#trackStopBtn").disabled=false;
  $("#trackMeta").textContent="正在記錄…";
  state.trackWatch=navigator.geolocation.watchPosition(
    p=>{
      state.currentPos={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};
      state.track.push({
        lat:p.coords.latitude,
        lon:p.coords.longitude,
        accuracy:p.coords.accuracy,
        time:Date.now()
      });
      $("#trackMeta").textContent=`記錄中 · ${state.track.length} 點 · ±${Math.round(p.coords.accuracy)} m`;
      renderFieldMode();
    },
    e=>setStatus("GPS Track："+e.message),
    {enableHighAccuracy:true,maximumAge:0,timeout:20000}
  );
}

async function stopTrack(){
  if(state.trackWatch!=null)navigator.geolocation.clearWatch(state.trackWatch);
  state.trackWatch=null;
  $("#trackStartBtn").disabled=false;
  $("#trackStopBtn").disabled=true;
  $("#trackMeta").textContent=`已停止 · ${state.track.length} 點`;
  if(state.activeTrip){
    state.activeTrip.track=[...state.track];
    await saveTrip();
  }
}

function activeTripPointById(id){
  if(!id||!state.activeTrip)return null;
  return (state.activeTrip.points||[]).find(p=>String(p.id)===String(id))||null;
}

function renderRecordTripPointOptions(selectedValue=null){
  const sel=$("#recordTripPoint");
  if(!sel)return;

  const current=selectedValue!==null
    ? String(selectedValue||"")
    : String(sel.value||"");

  const pts=state.activeTrip?.points||[];
  sel.innerHTML=
    `<option value="">未綁定行程點</option>`+
    pts.map((p,i)=>`
      <option value="${esc(p.id)}">
        ${String.fromCharCode(65+(i%26))}. ${esc(p.name||"Point")} · ${esc(p.visitStatus||"unvisited")}
      </option>`).join("");

  if(pts.some(p=>String(p.id)===current))sel.value=current;
}

function useTripPointGps(){
  const p=activeTripPointById($("#recordTripPoint").value);
  if(!p){
    setStatus("請先選擇一個行程採集點。");
    return;
  }
  state.recordGps={
    lat:Number(p.lat),
    lon:Number(p.lon),
    accuracyM:null
  };
  renderRecordGps();
  setStatus(`已使用行程點「${p.name}」的座標。`);
}

function captureRecordGps(){navigator.geolocation.getCurrentPosition(p=>{state.recordGps={lat:p.coords.latitude,lon:p.coords.longitude,accuracyM:p.coords.accuracy};renderRecordGps()},e=>setStatus(e.message),{enableHighAccuracy:true,timeout:15000})}
function renderRecordGps(){if(!state.recordGps){$("#recordGpsText").textContent="尚未取得 GPS";$("#recordGpsAcc").textContent="";return}$("#recordGpsText").textContent=`${state.recordGps.lat.toFixed(5)}, ${state.recordGps.lon.toFixed(5)}`;$("#recordGpsAcc").textContent=`±${Math.round(state.recordGps.accuracyM)} m`}
async function nextSpecimen(){const p=state.settings.specimenPrefix||"FS",n=state.settings.specimenCounter||1;$("#specimenId").value=`${p}${String(n).padStart(5,"0")}`;state.settings.specimenCounter=n+1;$("#specimenCounter").value=state.settings.specimenCounter;await put("settings",state.settings)}
async function saveRecord(e){
  e.preventDefault();

  const id=$("#recordId").value||crypto.randomUUID();
  const old=state.records.find(r=>r.id===id);
  const files=[...$("#recordPhotos").files];
  const photoIds=[...(old?.photoIds||[])];

  for(const f of files){
    const blob=await sanitizeImage(f);
    const pid=crypto.randomUUID();
    await put("photos",{
      id:pid,
      profileId:state.profile.id,
      recordId:id,
      blob,
      createdAt:new Date().toISOString()
    });
    photoIds.push(pid);
  }

  const tripPointId=$("#recordTripPoint").value||null;
  const linkedPoint=activeTripPointById(tripPointId);

  const r={
    id,
    profileId:state.profile.id,
    countryCode:state.profile?.countryCode||"",
    specimenId:$("#specimenId").value.trim(),
    count:Math.max(1,+$("#recordCount").value||1),
    taxon:$("#recordTaxon").value.trim(),
    microhabitat:$("#microhabitat").value,
    method:$("#method").value,
    notes:$("#recordNotes").value.trim(),
    lat:state.recordGps?.lat??old?.lat??linkedPoint?.lat??null,
    lon:state.recordGps?.lon??old?.lon??linkedPoint?.lon??null,
    accuracyM:state.recordGps?.accuracyM??old?.accuracyM??null,
    batchSiteId:old?.batchSiteId||null,
    tripId:tripPointId?(state.activeTrip?.id||old?.tripId||null):null,
    tripPointId,
    photoIds,
    createdAt:old?.createdAt||new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };

  await put("records",r);
  state.records=state.records.filter(x=>x.id!==id);
  state.records.unshift(r);

  // A field record linked to a target means the site has at least been surveyed.
  if(linkedPoint && state.activeTrip){
    if(["unvisited","arrived"].includes(linkedPoint.visitStatus||"unvisited")){
      linkedPoint.visitStatus="surveyed";
      linkedPoint.surveyedAt=new Date().toISOString();
      await saveTrip();
    }
  }

  resetRecordForm();
  renderRecords();
  renderTrips();
  setStatus(linkedPoint
    ? `採集紀錄已儲存並綁定「${linkedPoint.name}」。`
    : "採集紀錄已儲存。");

  if(state.fieldModeReturn && linkedPoint){
    state.fieldModeReturn=false;
    const pts=fieldModePoints();
    const idx=pts.findIndex(p=>p.id===linkedPoint.id);
    if(idx>=0)state.fieldModeIndex=idx;
    switchTab("field");
    renderFieldMode();
  }
}

function resetRecordForm(){
  $("#recordForm").reset();
  $("#recordCount").value=1;
  $("#recordId").value="";
  state.recordGps=null;
  renderRecordGps();
  renderRecordTripPointOptions("");
  $("#saveRecordBtn").textContent="儲存紀錄";
  $("#cancelEditBtn").classList.add("hidden");
}
async function editRecord(r){
  switchTab("records");
  $("#recordId").value=r.id;
  $("#specimenId").value=r.specimenId;
  $("#recordCount").value=r.count;
  $("#recordTaxon").value=r.taxon||"";
  $("#microhabitat").value=r.microhabitat;
  $("#method").value=r.method;
  $("#recordNotes").value=r.notes||"";
  renderRecordTripPointOptions(r.tripPointId||"");
  if(r.lat!=null)state.recordGps={lat:Number(r.lat),lon:Number(r.lon),accuracyM:Number(r.accuracyM)||0};
  renderRecordGps();
  $("#saveRecordBtn").textContent="更新紀錄";
  $("#cancelEditBtn").classList.remove("hidden");
}
async function deleteRecord(id){if(!confirm("刪除此紀錄？"))return;await del("records",id);const photos=(await byProfile("photos",state.profile.id)).filter(p=>p.recordId===id);for(const p of photos)await del("photos",p.id);state.records=state.records.filter(r=>r.id!==id);renderRecords()}
function renderRecords(){
  $("#recordMeta").textContent=`${state.records.length} 筆`;

  $("#recordList").innerHTML=state.records.length
    ? state.records.map((r,i)=>{
        const issues=qcRecord(r,state.records,state.profile?.countryCode||"");
        const linkedTrip=state.trips.find(t=>t.id===r.tripId);
        const linkedPoint=(linkedTrip?.points||[]).find(p=>p.id===r.tripPointId);
        const lat=Number(r.lat),lon=Number(r.lon);
        const hasGps=Number.isFinite(lat)&&Number.isFinite(lon);

        return `<article class="card">
          <h3>${esc(r.specimenId)} · ${esc(r.taxon||"未定名")}</h3>
          <div class="meta">
            ${r.count} 個體 · ${esc(r.microhabitat)} · ${esc(r.method)}<br>
            ${hasGps?`${lat.toFixed(5)}, ${lon.toFixed(5)} · ±${Math.round(Number(r.accuracyM)||0)} m`:"無 GPS"}<br>
            ${linkedPoint?`行程點：${esc(linkedPoint.name)}<br>`:""}
            ${new Date(r.updatedAt).toLocaleString("zh-TW")}
          </div>
          ${issues.length
            ? `<div class="meta warning">QC：${esc(issues.join("；"))}</div>`
            : `<div class="meta ok">QC PASS</div>`}
          <div class="actions">
            <button data-redit="${i}">編輯</button>
            <button data-rdel="${i}">刪除</button>
            ${hasGps?`<button data-rfocus="${i}">地圖</button><a class="nav-link" target="_blank" href="${googleMapsUrl(lat,lon)}">Google Maps</a>`:""}
            ${r.photoIds?.length?`<button data-rphotos="${i}">照片 ${r.photoIds.length}</button>`:""}
          </div>
        </article>`;
      }).join("")
    : `<div class="empty">尚無採集紀錄。</div>`;

  $$("[data-redit]").forEach(b=>b.onclick=()=>editRecord(state.records[+b.dataset.redit]));
  $$("[data-rdel]").forEach(b=>b.onclick=()=>deleteRecord(state.records[+b.dataset.rdel].id));
  $$("[data-rfocus]").forEach(b=>b.onclick=()=>{
    const r=state.records[+b.dataset.rfocus];
    switchTab("explore");
    if(state.map)state.map.setView([Number(r.lat),Number(r.lon)],16);
  });
  $$("[data-rphotos]").forEach(b=>b.onclick=()=>showPhotos(state.records[+b.dataset.rphotos]));
}

async function showPhotos(r){const ps=(await byProfile("photos",state.profile.id)).filter(p=>r.photoIds.includes(p.id));const urls=ps.map(p=>URL.createObjectURL(p.blob));showModal(`<h2>${esc(r.specimenId)}</h2><div class="photo-grid">${urls.map(u=>`<img src="${u}">`).join("")}</div>`)}
function exportRecordsCsv(){
  const rows=[["id","countryCode","specimenId","count","taxon","microhabitat","method","notes","latitude","longitude","accuracyM","tripId","tripPointId","createdAt","updatedAt"]];
  state.records.forEach(r=>rows.push([r.id,r.countryCode||state.profile?.countryCode||"",r.specimenId,r.count,r.taxon,r.microhabitat,r.method,r.notes,r.lat??"",r.lon??"",r.accuracyM??"",r.tripId||"",r.tripPointId||"",r.createdAt,r.updatedAt]));
  downloadText("fieldscout_records.csv","text/csv;charset=utf-8",toCSV(rows));
}
function exportRecordsGeoJSON(){downloadText("fieldscout_records.geojson","application/geo+json",JSON.stringify(geojsonPoints(state.records,r=>({specimenId:r.specimenId,count:r.count,taxon:r.taxon,microhabitat:r.microhabitat,method:r.method,notes:r.notes,accuracyM:r.accuracyM,countryCode:r.countryCode||state.profile?.countryCode||null,tripId:r.tripId||null,tripPointId:r.tripPointId||null})),null,2))}
function exportSensitiveCsv(){const radius=+prompt("座標模糊半徑（公尺）","1000")||1000,rows=[["specimenId","taxon","latitude","longitude","obscureRadiusM"]];state.records.forEach(r=>{if(r.lat==null)return;const p=obscurePoint(r.lat,r.lon,radius,`${state.profile.id}:${r.id}`);rows.push([r.specimenId,r.taxon,p.lat,p.lon,radius])});downloadText("fieldscout_records_obscured.csv","text/csv;charset=utf-8",toCSV(rows))}

function exportSearchCsv(){
  const rows=[[
    "id","scientificName","commonName","locality","eventDate","latitude","longitude",
    "sources","basisOfRecord","uncertaintyM","hasPhoto",
    "datasetUUID","datasetName","datasetURL","license","mediaLicense",
    "sensitiveCategory","dataGeneralizations","imageUrls","sourceUrls"
  ]];
  state.filtered.forEach(r=>rows.push([
    r.id,r.scientificName,r.commonName,r.locality,r.eventDate,r.lat,r.lon,
    (r.sources||[]).join("|"),r.basisOfRecord,r.uncertaintyM??"",r.hasPhoto,
    r.datasetUUID||"",r.datasetName||"",r.datasetURL||"",r.license||"",r.mediaLicense||"",
    r.sensitiveCategory||"",!!r.dataGeneralizations,(r.imageUrls||[]).join("|"),(r.sourceUrls||[]).join("|")
  ]));
  downloadText("fieldscout_occurrences.csv","text/csv;charset=utf-8",toCSV(rows));
}
function exportSearchGeoJSON(){
  downloadText("fieldscout_occurrences.geojson","application/geo+json",JSON.stringify(
    geojsonPoints(state.filtered,r=>({
      scientificName:r.scientificName,commonName:r.commonName,locality:r.locality,
      eventDate:r.eventDate,sources:r.sources,basisOfRecord:r.basisOfRecord,
      uncertaintyM:r.uncertaintyM,hasPhoto:r.hasPhoto,
      datasetUUID:r.datasetUUID||"",datasetName:r.datasetName||"",
      datasetURL:r.datasetURL||"",license:r.license||"",mediaLicense:r.mediaLicense||"",
      sensitiveCategory:r.sensitiveCategory||"",
      dataGeneralizations:!!r.dataGeneralizations,
      imageUrls:r.imageUrls||[],
      sourceUrls:r.sourceUrls||[]
    })),null,2
  ));
}

async function saveSpecimenSettings(){state.settings.specimenPrefix=$("#specimenPrefix").value.trim()||"FS";state.settings.specimenCounter=Math.max(1,+$("#specimenCounter").value||1);await put("settings",state.settings);setStatus("編號設定已儲存。")}
function renderMonthChart(){
  const counts=Array(12).fill(0);
  state.allRecords.forEach(r=>{
    const m=+String(r.eventDate||"").slice(5,7);
    if(m>=1&&m<=12)counts[m-1]++;
  });

  const mx=Math.max(1,...counts);
  const selected=Number($("#filterMonth").value)||0;

  $("#monthChart").innerHTML=counts.map((v,i)=>`
    <button type="button"
      class="month-bar-wrap ${selected===i+1?"selected":""}"
      data-month-filter="${i+1}"
      aria-label="${i+1} 月，共 ${v} 筆紀錄">
      <span class="month-count">${v}</span>
      <span class="month-bar" style="height:${Math.max(3,100*v/mx)}%"></span>
      <span class="month-label">${i+1}月</span>
    </button>`).join("");

  $$("[data-month-filter]").forEach(b=>b.onclick=()=>{
    const month=Number(b.dataset.monthFilter);
    $("#filterMonth").value=(Number($("#filterMonth").value)===month)?"":String(month);
    applyFilters();
    setStatus($("#filterMonth").value
      ? `已套用 ${month} 月篩選。再次點同月份可取消。`
      : "已取消月份篩選。");
  });
}


async function exportBackup(){
  const photos=await byProfile("photos",state.profile.id);
  const photoData=[];
  for(const p of photos){
    const b64=await blobToBase64(p.blob);
    photoData.push({...p,blob:null,dataUrl:b64});
  }
  const caches=(await byProfile("cache",state.profile.id))
    .filter(c=>c.kind!=="offline-map");
  downloadText(
    "fieldscout_backup.json",
    "application/json",
    JSON.stringify({
      version:"0.16.0",
      profile:state.profile,
      settings:state.settings,
      trips:state.trips,
      records:state.records,
      photos:photoData,
      cache:caches,
      exportedAt:new Date().toISOString()
    },null,2)
  );
}
function blobToBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(blob)})}
async function dataUrlToBlob(url){return await (await fetch(url)).blob()}
async function restoreBackup(e){
  const f=e.target.files?.[0];if(!f)return;
  try{const d=JSON.parse(await f.text());if(!d.profile?.email)throw new Error("無效 backup");if(d.profile.id!==state.profile.id&&!confirm(`Backup 屬於 ${d.profile.email}，仍要匯入目前 profile？`))return;
    if(d.settings)await put("settings",{...d.settings,id:`${state.profile.id}:settings`,profileId:state.profile.id});
    for(const t of d.trips||[])await put("trips",{...t,profileId:state.profile.id});
    for(const r of d.records||[])await put("records",{...r,profileId:state.profile.id});
    for(const p of d.photos||[])await put("photos",{...p,profileId:state.profile.id,blob:await dataUrlToBlob(p.dataUrl)});
    for(const c of d.cache||[]){
      if(c.kind==="offline-map")continue;
      await put("cache",{...c,profileId:state.profile.id});
    }
    state.settings=await get("settings",`${state.profile.id}:settings`);await loadProfileData();renderAll();setStatus("Backup 還原完成。")
  }catch(err){setStatus("還原失敗："+err.message)}e.target.value=""
}
function switchProfile(){location.reload()}
async function deleteProfile(){if(!confirm(`永久刪除 ${state.profile.email} 在此瀏覽器的所有 FieldScout 資料？`))return;await deleteProfileData(state.profile.id);location.reload()}
function showModal(html){$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden")}

function renderAll(){
  renderTrips();
  renderRecords();
  renderMonthChart();
  renderFieldMode();
}
boot();
