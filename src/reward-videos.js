
const databaseName='study-atlas-reward-videos';
export const maxVideoBytes=50*1024*1024;
let opening;
function database(){
 if(!opening)opening=new Promise((resolve,reject)=>{
  const request=indexedDB.open(databaseName,1);
  request.onupgradeneeded=()=>{
   request.result.createObjectStore('info',{keyPath:'id'});
   request.result.createObjectStore('media');
  };
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{
   const db=request.result;
   db.onversionchange=()=>{db.close();opening=null;};
   resolve(db);
  };
 }).catch(error=>{opening=null;throw error;});
 return opening;
}
async function transact(stores,mode,action){
 const db=await database();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(stores,mode);
  tx.onabort=()=>reject(tx.error??new Error('Storage transaction aborted.'));
  tx.oncomplete=()=>resolve(request?.result);
  const request=action(tx);
 });
}
export const listRewardVideos=()=>transact(['info'],'readonly',tx=>tx.objectStore('info').getAll());
export const getRewardVideo=id=>transact(['media'],'readonly',tx=>tx.objectStore('media').get(id));
export const removeRewardVideo=id=>transact(['info','media'],'readwrite',tx=>{
 tx.objectStore('info').delete(id);
 tx.objectStore('media').delete(id);
});
function validateVideo(blob){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(blob),video=document.createElement('video');
  const finish=error=>{
   clearTimeout(timeout);
   video.onloadedmetadata=null;
   video.onerror=null;
   video.removeAttribute('src');
   video.load();
   URL.revokeObjectURL(url);
   if(error)reject(new Error(error));else resolve();
  };
  const timeout=setTimeout(()=>finish('This video could not be read.'),8000);
  video.preload='metadata';
  video.onloadedmetadata=()=>finish(video.videoWidth>0&&video.duration>0?null:'This file contains no playable video.');
  video.onerror=()=>finish('This browser could not play the video.');
  video.src=url;
 });
}
export async function saveRewardVideo(file){
 const extension=/\.(mp4|webm)$/i.exec(file.name)?.[1].toLowerCase();
 if(!extension||!file.size)throw new Error('Choose a nonempty MP4 or WebM file.');
 if(file.size>maxVideoBytes)throw new Error('The video exceeds the 50 MB limit.');
 const blob=file.slice(0,file.size,'video/'+extension);
 await validateVideo(blob);
 const id=crypto.randomUUID(), info={id,name:file.name,size:file.size,added:Date.now()};
 await transact(['info','media'],'readwrite',tx=>{
  tx.objectStore('info').add(info);
  tx.objectStore('media').add(blob,id);
 });
 return info;
}
