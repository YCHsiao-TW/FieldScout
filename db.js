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
  return (await all(store)).filter(x=>x.profileId===profileId);
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
