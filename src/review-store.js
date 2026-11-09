import {useEffect,useState} from 'react';

const event='atlas-review-change';
const blank=()=>({cards:{},mistakes:{},queues:[]});
const memory=new Map();
const key=subject=>'study-atlas-review-v1:'+subject;
const day=24*60*60*1000;

export const ratings=[
 ['again','Again','Could not recall'],
 ['hard','Hard','Recalled with effort'],
 ['good','Good','Recalled correctly'],
 ['easy','Easy','Immediate recall']
];
export const formulaId=formula=>'formula:'+formula.topic+':'+formula.title;
export const questionId=id=>'question:'+id;
export function interval(card,rating){
 const previous=card?.interval??0;
 if(rating==='again')return 10*60*1000;
 const minimum={hard:1,good:3,easy:7}[rating];
 const multiplier={hard:1.2,good:2,easy:3}[rating];
 return Math.min(365*day,Math.max(minimum,Math.round(previous/day*multiplier))*day);
}
export function intervalLabel(ms){
 return ms<day?'10 min':Math.round(ms/day)+(ms===day?' day':' days');
}
function read(subject){
 if(memory.has(subject))return memory.get(subject);
 try{return JSON.parse(localStorage.getItem(key(subject)))??blank();}catch{return blank();}
}
function change(subject,update){
 const next=update(read(subject));
 try{localStorage.setItem(key(subject),JSON.stringify(next));memory.delete(subject);}
 catch{memory.set(subject,next);}
 window.dispatchEvent(new CustomEvent(event,{detail:subject}));
}
export function useReview(subject){
 const [state,setState]=useState(()=>read(subject));
 useEffect(()=>{
  const local=e=>{if(e.detail===subject)setState(read(subject));};
  const storage=e=>{if(e.key===key(subject)||e.key===null){memory.delete(subject);setState(read(subject));}};
  window.addEventListener(event,local);
  window.addEventListener('storage',storage);
  return ()=>{window.removeEventListener(event,local);window.removeEventListener('storage',storage);};
 },[subject]);
 return state;
}
export function rate(subject,id,rating){
 change(subject,state=>{
  const time=Date.now(),next=interval(state.cards[id],rating);
  const cards={...state.cards,[id]:{rating,interval:next,due:time+next}};
  if(rating!=='again')return {...state,cards};
  const old=state.mistakes[id];
  return {...state,cards,mistakes:{...state.mistakes,[id]:{misses:(old?.misses??0)+1,note:old?.note??'',resolved:false,updated:time}}};
 });
}
export function saveMistake(subject,id,note){
 change(subject,state=>{
  const old=state.mistakes[id];
  return {...state,mistakes:{...state.mistakes,[id]:{misses:old?.misses??0,note,resolved:false,updated:Date.now()}}};
 });
}
export function resolveMistake(subject,id,resolved){
 change(subject,state=>state.mistakes[id]?{...state,mistakes:{...state.mistakes,[id]:{...state.mistakes[id],resolved}}}:state);
}
export function saveQueue(subject,name,filters){
 change(subject,state=>{
  const match=state.queues.find(q=>q.name.toLowerCase()===name.toLowerCase());
  const queue={id:match?.id??String(Date.now()),name,filters:{...filters}};
  return {...state,queues:match?state.queues.map(q=>q.id===queue.id?queue:q):[...state.queues,queue]};
 });
}
export function removeQueue(subject,id){
 change(subject,state=>({...state,queues:state.queues.filter(q=>q.id!==id)}));
}
export function localDay(now=new Date()){
 return Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/day);
}
