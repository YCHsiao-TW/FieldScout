let currentLanguage="zh-Hant";
let observer=null;
let translating=false;

const ZH_TO_EN={
  // Profile gate
  "選擇使用國家並輸入電子郵件，開啟這個裝置上的 FieldScout 工作空間。":"Choose a country and enter your email to open this device's FieldScout workspace.",
  "使用國家":"Country",
  "介面語言":"Interface language",
  "電子郵件":"Email",
  "開啟 FieldScout":"Open FieldScout",
  "這不是帳號登入。Email 與使用國家只用來識別本機 IndexedDB workspace，不會送到 FieldScout 伺服器。 同一裝置中「相同 email + 相同國家」會開啟同一份資料；不同國家會使用獨立 workspace。":"This is not an account login. Email and country only identify a local IndexedDB workspace on this device. The same email + country opens the same local data; different countries use separate workspaces.",

  // Main navigation
  "探索":"Explore",
  "行程":"Trips",
  "野外":"Field",
  "採集":"Records",
  "設定":"Settings",
  "＋ 自訂點":"+ Custom Point",
  "地圖選點":"Pick on map",
  "點地圖或拖曳 marker 微調位置":"Tap the map or drag the marker to refine the position.",
  "取消":"Cancel",
  "完成":"Done",
  "一般地圖":"Map",
  "地形":"Terrain",
  "衛星影像":"Satellite",
  "準備完成。":"Ready.",

  // Explore
  "搜尋":"Search",
  "進階篩選與排序":"Advanced filters & sorting",
  "起始日期":"Start date",
  "結束日期":"End date",
  "月份":"Month",
  "全部":"All",
  "不限":"Any",
  "距離":"Distance",
  "來源":"Source",
  "最大座標誤差 (m)":"Maximum coordinate uncertainty (m)",
  "排序":"Sort",
  "距離最近":"Nearest",
  "最新紀錄":"Newest",
  "最舊紀錄":"Oldest",
  "座標精度最好":"Best coordinate precision",
  "多來源支持":"Multi-source support",
  "行政區／地名":"Locality / place",
  "有照片":"With photos",
  "只看目前地圖範圍":"Current map extent only",
  "套用":"Apply",
  "清除":"Clear",
  "月份紀錄":"Monthly records",
  "點月份可直接篩選該月紀錄":"Tap a month to filter records.",
  "全部月份":"All months",
  "推薦候選樣點 Top 5":"Top 5 candidate sites",
  "依紀錄密度、近期性、月份、距離、座標品質與多來源支持排名":"Ranked by record density, recency, month support, distance, coordinate quality, and multi-source support.",
  "重新排名":"Re-rank",
  "其他候選樣點":"Other candidate sites",
  "原始物種紀錄":"Source occurrence records",
  "尚未搜尋":"Not searched yet",
  "選取後會保持高亮，直到選擇另一個點":"Selection remains highlighted until another point is selected.",
  "全部加入行程":"Add all to Trip",

  // Trips
  "整理採集目標、排序路線與準備野外工作。":"Organize targets, order routes, and prepare fieldwork.",
  "目前行程":"Current Trip",
  "編輯行程":"Edit Trips",
  "＋ 新增":"+ New",
  "尚未選擇行程":"No Trip selected",
  "建立或選擇一個行程後開始規劃。":"Create or select a Trip to start planning.",
  "自訂採集點":"Custom Points",
  "＋ 新增":"+ New",
  "點位庫":"Point Library",
  "路線控制台":"Route controls",
  "行程點數不限；Google Maps 多點導航會自動分段，野外模式則逐點導航。":"Trips have no point limit. Google Maps multi-stop routes are segmented automatically; Field navigates one target at a time.",
  "最佳化順序":"Optimize order",
  "北 → 南":"North → South",
  "全部移除":"Remove all",
  "加入採集目標後，這裡會生成導航路線。":"Add targets to generate a navigation route.",
  "行程資料與匯出":"Trip details & export",
  "目標物種":"Target taxon",
  "日期":"Date",
  "狀態":"Status",
  "規劃中":"Planned",
  "進行中":"Active",
  "已完成":"Completed",
  "備註":"Notes",
  "儲存資訊":"Save details",
  "匯入 GPX":"Import GPX",
  "採集目標":"Field targets",
  "點「地圖」或 marker 可持續選取":"Tap Map or a marker to keep a target selected.",
  "尚未選擇":"Not selected",
  "尚未設定日期":"Date not set",

  // Field
  "專注執行目前行程：導航、訪查狀態、GPS Track 與採集紀錄。":"Run the active Trip: navigation, visit status, GPS Track, and field records.",
  "規劃":"Plan",
  "尚未有可執行的行程":"No runnable Trip yet",
  "先到「行程」建立或選擇 Trip，並加入至少一個採集目標。":"Create or select a Trip and add at least one target first.",
  "前往行程規劃":"Go to Trip planning",
  "未訪查":"Unvisited",
  "已到達":"Arrived",
  "完成調查":"Surveyed",
  "無法到達":"Inaccessible",
  "再訪":"Revisit",
  "需要再訪":"Revisit",
  "Google Maps 導航":"Navigate with Google Maps",
  "＋ 採集紀錄":"+ Field record",
  "← 上一點":"← Previous",
  "◎ 更新 GPS":"◎ Refresh GPS",
  "下一點 →":"Next →",
  "尚未開始":"Not started",
  "開始":"Start",
  "停止":"Stop",
  "尚無採集點":"No target",

  // Records
  "採集／觀察紀錄":"Field records",
  "可綁定行程點，或直接取得現場 GPS。":"Link a Trip Point or capture live field GPS.",
  "標本／紀錄號":"Specimen / record ID",
  "自動編號":"Auto ID",
  "數量":"Count",
  "物種":"Taxon",
  "對應行程採集點":"Linked Trip Point",
  "未綁定行程點":"No linked Trip Point",
  "綁定後，採集成果會回連到 A / B / C 採集目標。":"Linked records are associated with the selected A / B / C field target.",
  "微棲地":"Microhabitat",
  "地表／落葉層":"Ground / leaf litter",
  "草叢":"Grass / vegetation",
  "石下":"Under rock",
  "樹幹":"Tree trunk",
  "溪流邊":"Streamside",
  "水域":"Aquatic",
  "建物":"Building",
  "其他":"Other",
  "方法":"Method",
  "手採":"Hand collecting",
  "目視觀察":"Visual observation",
  "相機":"Camera",
  "尚未取得 GPS":"GPS not captured",
  "取得現場 GPS":"Capture live GPS",
  "使用行程點 GPS":"Use Trip Point GPS",
  "照片（本機保存於 IndexedDB）":"Photos (stored locally in IndexedDB)",
  "儲存紀錄":"Save record",
  "取消編輯":"Cancel editing",
  "我的紀錄":"My records",
  "模糊座標 CSV":"Obscured-coordinate CSV",
  "未定名":"Unidentified",
  "無 GPS":"No GPS",

  // Settings
  "目前 Local Workspace":"Current local workspace",
  "標本號自動編號":"Automatic specimen numbering",
  "下一號":"Next number",
  "儲存編號設定":"Save numbering",
  "完整備份／還原":"Backup / Restore",
  "匯出 Backup JSON":"Export Backup JSON",
  "匯入 Backup":"Import Backup",
  "資料管理":"Data management",
  "切換 Profile":"Switch Profile",
  "刪除此 Profile":"Delete this Profile",
  "語言與介面":"Language & interface",
  "切換後立即套用，並保存在目前 workspace。":"Changes apply immediately and are saved in the current workspace.",

  // Custom point editor / manager
  "新增自訂採集點":"New Custom Point",
  "編輯自訂採集點":"Edit Custom Point",
  "點位會永久保存在目前 workspace，可重複加入不同 Trip。":"The point is stored persistently in this workspace and can be reused across Trips.",
  "點位名稱":"Point name",
  "座標":"Coordinates",
  "可用 GPS、地圖中心、點地圖或手動輸入":"Use GPS, map center, map selection, or manual coordinates.",
  "目前 GPS":"Current GPS",
  "地圖中心":"Map center",
  "點地圖指定":"Pick on map",
  "套用":"Apply",
  "點位類型":"Point type",
  "自訂探點":"Scout site",
  "採集點":"Sampling site",
  "停車點":"Parking",
  "步道入口":"Trailhead",
  "道路／入口":"Road / access",
  "優先度":"Priority",
  "高":"High",
  "中":"Medium",
  "低":"Low",
  "目標物種":"Target taxon",
  "儲存後":"After saving",
  "只儲存到點位庫":"Save to Point Library only",
  "儲存點位":"Save point",
  "儲存變更":"Save changes",
  "刪除點位":"Delete point",
  "永久保存在目前 workspace，可重複加入不同 Trip。":"Stored persistently in this workspace and reusable across Trips.",
  "地圖":"Map",
  "編輯":"Edit",
  "加入目前行程":"Add to current Trip",
  "刪除":"Delete",
  "尚未建立自訂採集點。":"No Custom Points yet.",

  // Trip Manager
  "改名、切換或刪除行程。刪除行程不會刪除採集紀錄。":"Rename, switch, or delete Trips. Deleting a Trip does not delete field records.",
  "＋ 新增行程":"+ New Trip",
  "行程名稱":"Trip name",
  "設為目前":"Set active",
  "使用中":"Active",
  "儲存名稱":"Save name",
  "尚未建立行程。":"No Trips yet.",

  // Candidate explanation
  "為什麼推薦？":"Why recommended?",
  "紀錄密度":"Record density",
  "近期性":"Recency",
  "月份支持":"Month support",
  "距離／可達性":"Distance / access",
  "座標品質":"Coordinate quality",
  "單一來源":"Single source",
  "這是 FieldScout 的 heuristic field-scouting score，不是 SDM 或棲地適合度。":"This is a FieldScout field-scouting heuristic, not an SDM or habitat-suitability score.",

  // Generic
  "詳情":"Details",
  "導航此點":"Navigate",
  "加入行程":"Add to Trip",
  "上移":"Move up",
  "下移":"Move down",
  "移除":"Remove",
  "原始紀錄":"Source record",
  "原始資料圖片":"Source images",
  "開啟原始圖片":"Open source image",
  "未提供":"Not provided",
  "無建議":"No suggestions",
  "無符合紀錄。":"No matching records.",
  "尚無候選樣點。":"No candidate sites.",
  "沒有其他候選樣點。":"No other candidate sites.",
  "尚無採集紀錄。":"No field records.",
  "編輯自訂點":"Edit Custom Point"
};

