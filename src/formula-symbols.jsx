import React,{useId,useRef,useState} from 'react';
import {X} from 'lucide-react';

const htmlEntities={'&lt;':'<','&gt;':'>','&amp;':'&','&nbsp;':' '};
const wordCharacter=/[A-Za-z]/;

function equationParts(html,symbols){
 const unmatched=new Set(symbols);
 const candidates=[...symbols].sort((a,b)=>b.length-a.length);
 const runs=[];
 let variant=null;
 for(const text of html.split(/(<\/?(?:sub|sup)>)/g)){
  if(text.startsWith('<')&&text.endsWith('>')){variant=text[1]==='/'?null:text.slice(1,-1);continue;}
  const value=text.replace(/&(?:lt|gt|amp|nbsp);/g,entity=>htmlEntities[entity]);
  const chunks=[];
  let start=0;
  for(let i=0;i<value.length;){
   const symbol=candidates.find(candidate=>value.startsWith(candidate,i)&&
    !(wordCharacter.test(candidate[0])&&wordCharacter.test(value[i-1]??''))&&
    !(wordCharacter.test(candidate.at(-1))&&wordCharacter.test(value[i+candidate.length]??'')));
   if(!symbol){i++;continue;}
   if(i>start)chunks.push({text:value.slice(start,i)});
   chunks.push({symbol});
   unmatched.delete(symbol);
   i+=symbol.length;
   start=i;
  }
  if(start<value.length)chunks.push({text:value.slice(start)});
  if(chunks.length)runs.push({variant,chunks});
 }
 return {runs,unmatched};
}

export function FormulaSymbols({equation,details}){
 const [selection,setSelection]=useState(null);
 const panelId=useId();
 const trigger=useRef(null);
 if(!details)return <div className="rich equation" dangerouslySetInnerHTML={{__html:equation}}/>;
 const {runs,unmatched}=equationParts(equation,details.symbols.map(([symbol])=>symbol));
 const active=details.symbols.find(([symbol])=>symbol===selection);
 function close(){setSelection(null);trigger.current?.focus();}
 const renderSymbol=(symbol,key)=><button type="button" key={key} className="atlas-formula-symbol" aria-label={'Explain '+symbol} aria-expanded={selection===symbol} aria-controls={selection===symbol?panelId:undefined} onClick={e=>{trigger.current=e.currentTarget;setSelection(current=>current===symbol?null:symbol);}}>{symbol}</button>;
 return <div className="atlas-formula-guide" onKeyDown={e=>{if(e.key==='Escape'&&active){e.stopPropagation();close();}}}>
  <div className="rich equation">{runs.map(({variant,chunks},i)=>{
   const Tag=variant||React.Fragment;
   return <Tag key={i}>{chunks.map(({symbol,text},j)=>symbol?renderSymbol(symbol,j):text)}</Tag>;
  })}</div>
  {unmatched.size>0&&<div className="atlas-formula-extra" aria-label="Other symbols">{[...unmatched].map(symbol=>renderSymbol(symbol,symbol))}</div>}
  {active&&<div id={panelId} className="atlas-formula-detail">
   <div role="status"><div><strong>{active[0]}</strong><span>{active[2]}</span></div><p>{active[1]}</p><p><b>Example</b> {details.example}</p></div>
   <button type="button" className="atlas-tool-icon" aria-label="Close symbol explanation" onClick={close}><X size={16}/></button>
  </div>}
 </div>;
}
