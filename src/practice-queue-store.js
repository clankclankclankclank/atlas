import {useEffect,useState} from 'react';

const event='atlas-queue-change';
const blank=()=>({queues:[]});
const memory=new Map();
const key=subject=>'study-atlas-queues-v1:'+subject;
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
export function useQueues(subject){
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

export function migratePracticeQueues(subject){
 const legacy='study-atlas-review-v1:'+subject;
 try{
  const old=localStorage.getItem(legacy);
  if(old===null)return;
  const {queues}=JSON.parse(old)??{};
  if(localStorage.getItem(key(subject))===null&&Array.isArray(queues)&&queues.length)localStorage.setItem(key(subject),JSON.stringify({queues}));
  localStorage.removeItem(legacy);
 }catch{}
}