const PLACEHOLDER_MAP={
  "輸入學名或中文名":"Scientific or common name",
  "例如 南投、花蓮":"e.g. Nantou, Hualien",
  "可留空":"Optional",
  "行程備註":"Trip notes",
  "Scientific name / 中文名":"Scientific or common name",
  "例如 大雪山林道 23K":"e.g. Dasyueshan Forest Road 23K",
  "林相、道路狀況、探點理由…":"Vegetation, access conditions, scouting rationale…",
  "貼上：24.21783, 120.97621":"Paste: 24.21783, 120.97621"
};

const ARIA_MAP={
  "地圖圖層":"Basemap"
};

const originalText=new WeakMap();
const originalAttrs=new WeakMap();

function preserveWhitespace(original,replacement){
  const lead=(original.match(/^\s*/)||[""])[0];
  const tail=(original.match(/\s*$/)||[""])[0];
  return lead+replacement+tail;
}

function dynamicEnglish(text){
  const s=String(text||"").trim();
  if(!s)return s;
  if(ZH_TO_EN[s])return ZH_TO_EN[s];

  let m;
  if((m=s.match(/^(\d+)月$/)))return `${m[1]} mo`;
  if((m=s.match(/^(\d+) 月，共 (\d+) 筆紀錄$/)))return `Month ${m[1]} · ${m[2]} records`;
  if((m=s.match(/^(\d+) 筆$/)))return `${m[1]} records`;
  if((m=s.match(/^(\d+) 筆採集紀錄$/)))return `${m[1]} field records`;
  if((m=s.match(/^(\d+) 個已儲存點位$/)))return `${m[1]} saved points`;
  if((m=s.match(/^(\d+) 個採集目標$/)))return `${m[1]} targets`;
  if((m=s.match(/^(\d+) \/ (\d+) 完成$/)))return `${m[1]} / ${m[2]} complete`;
  if((m=s.match(/^下一個未完成：(.+)$/)))return `Next unfinished: ${m[1]}`;
  if((m=s.match(/^距離 ([\d.]+) km$/)))return `${m[1]} km away`;
  if(s==="距離 —")return "Distance —";
  if((m=s.match(/^最新 (.+)$/)))return `Newest ${m[1]}`;
  if((m=s.match(/^月份匹配 (\d+)\/(\d+)$/)))return `Month match ${m[1]}/${m[2]}`;
  if((m=s.match(/^median ±(.+) m$/)))return `median ±${m[1]} m`;
  if((m=s.match(/^共 (\d+) 個點；Google Maps 已自動分成 (\d+) 段$/)))return `${m[1]} points · Google Maps split into ${m[2]} segments`;
  if((m=s.match(/^(\d+) 個採集目標 · (planned|active|completed)$/))){
    const st={planned:"Planned",active:"Active",completed:"Completed"}[m[2]];
    return `${m[1]} targets · ${st}`;
  }
  if((m=s.match(/^(\d+) 個 Trip point 使用中$/)))return `Used by ${m[1]} Trip Points`;
  if((m=s.match(/^(\d+) 筆紀錄$/)))return `${m[1]} records`;
  if((m=s.match(/^照片 (\d+)$/)))return `Photos ${m[1]}`;
  if((m=s.match(/^GPS 已更新：±(\d+) m$/)))return `GPS updated: ±${m[1]} m`;
  if((m=s.match(/^GPS ±(\d+) m$/)))return `GPS ±${m[1]} m`;
  if((m=s.match(/^記錄中 · (\d+) 點 · ±(\d+) m$/)))return `Recording · ${m[1]} points · ±${m[2]} m`;
  if((m=s.match(/^已停止 · (\d+) 點$/)))return `Stopped · ${m[1]} points`;
  if((m=s.match(/^(\d+) 點 · ±(\d+) m$/)))return `${m[1]} points · ±${m[2]} m`;

  // Common runtime messages with user/data substitutions.
  const patterns=[
    [/^已建立行程「(.+)」。$/,m=>`Created Trip “${m[1]}”.`],
    [/^已自動建立行程「(.+)」。$/,m=>`Automatically created Trip “${m[1]}”.`],
    [/^行程已改名為「(.+)」。$/,m=>`Trip renamed to “${m[1]}”.`],
    [/^已刪除行程「(.+)」；採集紀錄已保留。$/,m=>`Deleted Trip “${m[1]}”; field records were preserved.`],
    [/^已儲存自訂點「(.+)」。$/,m=>`Saved Custom Point “${m[1]}”.`],
    [/^已儲存「(.+)」並加入行程。$/,m=>`Saved “${m[1]}” and added it to the Trip.`],
    [/^已刪除自訂點「(.+)」，Trip 快照已保留。$/,m=>`Deleted Custom Point “${m[1]}”; existing Trip snapshots were preserved.`],
    [/^已將「(.+)」加入目前行程。$/,m=>`Added “${m[1]}” to the current Trip.`],
    [/^「(.+)」已在行程「(.+)」中。$/,m=>`“${m[1]}” is already in Trip “${m[2]}”.`],
    [/^已使用行程點「(.+)」的座標。$/,m=>`Using coordinates from Trip Point “${m[1]}”.`],
    [/^採集紀錄已儲存並綁定「(.+)」。$/,m=>`Field record saved and linked to “${m[1]}”.`],
    [/^快速紀錄：已綁定 (.+)。儲存後會回到「野外」頁。$/,m=>`Quick record linked to ${m[1]}. After saving, you will return to Field.`],
    [/^整合 (\d+) 筆；GBIF (\d+)、iNaturalist (\d+)(.*)$/,m=>`Merged ${m[1]} records · GBIF ${m[2]} · iNaturalist ${m[3]}${m[4]||""}`],
    [/^(.+)：整合 (\d+) 筆；GBIF (\d+)、iNaturalist (\d+)(.*)$/,m=>`${m[1]}: merged ${m[2]} records · GBIF ${m[3]} · iNaturalist ${m[4]}${m[5]||""}`],
    [/^正在查詢 GBIF、iNaturalist…$/,()=>`Searching GBIF and iNaturalist…`],
    [/^已載入 (.+) 快取的 (\d+) 筆紀錄。$/,m=>`Loaded ${m[2]} cached records from ${m[1]}.`],
    [/^目前無法連線，已載入 (.+) 快取的 (\d+) 筆紀錄。$/,m=>`Offline: loaded ${m[2]} cached records from ${m[1]}.`],
    [/^搜尋失敗，且此物種尚無本機快取：(.*)$/,m=>`Search failed and no local cache exists for this taxon: ${m[1]}`],
    [/^路線最佳化失敗：(.*)$/,m=>`Route optimization failed: ${m[1]}`],
    [/^已用最近鄰 heuristic 重排：估計直線路徑 ([\d.]+) → ([\d.]+) km。Google Maps 仍會依道路重新導航。$/,m=>`Reordered with nearest-neighbor heuristic: estimated straight-line path ${m[1]} → ${m[2]} km. Google Maps will still route by roads.`],
    [/^GPX 已匯入 (\d+) 個 waypoint。$/,m=>`Imported ${m[1]} GPX waypoints.`],
    [/^GPX 匯入失敗：(.*)$/,m=>`GPX import failed: ${m[1]}`],
    [/^已清空行程「(.+)」的所有採集目標；採集紀錄未刪除。$/,m=>`Cleared all targets from Trip “${m[1]}”; field records were preserved.`],
    [/^(.+) 筆採集紀錄會保留，但會解除與這些行程點的連結。$/,m=>`${m[1]} field records will be preserved but unlinked from these Trip Points.`]
  ];
  for(const [rx,fn] of patterns){
    const mm=s.match(rx);
    if(mm)return fn(mm);
  }

  const exactStatus={
    "請輸入有效電子郵件。":"Please enter a valid email address.",
    "正在開啟…":"Opening…",
    "無法開啟本機資料：":"Unable to open local data: ",
    "已顯示全部月份。":"Showing all months.",
    "已取消月份篩選。":"Month filter cleared.",
    "至少需要 2 個採集目標才能最佳化路線。":"At least 2 targets are required to optimize the route.",
    "行程已依北 → 南重新排序。":"Trip reordered North → South.",
    "已調整路線順序。":"Route order updated.",
    "目前沒有行程。":"No active Trip.",
    "目前行程沒有採集目標。":"The current Trip has no targets.",
    "已從行程移除點位。":"Point removed from Trip.",
    "行程資訊已儲存。":"Trip details saved.",
    "已切換目前行程。":"Active Trip changed.",
    "行程名稱不能留空。":"Trip name cannot be empty.",
    "請先選擇一個行程採集點。":"Select a Trip Point first.",
    "此裝置不支援 GPS。":"GPS is not supported on this device.",
    "此裝置不支援 GPS Track。":"GPS Track is not supported on this device.",
    "正在記錄…":"Recording…",
    "採集紀錄已儲存。":"Field record saved.",
    "編號設定已儲存。":"Numbering settings saved.",
    "Backup 還原完成。":"Backup restored.",
    "請輸入點位名稱。":"Enter a point name.",
    "請提供有效經緯度。":"Enter valid latitude and longitude.",
    "無法辨識座標，請使用「緯度, 經度」。":"Could not parse coordinates. Use “latitude, longitude”.",
    "地圖選點：點地圖或拖曳 marker，完成後按「完成」。":"Map selection: tap the map or drag the marker, then press Done.",
    "這個行程的所有採集目標都已完成／標記無法到達。":"All targets in this Trip are completed or marked inaccessible.",
    "目前點之後沒有其他未完成目標。":"There are no unfinished targets after the current point.",
    "Local Profile 已開啟；地圖插件載入失敗，請重新整理或檢查網路。":"Local Profile opened, but the map failed to load. Refresh or check your connection.",
    "舊版資料已匯入目前 Local Profile。":"Legacy data imported into the current Local Profile."
  };
  if(exactStatus[s])return exactStatus[s];

  return s;
}

