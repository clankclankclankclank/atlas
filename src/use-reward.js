import {useRef,useState} from 'react';
import {getRewardVideo,listRewardVideos} from './reward-videos.js';

const pick=items=>items[Math.floor(Math.random()*items.length)];

export function useReward(clips){
 const [reward,setReward]=useState(null);
 const last=useRef(null), request=useRef(0);
 async function play(id){
  const version=++request.current;
  let item;
  try{
   const local=id?[{id}]:(await listRewardVideos()).filter(video=>video.id!==last.current);
   const builtin=clips.filter(file=>file!==last.current);
   if(local.length&&(id||!builtin.length||Math.random()<.5)){
    const video=pick(local),blob=await getRewardVideo(video.id);
    if(blob)item={id:video.id,blob};
   }
  }catch{}
  if(!item&&!id){
   const file=pick(clips.filter(file=>file!==last.current))??clips[0];
   if(file)item={id:file,file};
  }
  if(version!==request.current||!item)return false;
  last.current=item.id;
  setReward({...item,version});
  return true;
 }
 return {reward,play,close:()=>{request.current++;setReward(null);}};
}
