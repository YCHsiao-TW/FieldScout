export const BACKUP_MAX_BYTES=100*1024*1024;
export const BACKUP_PHOTO_MAX_BYTES=15*1024*1024;
export const BACKUP_IMAGE_TYPES=new Set([
  "image/jpeg","image/png","image/webp","image/gif","image/heic","image/heif"
]);

const BACKUP_VERSIONS=new Set(["0.17.0","0.17.1","0.17.2","1.0.0","1.0.1","1.1.0","1.1.1","1.1.2"]);

function isPlainObject(value){
  return value!==null&&typeof value==="object"&&!Array.isArray(value);
}

function validateBackupItems(doc,key){
  if(doc[key]===undefined)return [];
  if(!Array.isArray(doc[key]))throw new Error(`Backup ${key} 格式無效`);

  const ids=new Set();
  for(const item of doc[key]){
    if(!isPlainObject(item)||item.id===null||item.id===undefined||String(item.id).trim()===""){
      throw new Error(`Backup ${key} 含有缺少 id 的資料`);
    }
    const id=String(item.id);
    if(ids.has(id))throw new Error(`Backup ${key} 含有重複 id：${id}`);
    ids.add(id);
  }
  return doc[key];
}

export function validateBackupDocument(doc){
  if(!isPlainObject(doc))throw new Error("Backup 根目錄格式無效");
  if(!BACKUP_VERSIONS.has(String(doc.version||""))){
    throw new Error(`不支援的 Backup 版本：${doc.version||"未標示"}`);
  }
  if(!isPlainObject(doc.profile)||typeof doc.profile.id!=="string"||!doc.profile.id.trim()||
    typeof doc.profile.email!=="string"||!doc.profile.email.trim()){
    throw new Error("Backup 缺少有效的 profile");
  }
  if(doc.settings!==undefined&&doc.settings!==null&&!isPlainObject(doc.settings)){
    throw new Error("Backup settings 格式無效");
  }

  const data={
    trips:validateBackupItems(doc,"trips"),
    records:validateBackupItems(doc,"records"),
    photos:validateBackupItems(doc,"photos"),
    cache:validateBackupItems(doc,"cache")
  };

  for(const photo of data.photos){
    const type=typeof photo.dataUrl==="string"
      ? photo.dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,/i)?.[1]?.toLowerCase()
      : null;
    if(!type||!BACKUP_IMAGE_TYPES.has(type)){
      throw new Error(`Backup 照片格式無效：${photo.id}`);
    }
    if(photo.dataUrl.length>BACKUP_PHOTO_MAX_BYTES*1.4){
      throw new Error(`Backup 照片過大：${photo.id}`);
    }
  }
  for(const cacheItem of data.cache){
    if(cacheItem.records!==undefined&&!Array.isArray(cacheItem.records)){
      throw new Error(`Backup cache records 格式無效：${cacheItem.id}`);
    }
  }
  return data;
}

export function prepareBackupRestore(doc,profileId,newId=()=>crypto.randomUUID()){
  const data=validateBackupDocument(doc);
  const crossProfile=doc.profile.id!==profileId;
  const ids=new Map();
  const mapId=(kind,id)=>{
    if(id===null||id===undefined||id==="")return null;
    if(!crossProfile)return id;
    const key=JSON.stringify([kind,String(id)]);
    if(!ids.has(key))ids.set(key,newId());
    return ids.get(key);
  };
  const settings=doc.settings?[{
    ...doc.settings,id:`${profileId}:settings`,profileId,
    legacyMigrationChecked:true,
    customPoints:(doc.settings.customPoints||[]).map(p=>({...p,id:mapId("custom",p.id)}))
  }]:[];
  const trips=data.trips.map(trip=>({
    ...trip,id:mapId("trip",trip.id),profileId,
    points:(trip.points||[]).map(p=>({
      ...p,id:mapId(`point:${trip.id}`,p.id),
      ...(p.customPointId?{customPointId:mapId("custom",p.customPointId)}:{})
    }))
  }));
  const records=data.records.map(r=>({
    ...r,id:mapId("record",r.id),profileId,
    tripId:mapId("trip",r.tripId),tripPointId:mapId(`point:${r.tripId}`,r.tripPointId),
    photoIds:(r.photoIds||[]).map(id=>mapId("photo",id)),
    ...(r.batchSiteId?{batchSiteId:mapId("batch",r.batchSiteId)}:{})
  }));
  const photos=data.photos.map(p=>({
    ...p,id:mapId("photo",p.id),profileId,recordId:mapId("record",p.recordId)
  }));
  // Country-specific search snapshots must never leak into a different workspace.
  const cache=crossProfile?[]:data.cache.filter(c=>c.kind!=="offline-map").map(c=>({
    ...c,id:`${profileId}:occ:${String(c.taxon?.scientificName||c.query||c.id).toLowerCase()}`,profileId
  }));
  return {settings,trips,records,photos,cache};
}