export function translateText(text){
  return currentLanguage==="en"?dynamicEnglish(text):String(text??"");
}

export function getLanguage(){
  return currentLanguage;
}

export function languageLocale(){
  return currentLanguage==="en"?"en":"zh-TW";
}

function shouldIgnore(node){
  const el=node.nodeType===Node.ELEMENT_NODE?node:node.parentElement;
  return Boolean(el?.closest?.("[data-i18n-ignore]"));
}

function translateTextNode(node){
  if(shouldIgnore(node))return;

  // Keep the first source-language text as the canonical value for this node.
  // Critical: do not write nodeValue unless the target text is actually
  // different. Otherwise MutationObserver observes our own write and can
  // enter a self-triggering loop, which was especially severe on iOS Safari.
  if(!originalText.has(node))originalText.set(node,node.nodeValue);

  const original=originalText.get(node);
  let target=original;

  if(currentLanguage==="en"){
    const trimmed=original.trim();
    if(trimmed){
      const translated=dynamicEnglish(trimmed);
      if(translated!==trimmed){
        target=preserveWhitespace(original,translated);
      }
    }
  }

  if(node.nodeValue!==target){
    node.nodeValue=target;
  }
}

function translateAttributes(el){
  if(shouldIgnore(el))return;

  if(!originalAttrs.has(el)){
    originalAttrs.set(el,{
      placeholder:el.getAttribute?.("placeholder"),
      title:el.getAttribute?.("title"),
      ariaLabel:el.getAttribute?.("aria-label")
    });
  }

  const orig=originalAttrs.get(el)||{};
  const mapping=[
    ["placeholder",orig.placeholder,PLACEHOLDER_MAP],
    ["title",orig.title,ZH_TO_EN],
    ["aria-label",orig.ariaLabel,ARIA_MAP]
  ];

  for(const [attr,value,map] of mapping){
    if(value==null)continue;
    const target=currentLanguage==="en"?(map[value]||dynamicEnglish(value)):value;

    // Same principle as text nodes: avoid redundant attribute writes because
    // they create needless DOM work during a full language switch.
    if(el.getAttribute(attr)!==target){
      el.setAttribute(attr,target);
    }
  }
}

