import React,{useEffect,useRef,useState} from 'react';
import {BookOpen,Clock3,FileText,X} from 'lucide-react';
import {linkTo,navigate,routeEvent} from './routing.mjs';

const storageKey='study-atlas-reading-trail-v1';
const event='atlas-reading-trail';
const limit=16;
let fallback;

function readTrail(){
 if(fallback)return fallback;
 try{return JSON.parse(localStorage.getItem(storageKey))??[];}catch{return [];}
}
function writeTrail(items){
 try{localStorage.setItem(storageKey,JSON.stringify(items));fallback=undefined;}
 catch{fallback=items;}
}
const matches=(item,entry)=>item.subject===entry.subject&&item.kind===entry.kind&&item.id===entry.id;
const elementFor=entry=>document.getElementById(entry.kind+'-'+entry.id);
const isReading=node=>{
 if(!node?.open)return false;
 const {top,bottom}=node.getBoundingClientRect();
 return top<innerHeight*.55&&bottom>110;
};

export function useReadingTrail(subject,view){
 const active=useRef(null);
 const currentView=useRef(view);
 currentView.current=view;
 const timer=useRef(0);
 const save=()=>{
  const entry=active.current;
  const element=entry&&elementFor(entry);
  if(!element?.open)return;
  const rect=element.getBoundingClientRect();
  if(rect.bottom<100||rect.top>window.innerHeight)return;
  const offset=Math.round(-rect.top);
  const items=readTrail();
  const previous=items.find(item=>matches(item,entry));
  if(previous&&previous.offset!==offset)writeTrail(items.map(item=>matches(item,entry)?{...item,offset}:item));
 };
 useEffect(()=>{
  const scroll=()=>{
   clearTimeout(timer.current);
   timer.current=setTimeout(()=>{
    const kind={questions:'question',notes:'note'}[currentView.current];
    if(kind&&(!active.current||!isReading(elementFor(active.current)))){
     const node=[...document.querySelectorAll('details[data-trail-title][open]')].find(isReading);
     if(node)visit(kind,node.id.slice(kind.length+1),node.dataset.trailTitle);
    }
    save();
   },130);
  };
  const flush=()=>{clearTimeout(timer.current);save();};
  window.addEventListener('scroll',scroll,{passive:true});
  window.addEventListener('pagehide',flush);
  for(const name of [routeEvent,'hashchange','popstate'])window.addEventListener(name,flush);
  document.addEventListener('visibilitychange',flush);
  return ()=>{
   flush();
   window.removeEventListener('scroll',scroll);
   window.removeEventListener('pagehide',flush);
   for(const name of [routeEvent,'hashchange','popstate'])window.removeEventListener(name,flush);
   document.removeEventListener('visibilitychange',flush);
  };
 },[]);
 function visit(kind,id,title,{restore=false,jump=false}={}){
  const entry={subject,kind,id,title};
  const element=elementFor(entry);
  if(!element)return;
  if(active.current&&!matches(active.current,entry))save();
  const items=readTrail();
  const previous=items.find(item=>matches(item,entry));
  active.current=entry;
  if(jump){
   element.scrollIntoView({block:'start',behavior:'instant'});
   if(restore&&previous&&Number.isFinite(previous.offset)){
    const rect=element.getBoundingClientRect();
    const offset=Math.min(previous.offset,Math.max(0,rect.height-100));
    window.scrollTo({top:window.scrollY+rect.top+offset,behavior:'instant'});
   }
   element.querySelector('summary')?.focus({preventScroll:true});
  }
  writeTrail([{...entry,offset:Math.round(-element.getBoundingClientRect().top)},...items.filter(item=>!matches(item,entry))].slice(0,limit));
  window.dispatchEvent(new Event(event));
 }
 function close(kind,id){
  if(active.current?.kind===kind&&active.current.id===id){clearTimeout(timer.current);active.current=null;}
 }
 return {visit,close,save};
}

export function RecentTrail({close}){
 const [items,setItems]=useState(readTrail);
 const dialog=useRef(null);
 useEffect(()=>{
  const node=dialog.current;
  const update=()=>setItems(readTrail());
  window.addEventListener(event,update);
  node.showModal();
  return ()=>{window.removeEventListener(event,update);if(node.open)node.close();};
 },[]);
 function open(e,entry){
  if(e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||e.button!==0)return;
  e.preventDefault();
  close();
  const question=entry.kind==='question';
  navigate(entry.subject,question?'questions':'notes',question?{question:entry.id,resume:true}:{note:entry.id,resume:true});
 }
 return <dialog className="atlas-tool-dialog recent-trail-dialog" ref={dialog} aria-labelledby="recent-title" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
  <div className="atlas-tool-shell">
   <header className="atlas-tool-header"><div><p><Clock3 size={15}/> STUDY HISTORY</p><h2 id="recent-title">Recently opened</h2></div><button type="button" className="atlas-tool-icon" aria-label="Close recently opened" onClick={close}><X size={20}/></button></header>
   <div className="recent-trail-body">{items.length?<ol>{items.map(entry=>{
    const question=entry.kind==='question',Icon=question?BookOpen:FileText;
    const options=question?{question:entry.id,resume:true}:{note:entry.id,resume:true};
    return <li key={entry.subject+':'+entry.kind+':'+entry.id}><a href={linkTo(entry.subject,question?'questions':'notes',options)} onClick={e=>open(e,entry)}><Icon size={18}/><span><small>{entry.subject.toUpperCase()} · {question?'Question':'Notes'}</small><strong>{entry.title}</strong></span></a></li>;
   })}</ol>:<p>Open a question or a note chapter to start your trail.</p>}</div>
   {items.length>0&&<footer><button type="button" className="atlas-tool-button" onClick={()=>{writeTrail([]);setItems([]);}}>Clear history</button></footer>}
  </div>
 </dialog>;
}
