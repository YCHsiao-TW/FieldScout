const DB_NAME="FieldScoutDB";
const BASE_STORES=["profiles","settings","trips","records","photos","cache"];

function createBaseStores(db){
  for(const s of BASE_STORES){
    if(!db.objectStoreNames.contains(s)){
      db.createObjectStore(s,{keyPath:"id"});
    }
  }
}

function openCurrentDb(){
  return new Promise((resolve,reject)=>{
    // No forced version number:
    // - existing v1 opens as v1
    // - existing v2 opens as v2
    // This avoids Safari/PWA upgrade blocking just to enter the app.
    const req=indexedDB.open(DB_NAME);

    req.onupgradeneeded=()=>{
      createBaseStores(req.result);
    };

    req.onsuccess=()=>{
      const db=req.result;
      db.onversionchange=()=>db.close();
      resolve(db);
    };

    req.onerror=()=>reject(req.error||new Error("IndexedDB open failed"));

    req.onblocked=()=>{
      reject(new Error("FieldScout 本機資料庫被另一個舊分頁／PWA 鎖定。請關閉其他 FieldScout 視窗後再試。"));
    };
  });
}

function hasStore(db,store){
  return db.objectStoreNames.contains(store);
}

export async function storeExists(store){
  const db=await openCurrentDb();
  try{return hasStore(db,store)}
  finally{db.close()}
}

export async function put(store,obj){
  // Trip edits must not erase GPS samples committed by an earlier queued write.
  if(store==="trips"){
    await putManyAtomic({trips:[obj]},{profileId:obj.profileId,preserveTrack:true});
    return obj;
  }
  const db=await openCurrentDb();
  try{
    if(!hasStore(db,store))throw new Error(`IndexedDB store 不存在：${store}`);
    return await new Promise((resolve,reject)=>{
      const t=db.transaction(store,"readwrite");
      t.objectStore(store).put(obj);
      t.oncomplete=()=>resolve(obj);
      t.onerror=()=>reject(t.error||new Error(`寫入 ${store} 失敗`));
      t.onabort=()=>reject(t.error||new Error(`寫入 ${store} 已中止`));
    });
  }finally{db.close()}
}

export function mergeTrackPoints(existing=[],incoming=[]){
  const seen=new Set();
  return [...existing,...incoming].filter(p=>{
    const key=p.id||JSON.stringify([p.time,p.lat,p.lon,p.accuracy,p.segmentId||""]);
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
}

export async function putManyAtomic(entriesByStore,{profileId=null,preserveTrack=false}={}){
  const entries=Object.entries(entriesByStore||{})
    .map(([store,items])=>[store,Array.isArray(items)?items:[]])
    .filter(([,items])=>items.length>0);
  if(!entries.length)return;

  for(const [store,items] of entries){
    for(const item of items){
      if(!item||typeof item!=="object"||item.id===null||item.id===undefined||String(item.id).trim()===""){
        throw new Error(`無法寫入 ${store}：資料缺少 id`);
      }
      if(profileId!==null&&item.profileId!==profileId)throw new Error("資料不屬於目前工作空間");
    }
  }

  const db=await openCurrentDb();
  try{
    const stores=entries.map(([store])=>store);
    for(const store of stores){
      if(!hasStore(db,store))throw new Error(`IndexedDB store 不存在：${store}`);
    }

    await new Promise((resolve,reject)=>{
      const t=db.transaction(stores,"readwrite");
      let failure=null;
      const abort=error=>{failure=error;try{t.abort()}catch(_){} };
      t.oncomplete=()=>resolve();
      t.onerror=()=>reject(failure||t.error||new Error("批次寫入失敗"));
      t.onabort=()=>reject(failure||t.error||new Error("批次寫入已中止"));
      try{
        for(const [store,items] of entries){
          const objectStore=t.objectStore(store);
          for(const item of items){
            const request=objectStore.get(item.id);
            request.onsuccess=()=>{
              try{
                const previous=request.result;
                if(profileId!==null&&previous&&previous.profileId!==profileId){
                  throw new Error(`資料 ID 已屬於其他工作空間：${item.id}`);
                }
                const value=preserveTrack&&store==="trips"&&previous
                  ? {...item,track:mergeTrackPoints(previous.track||[],item.track||[])}
                  : item;
                objectStore.put(value);
              }catch(error){abort(error)}
            };
          }
        }
      }catch(error){abort(error)}
    });
  }finally{db.close()}
}

// Read-modify-write in one transaction, bound to the trip where recording began.
export async function appendTripTrack(profileId,tripId,points){
  const db=await openCurrentDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction("trips","readwrite"),store=tx.objectStore("trips");
      let failure=null;
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(failure||tx.error||new Error("GPS 儲存失敗"));
      tx.onabort=()=>reject(failure||tx.error||new Error("GPS 儲存已中止"));
      const request=store.get(tripId);
      request.onsuccess=()=>{
        try{
          const trip=request.result;
          if(!trip||trip.profileId!==profileId)throw new Error("GPS 行程不存在或屬於其他工作空間");
          store.put({...trip,track:mergeTrackPoints(trip.track||[],points),updatedAt:new Date().toISOString()});
        }catch(error){failure=error;tx.abort()}
      };
    });
  }finally{db.close()}
}