function translateElementTree(root){
  if(!root)return;
  if(root.nodeType===Node.TEXT_NODE){
    translateTextNode(root);
    return;
  }
  if(root.nodeType!==Node.ELEMENT_NODE && root.nodeType!==Node.DOCUMENT_NODE && root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;

  if(root.nodeType===Node.ELEMENT_NODE)translateAttributes(root);

  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    if(node.nodeType===Node.TEXT_NODE)translateTextNode(node);
    else translateAttributes(node);
  }
}

export function applyTranslations(root=document){
  if(translating)return;
  translating=true;
  try{translateElementTree(root)}
  finally{translating=false}
}

export function setLanguage(lang,{persist=true}={}){
  currentLanguage=lang==="en"?"en":"zh-Hant";
  document.documentElement.lang=currentLanguage==="en"?"en":"zh-Hant";
  if(persist){
    try{localStorage.setItem("fieldscout_ui_language",currentLanguage)}catch(_){}
  }
  applyTranslations(document);
  document.dispatchEvent(new CustomEvent("fieldscout-languagechange",{detail:{language:currentLanguage}}));
}

export function initI18n(lang){
  currentLanguage=lang==="en"?"en":"zh-Hant";
  document.documentElement.lang=currentLanguage==="en"?"en":"zh-Hant";

  applyTranslations(document);

  if(observer)observer.disconnect();

  observer=new MutationObserver(mutations=>{
    if(translating)return;

    translating=true;
    try{
      for(const m of mutations){
        if(m.type==="characterData"){
          translateTextNode(m.target);
          continue;
        }

        if(m.type==="childList" && m.addedNodes.length){
          for(const node of m.addedNodes){
            translateElementTree(node);
          }
        }
      }
    }finally{
      translating=false;
    }
  });

  observer.observe(document.body,{
    subtree:true,
    childList:true,
    characterData:true
  });
}

export function t(key,fallback=""){
  const zh={
    "lang.zh":"繁體中文",
    "lang.en":"English",
    "status.unvisited":"未訪查",
    "status.arrived":"已到達",
    "status.surveyed":"完成調查",
    "status.inaccessible":"無法到達",
    "status.revisit":"再訪",
    "trip.planned":"規劃中",
    "trip.active":"進行中",
    "trip.completed":"已完成"
  };
  const text=zh[key]??fallback??key;
  return currentLanguage==="en"?dynamicEnglish(text):text;
}
