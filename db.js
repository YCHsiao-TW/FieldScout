const DB_NAME="FieldScoutDB";
const DB_VERSION=1;
const STORES=["profiles","settings","trips","records","photos","cache"];

function openDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      for(const s of STORES){
        if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:"id"});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

async function tx(store,mode,fn){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const t=db.transaction(store,mode);
    const s=t.objectStore(store);
    let result;
    try{result=fn(s)}catch(e){reject(e);return}
    t.oncomplete=()=>resolve(result);
    t.onerror=()=>reject(t.error);
  });
}

export async function put(store,obj){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const t=db.transaction(store,"readwrite");
    t.objectStore(store).put(obj);
    t.oncomplete=()=>resolve(obj);
    t.onerror=()=>reject(t.error);
  });
}
export async function get(store,id){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const r=db.transaction(store,"readonly").objectStore(store).get(id);
    r.onsuccess=()=>resolve(r.result||null);
    r.onerror=()=>reject(r.error);
  });
}
export async function del(store,id){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const t=db.transaction(store,"readwrite");
    t.objectStore(store).delete(id);
    t.oncomplete=()=>resolve();
    t.onerror=()=>reject(t.error);
  });
}
export async function all(store){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const r=db.transaction(store,"readonly").objectStore(store).getAll();
    r.onsuccess=()=>resolve(r.result||[]);
    r.onerror=()=>reject(r.error);
  });
}
export async function byProfile(store,profileId){
  return (await all(store)).filter(x=>x.profileId===profileId);
}
export async function deleteProfileData(profileId){
  for(const store of ["settings","trips","records","photos","cache"]){
    const items=await all(store);
    for(const x of items.filter(v=>v.profileId===profileId)) await del(store,x.id);
  }
  await del("profiles",profileId);
}
