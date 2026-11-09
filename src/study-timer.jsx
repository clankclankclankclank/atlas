import React,{useEffect,useRef,useState} from 'react';
import {Pause,Play,RotateCcw,Timer,X} from 'lucide-react';

const key='study-atlas-timer-v1';
const cache=Symbol.for(key);
const presets=[5,15,25,45,60];
const initial={minutes:25,remaining:25*60,end:null};
function readTimer(){
 try{
  const saved=JSON.parse(localStorage.getItem(key));
  if(presets.includes(saved?.minutes)&&Number.isFinite(saved.remaining)&&
   (saved.end===null||Number.isFinite(saved.end)))return saved;
 }catch{}
 return window[cache]??initial;
}
function secondsLeft(state){
 return state.end===null?state.remaining:Math.max(0,Math.ceil((state.end-Date.now())/1000));
}
const format=seconds=>Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');

export function StudyTimer(){
 const [timer,setTimer]=useState(readTimer);
 const [seconds,setSeconds]=useState(()=>secondsLeft(timer));
 const dialog=useRef(null);
 const active=timer.end!==null&&seconds>0;
 const done=seconds===0;
 function save(state){
  window[cache]=state;
  try{localStorage.setItem(key,JSON.stringify(state));}catch{}
  setTimer(state);
  setSeconds(secondsLeft(state));
 }
 useEffect(()=>{
  const sync=e=>{if(e.key===key||e.key===null){const next=readTimer();setTimer(next);setSeconds(secondsLeft(next));}};
  window.addEventListener('storage',sync);
  return ()=>window.removeEventListener('storage',sync);
 },[]);
 useEffect(()=>{
  if(!active)return;
  const interval=setInterval(()=>setSeconds(secondsLeft(timer)),250);
  return ()=>clearInterval(interval);
 },[active,timer]);
 function toggle(){
  const remaining=secondsLeft(timer);
  if(timer.end!==null&&remaining>0)save({...timer,remaining,end:null});
  else{
   const duration=remaining||timer.minutes*60;
   save({...timer,remaining:duration,end:Date.now()+duration*1000});
  }
 }
 function reset(minutes=timer.minutes){save({minutes,remaining:minutes*60,end:null});}
 const ratio=seconds/(timer.minutes*60);
 return <div className="rail-timer" data-running={active} data-done={done}>
  <button type="button" className="rail-timer-open" aria-label="Study timer" title={'Study timer · '+format(seconds)} onClick={()=>dialog.current.showModal()}>
   <span className="timer-ring" style={{'--timer-progress':ratio}}><Timer size={17}/></span>
   <span className="rail-timer-label"><small>{done?'TIME UP':'STUDY TIMER'}</small><b>{format(seconds)}</b></span>
  </button>
  <button type="button" className="rail-timer-toggle" onClick={toggle} aria-label={active?'Pause timer':'Start timer'} title={active?'Pause timer':'Start timer'}>{active?<Pause size={16}/>:<Play size={16}/>}</button>
  <dialog ref={dialog} className="timer-dialog" aria-labelledby="timer-heading">
   <div className="timer-dialog-top"><h2 id="timer-heading">Study timer</h2><form method="dialog"><button type="submit" className="button secondary icon-only" aria-label="Close timer"><X size={18}/></button></form></div>
   <div className="timer-dial" style={{'--timer-progress':ratio}}><div><small>{done?'SESSION COMPLETE':active?'FOCUS SESSION':'READY TO STUDY'}</small><strong>{format(seconds)}</strong></div></div>
   <div className="timer-presets" role="group" aria-label="Timer duration">{presets.map(minutes=><button key={minutes} type="button" aria-pressed={timer.minutes===minutes} onClick={()=>reset(minutes)}>{minutes} min</button>)}</div>
   <div className="timer-actions"><button type="button" className="button primary" onClick={toggle}>{active?<Pause size={16}/>:<Play size={16}/>} {active?'Pause':done?'Start again':seconds<timer.minutes*60?'Resume':'Start focus'}</button><button type="button" className="button secondary" onClick={()=>reset()}><RotateCcw size={16}/> Reset</button></div>
   <p className="timer-hint">The countdown follows you between subjects.</p>
  </dialog>
  <span className="timer-announcement" role="status">{done?'Study timer complete.':''}</span>
 </div>;
}
