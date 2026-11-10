import React,{useEffect,useLayoutEffect,useRef} from 'react';

// React Bits Spotlight Card pattern. Keep pointer coordinates out of React state.
export function trackSpotlight(event){
 if(event.pointerType!=='mouse')return;
 const card=event.currentTarget,box=card.getBoundingClientRect();
 card.style.setProperty('--spot-x',event.clientX-box.left+'px');
 card.style.setProperty('--spot-y',event.clientY-box.top+'px');
}

// Motion Primitives Text Effect pattern, with the final text always available to assistive tech.
export function RevealLine({children,delay=0,accent=false}){
 const Tag=accent?'em':'span';
 return <span className="visual-reveal"><Tag style={{'--reveal-delay':delay+'ms'}}>{children}</Tag></span>;
}

// Magic UI Animated Beam pattern for diagrams with known SVG coordinates.
export function SignalPath({path,active=false,delay=0}){
 return <>
  <path className="visual-signal-track" d={path}/>
  {active&&<path className="visual-signal-beam" pathLength="100" d={path} style={{'--beam-delay':delay+'ms'}}/>}
 </>;
}


const allowEffects=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&document.documentElement.dataset.layout!=='minimal';
const formatNumber=new Intl.NumberFormat();

function whenVisible(node,activate){
 if(!('IntersectionObserver' in window)){activate();return ()=>{};}
 const observer=new IntersectionObserver(([entry])=>{
  if(entry.isIntersecting){observer.disconnect();activate();}
 },{threshold:.12});
 observer.observe(node);
 return ()=>observer.disconnect();
}

// Adapted from React Bits Count Up. The final value remains available to assistive tech.
export function CountStat({value}){
 const ref=useRef(null);
 const label=formatNumber.format(value);
 useLayoutEffect(()=>{
  const node=ref.current;
  node.textContent=label;
  if(!value||!allowEffects())return;
  node.textContent='0';
  let frame=0;
  const stop=whenVisible(node,()=>{
   if(!allowEffects()){node.textContent=label;return;}
   const start=performance.now();
   function tick(now){
    const elapsed=Math.min(1,(now-start)/680);
    if(!allowEffects()||elapsed===1){node.textContent=label;return;}
    node.textContent=formatNumber.format(Math.round(value*(1-(1-elapsed)**3)));
    frame=requestAnimationFrame(tick);
   }
   frame=requestAnimationFrame(tick);
  });
  return ()=>{stop();cancelAnimationFrame(frame);};
 },[value,label]);
 return <b className="atlas-count-stat"><span className="atlas-sr-only">{label}</span><span aria-hidden="true" ref={ref}>{label}</span></b>;
}

// React Bits Animated Content pattern, applied once when a grid enters the viewport.
export function RevealGrid({className,children}){
 const ref=useRef(null);
 useEffect(()=>{
  const node=ref.current;
  if(allowEffects())return whenVisible(node,()=>{if(allowEffects())node.dataset.revealed='true';});
 },[]);
 return <div ref={ref} className={className+' atlas-reveal-grid'}>{children}</div>;
}

// A bounded 2D adaptation of React Bits Cursor Grid. Work stops after the trail fades.
export function CursorGrid(){
 const ref=useRef(null);
 useEffect(()=>{
  const canvas=ref.current,host=canvas.parentElement,context=canvas.getContext('2d');
  if(!context)return;
  let frame=0,width=0,height=0,stamps=[],last=0;
  const cell=15,lifetime=470;
  function resize(){
   const rect=host.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);
   width=rect.width;height=rect.height;
   canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
   context.setTransform(ratio,0,0,ratio,0,0);
  }
  function draw(now){
   frame=0;
   context.clearRect(0,0,width,height);
   if(!allowEffects()){stamps=[];return;}
   stamps=stamps.filter(stamp=>now-stamp.time<lifetime);
   context.fillStyle=getComputedStyle(canvas).color;
   const pixels=new Map();
   for(const stamp of stamps){
    const remaining=1-(now-stamp.time)/lifetime;
    for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++){
     const distance=Math.hypot(x,y);
     const wave=stamp.pulse?Math.max(0,1-Math.abs(distance-(1-remaining)*4)/1.25):Math.max(0,1-distance/3.7);
     const opacity=wave*remaining*.52;
     if(!opacity)continue;
     const column=stamp.x+x,row=stamp.y+y,key=column+','+row;
     if(opacity>(pixels.get(key)?.opacity??0))pixels.set(key,{column,row,opacity});
    }
   }
   for(const {column,row,opacity} of pixels.values()){
    context.globalAlpha=opacity;
    context.fillRect(column*cell+2,row*cell+2,cell-4,cell-4);
   }
   context.globalAlpha=1;
   if(stamps.length)frame=requestAnimationFrame(draw);
  }
  function stamp(event,pulse){
   if(!allowEffects()||(!pulse&&event.pointerType==='touch'))return;
   const now=performance.now();
   if(!pulse&&now-last<28)return;
   last=now;
   const box=canvas.getBoundingClientRect();
   stamps=[...stamps.slice(-9),{x:Math.floor((event.clientX-box.left)/cell),y:Math.floor((event.clientY-box.top)/cell),time:now,pulse}];
   if(!frame)frame=requestAnimationFrame(draw);
  }
  const move=event=>stamp(event,false),press=event=>stamp(event,true);
  const observer=new ResizeObserver(resize);
  observer.observe(host);
  resize();
  host.addEventListener('pointermove',move,{passive:true});
  host.addEventListener('pointerdown',press,{passive:true});
  return ()=>{observer.disconnect();cancelAnimationFrame(frame);host.removeEventListener('pointermove',move);host.removeEventListener('pointerdown',press);};
 },[]);
 return <canvas className="atlas-cursor-grid" aria-hidden="true" ref={ref}/>;
}

// React Bits Pill Nav pattern. The indicator follows the current link through layout changes.
export function SubjectPillNav({active,children}){
 const ref=useRef(null);
 useLayoutEffect(()=>{
  const nav=ref.current;
  const link=nav.querySelector('[aria-current="page"]');
  if(!link){nav.removeAttribute('data-pill');return;}
  const measure=()=>{
   nav.style.setProperty('--pill-x',link.offsetLeft+'px');
   nav.style.setProperty('--pill-width',link.offsetWidth+'px');
   nav.style.setProperty('--pill-y',link.offsetTop+'px');
   nav.style.setProperty('--pill-height',link.offsetHeight+'px');
   nav.dataset.pill='true';
  };
  measure();
  const observer=new ResizeObserver(measure);
  observer.observe(nav);
  observer.observe(link);
  return ()=>observer.disconnect();
 },[active]);
 return <nav ref={ref} className="atlas-subnav" aria-label="Subjects"><span className="atlas-nav-pill" aria-hidden="true"/>{children}</nav>;
}
