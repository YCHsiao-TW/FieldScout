export const BACKUP_MAX_BYTES=100*1024*1024;
export const BACKUP_PHOTO_MAX_BYTES=15*1024*1024;
export const BACKUP_IMAGE_TYPES=new Set([
  "image/jpeg","image/png","image/webp","image/gif","image/heic","image/heif"
]);

const BACKUP_VERSIONS=new Set(["0.17.0","0.17.1","0.17.2","1.0.0","1.0.1","1.1.0","1.1.1"]);

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
  if(!isPlainObject(doc.profile)||typeof doc.profile.email!=="string"||!doc.profile.email.trim()){
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