const PART_FORMAT="FieldScoutBackupPart";
const PART_BYTES=16*1024*1024;
function toBase64(bytes){
  let binary="";
  for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return btoa(binary);
}
async function digest(bytes){
  const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
  return Array.from(hash,b=>b.toString(16).padStart(2,"0")).join("");
}

export async function createBackupDownloads(doc,{maxBytes=BACKUP_MAX_BYTES,partBytes=PART_BYTES}={}){
  validateBackupDocument(doc);
  const blob=new Blob([JSON.stringify(doc)],{type:"application/json"});
  if(blob.size<=maxBytes)return [{name:"fieldscout_backup.json",blob}];
  if(!Number.isSafeInteger(partBytes)||partBytes<1)throw new Error("Backup 分檔大小無效");
  const backupId=crypto.randomUUID(),count=Math.ceil(blob.size/partBytes),files=[];
  for(let index=0;index<count;index++){
    const bytes=new Uint8Array(await blob.slice(index*partBytes,(index+1)*partBytes).arrayBuffer());
    const part={format:PART_FORMAT,formatVersion:1,backupId,index,count,totalBytes:blob.size,
      byteLength:bytes.length,sha256:await digest(bytes),data:toBase64(bytes)};
    const partBlob=new Blob([JSON.stringify(part)],{type:"application/json"});
    if(partBlob.size>maxBytes)throw new Error("Backup 分檔超過大小上限");
    files.push({name:`fieldscout_backup_${backupId}_part_${index+1}_of_${count}.json`,blob:partBlob});
  }
  return files;
}

export async function readBackupFiles(files){
  if(!files.length)throw new Error("請選擇 Backup 檔案");
  const parts=[];
  for(const file of files){
    if(file.size>BACKUP_MAX_BYTES)throw new Error("單一 Backup 檔案超過 100 MB 上限");
    parts.push(JSON.parse(await file.text()));
  }
  if(parts.length===1&&parts[0]?.format!==PART_FORMAT){
    validateBackupDocument(parts[0]);return parts[0];
  }
  const first=parts[0],seen=new Set();
  for(const p of parts){
    if(p?.format!==PART_FORMAT||p.formatVersion!==1||typeof p.backupId!=="string"||!p.backupId||
      !Number.isSafeInteger(p.index)||!Number.isSafeInteger(p.count)||p.count!==parts.length||
      p.index<0||p.index>=p.count||seen.has(p.index)||p.backupId!==first.backupId||
      p.totalBytes!==first.totalBytes||!Number.isSafeInteger(p.totalBytes)||p.totalBytes<1||
      !Number.isSafeInteger(p.byteLength)||p.byteLength<1||typeof p.data!=="string"||
      !p.data.length||p.data.length%4!==0||/[^A-Za-z0-9+/=]/.test(p.data)){
      throw new Error("Backup 分檔不完整、重複或混入其他備份；請一次選取同一組全部檔案");
    }
    seen.add(p.index);
  }
  const buffers=[];
  for(const part of parts.sort((a,b)=>a.index-b.index)){
    const binary=atob(part.data),bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    delete part.data;
    if(bytes.length!==part.byteLength||await digest(bytes)!==part.sha256)throw new Error("Backup 分檔內容損毀，校驗失敗");
    buffers.push(bytes);
  }
  const blob=new Blob(buffers);
  if(blob.size!==first.totalBytes)throw new Error("Backup 分檔總大小不符");
  const doc=JSON.parse(await blob.text());
  validateBackupDocument(doc);
  return doc;
}
