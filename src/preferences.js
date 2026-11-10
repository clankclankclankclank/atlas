import {useEffect,useState} from 'react';
import {readRoute,studyKeys,subjects} from './routing.mjs';

const key='study-atlas-preferences-v1';
const event='atlas-preferences';
const cache=Symbol.for(key);
const normalize=value=>({
 theme:value?.theme==='light'?'light':'dark',
 ui:value?.ui==='minimal'?'minimal':'original',
 sidebar:value?.sidebar==='icons'?'icons':'expanded',
 rewards:value?.rewards!==false
});
function stored(name){
 try{return JSON.parse(localStorage.getItem(name));}catch{return null;}
}
function persist(value){
 window[cache]=value;
 try{localStorage.setItem(key,JSON.stringify(value));}catch{}
 return value;
}
function get(){
 if(window[cache])return window[cache];
 const shared=stored(key);
 if(shared)return window[cache]=normalize(shared);
 let last;
 try{last=readRoute(localStorage.getItem('study-atlas-last-route')||'').subject;}catch{}
 const candidates=[readRoute().subject,last,...subjects].filter(id=>subjects.includes(id));
 const previous=candidates.find(id=>stored(id+'-atlas-display-v1'));
 const rewardSubject=previous??candidates[0];
 return persist(normalize({...stored(previous+'-atlas-display-v1'),rewards:stored(studyKeys[rewardSubject])?.sunnaEnabled}));
}
export function updatePreferences(patch){
 const value=persist(normalize({...get(),...patch}));
 window.dispatchEvent(new CustomEvent(event,{detail:value}));
}
export function useAtlasPreferences(){
 const [value,setValue]=useState(get);
 useEffect(()=>{
  const local=e=>setValue(e.detail);
  const remote=e=>{
   if(e.key!==key&&e.key!==null)return;
   const next=normalize(stored(key));
   window[cache]=next;
   setValue(next);
  };
  window.addEventListener(event,local);
  window.addEventListener('storage',remote);
  setValue(get());
  return ()=>{window.removeEventListener(event,local);window.removeEventListener('storage',remote);};
 },[]);
 return value;
}