export async function get(store,id){
  const db=await openCurrentDb();
  try{
    if(!hasStore(db,store))return null;
    return await new Promise((resolve,reject)=>{
      const r=db.transaction(store,"readonly").objectStore(store).get(id);
      r.onsuccess=()=>resolve(r.result||null);
      r.onerror=()=>reject(r.error||new Error(`讀取 ${store} 失敗`));
    });
  }finally{db.close()}
}

export async function del(store,id){
  const db=await openCurrentDb();
  try{
    if(!hasStore(db,store))return;
    await new Promise((resolve,reject)=>{
      const t=db.transaction(store,"readwrite");
      t.objectStore(store).delete(id);
      t.oncomplete=()=>resolve();
      t.onerror=()=>reject(t.error||new Error(`刪除 ${store} 失敗`));
      t.onabort=()=>reject(t.error||new Error(`刪除 ${store} 已中止`));
    });
  }finally{db.close()}
}

export async function all(store){
  const db=await openCurrentDb();
  try{
    if(!hasStore(db,store))return [];
    return await new Promise((resolve,reject)=>{
      const r=db.transaction(store,"readonly").objectStore(store).getAll();
      r.onsuccess=()=>resolve(r.result||[]);
      r.onerror=()=>reject(r.error||new Error(`讀取 ${store} 失敗`));
    });
  }finally{db.close()}
}

export async function byProfile(store,profileId){
  const db=await openCurrentDb();
  try{
    if(!hasStore(db,store))return [];
    return await new Promise((resolve,reject)=>{
      const items=[],request=db.transaction(store,"readonly").objectStore(store).openCursor();
      request.onsuccess=()=>{
        const cursor=request.result;
        if(!cursor){resolve(items);return}
        if(cursor.value.profileId===profileId)items.push(cursor.value);
        cursor.continue();
      };
      request.onerror=()=>reject(request.error||new Error(`讀取 ${store} 失敗`));
    });
  }finally{db.close()}
}

export async function deleteProfileData(profileId){
  for(const store of ["settings","trips","records","photos","cache"]){
    const items=await all(store);
    for(const x of items.filter(v=>v.profileId===profileId)){
      await del(store,x.id);
    }
  }

  // If a user already upgraded to the old v2 schema, clean its legacy
  // offlineMaps store too, but do not require that store to exist.
  if(await storeExists("offlineMaps")){
    const items=await all("offlineMaps");
    for(const x of items.filter(v=>v.profileId===profileId)){
      await del("offlineMaps",x.id);
    }
  }

  await del("profiles",profileId);
}
