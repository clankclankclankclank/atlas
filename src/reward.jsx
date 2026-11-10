
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';

const duration = 5000;
const colors = ['#fce5a2','#92ddff','#fbadff','#a3ffdc','#ffeefe','#fff'];
function makeParticles() {
  return Array.from({length:54},(_,i)=>{
    const angle = (i/54)*2*Math.PI+(Math.random()-.5)*.21;
    const distance = 18+Math.random()*42;
    return {
      '--dx': Math.cos(angle)*distance+'vmin',
      '--dy': Math.sin(angle)*distance+'vmin',
      '--color': colors[i%colors.length],
      '--delay': Math.random()*.45+'s',
      '--time': 1.15+Math.random()*1.45+'s',
      '--size': 4+Math.random()*9+'px',
      '--rotation': Math.round(Math.random()*640-320)+'deg'
    };
  });
}

export function Reward({item,onClose}) {
 const [src,setSrc]=useState(null);
 useEffect(()=>{
  if(!item.blob)return;
  const url=URL.createObjectURL(item.blob);
  setSrc(url);
  return ()=>URL.revokeObjectURL(url);
 },[item]);
 const media=item.blob?src:'media/'+encodeURIComponent(item.file);
 return media?<RewardPlayback src={media} image={!item.blob&&/\.gif$/i.test(item.file)} onClose={onClose}/>:null;
}

function RewardPlayback({src,image,onClose}) {
  const dialog=useRef(null);
  const video=useRef(null);
  const timer=useRef(null);
  const started=useRef(false);
  const close=useRef(onClose);
  close.current=onClose;
  const [particles]=useState(makeParticles);
  useLayoutEffect(()=>{
    const node=dialog.current;
    const clip=video.current;
    const trigger=document.activeElement;
    node.showModal();
    // Release the modal if the local asset never starts loading.
    if(!started.current)timer.current=setTimeout(()=>close.current(),duration);
    if(clip){
      clip.muted=true;
      clip.play().catch(()=>{if(node.open)close.current();});
    }
    return ()=>{
      clearTimeout(timer.current);
      clip?.pause();
      if(node.open)node.close();
      if(trigger instanceof HTMLElement&&trigger.isConnected)trigger.focus({preventScroll:true});
    };
  },[]);
  function start() {
    if(started.current)return;
    started.current=true;
    clearTimeout(timer.current);
    timer.current=setTimeout(()=>close.current(),duration);
  }
  return <dialog ref={dialog} className="reward-dialog" aria-label="Question mastered celebration" onCancel={e=>{e.preventDefault();close.current();}}>
    {image
      ? <img src={src} alt="" onLoad={start} onError={()=>close.current()}/>
      : <video ref={video} src={src} autoPlay loop muted playsInline preload="auto" aria-hidden="true" onPlaying={start} onError={()=>close.current()}/>}
    <div className="reward-particles" aria-hidden="true">{particles.map((style,i)=><i key={i} className={i%3===0?'star':''} style={style}/>)}</div>
  </dialog>;
}
