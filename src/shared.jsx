import RubberSegment from './react-bits/RubberSegment.jsx';
import {questionTypeLabels} from './question-types.js';
import React,{useLayoutEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Link2} from 'lucide-react';
import {linkTo,observeRoute,readRoute} from './routing.mjs';
export function useSubjectRoute(subject,apply){
 const handler=useRef(apply);
 handler.current=apply;
 useLayoutEffect(()=>{
  const update=()=>{const route=readRoute();if(route.subject===subject)handler.current(route);};
  update();
  return observeRoute(update);
 },[subject]);
}
export function matches(query,...values){
 const normalized=query.toLowerCase().trim();
 if(!normalized)return true;
 const text=values.join(' ').toLowerCase();
 return normalized.split(/\s+/).every(term=>text.includes(term));
}

export function MarkFilter({marks,setMarks,values}){
 const items=[{value:'all',label:'All'},...values.map(n=>({value:String(n),label:n+' '+(n===1?'mark':'marks')})),{value:'long',label:'4+ marks'}];
 return <div className="atlas-mark-filter"><span aria-hidden="true">Marks</span><RubberSegment label="Filter by question marks" items={items} value={marks} onChange={setMarks}/></div>;
}
export function CopyQuestionLink({subject,id}){
 const [copied,setCopied]=useState(false);
 const [fallback,setFallback]=useState('');
 async function copy(){
  const url=new URL(linkTo(subject,'questions',{question:id}),location.href).href;
  try{
   await navigator.clipboard.writeText(url);
   setCopied(true);
   setFallback('');
  }catch{
   setFallback(url);
  }
 }
 return <><button type="button" className="button secondary" onClick={copy}>{copied?<Check size={15}/>:<Link2 size={15}/>} {copied?'Link copied':'Copy question link'}</button>{fallback&&<input className="field atlas-copy-fallback" aria-label="Question link" readOnly value={fallback} onFocus={e=>e.currentTarget.select()}/>}</>;
}
export function EEWorked({question,Rich}){
 const [mode,setMode]=useState('full');
 const [index,setIndex]=useState(0);
 const item=question.steps?.[index];
 if(!item)return <Rich html={question.ahtml}/>;
 return <div className="ee-worked">
   <div className="ee-mode" role="group" aria-label="Answer format">
    <button type="button" aria-pressed={mode==='full'} onClick={()=>setMode('full')}>Full worked answer</button>
    <button type="button" aria-pressed={mode==='step'} onClick={()=>setMode('step')}>Step through · {question.steps.length}</button>
   </div>
   {mode==='full'?<Rich html={question.ahtml}/>:<>
    <div className="ee-step-controls">
     <button type="button" className="button secondary icon-only" disabled={index===0} aria-label="Previous solution step" onClick={()=>setIndex(i=>i-1)}><ArrowLeft size={17}/></button>
     <label><span>Step {index+1} of {question.steps.length}</span><input aria-label="Solution step" type="range" min={0} max={question.steps.length-1} value={index} onChange={e=>setIndex(Number(e.target.value))}/></label>
     <button type="button" className="button secondary icon-only" disabled={index===question.steps.length-1} aria-label="Next solution step" onClick={()=>setIndex(i=>i+1)}><ArrowRight size={17}/></button>
    </div>
    <section className="ee-step ee-step-motion" key={index}><h3><span>{String(index+1).padStart(2,'0')}</span>{item.label}</h3><Rich html={item.html}/></section>
    {index===question.steps.length-1&&<p className="ee-result"><small>FINAL ANSWER</small><strong>{question.result}</strong></p>}
   </>}
 </div>;
}

export function QuestionTypeFilter({subject,type,setType}){
 const values=subject==='daa'?['all','numerical','coding','pseudocode','code']:['all','numerical'];
 const items=values.map(value=>({value,label:questionTypeLabels[value]}));
 return <div className="atlas-mark-filter"><span aria-hidden="true">Type</span><RubberSegment label="Filter by question type" items={items} value={type} onChange={setType}/></div>;
}

export function DailyVariants({groups,questions,openQuestion}){
 const now=new Date();
 const day=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000);
 return <details className="practice-queues surface"><summary>Today’s past-paper variants</summary>
  <ul className="practice-queue-list">{groups.map((group,i)=>{
   const ids=[...new Set(group.refs)].filter(id=>questions.has(id));
   if(!ids.length)return null;
   const id=ids[(day+i)%ids.length];
   return <li key={group.title}><div><b>{group.title}</b><p>{questions.get(id).question}</p></div><button type="button" className="button secondary" onClick={()=>openQuestion(id)}>Open variant</button></li>;
  })}</ul>
 </details>;
}
