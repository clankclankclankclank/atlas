import React,{useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {Calculator,X} from 'lucide-react';

export function useTableCalculations(host,html){
 const [active,setActive]=useState(null);
 useEffect(()=>{
  if(!html.includes('data-cell-calculation'))return;
  const node=host.current;
  let selected,inputs=[];
  function clear(){
   selected?.setAttribute('aria-expanded','false');
   selected?.closest('td')?.classList.remove('atlas-calc-active');
   inputs.forEach(input=>input.classList.remove('atlas-calc-input'));
   selected=null;
   inputs=[];
  }
  function close(){const trigger=selected;clear();setActive(null);trigger?.focus({preventScroll:true});}
  function click(e){
   const button=e.target.closest('[data-cell-calculation]');
   if(!button||!node.contains(button))return;
   if(button===selected){close();return;}
   window.dispatchEvent(new CustomEvent('atlas-cell-selection',{detail:node}));
   clear();
   const cell=button.closest('td');
   const table=cell.closest('table');
   const data=JSON.parse(button.dataset.cellCalculation);
   inputs=data.inputs.map(([row,column])=>table.tBodies[0].rows[row]?.cells[column]).filter(Boolean);
   inputs.forEach(input=>input.classList.add('atlas-calc-input'));
   cell.classList.add('atlas-calc-active');
   button.setAttribute('aria-expanded','true');
   selected=button;
   setActive({html,node:button,data,close,inputCount:inputs.length});
  }
  function key(e){if(e.key==='Escape'&&selected)close();}
  function otherSelection(e){if(selected&&e.detail!==node){clear();setActive(null);}}
  window.addEventListener('atlas-cell-selection',otherSelection);
  node.addEventListener('click',click);
  node.addEventListener('keydown',key);
  return ()=>{clear();window.removeEventListener('atlas-cell-selection',otherSelection);node.removeEventListener('click',click);node.removeEventListener('keydown',key);};
 },[host,html]);
 return active?.html===html&&active.node.isConnected?active:null;
}

export function TableCalculation({active}){
 if(!active)return null;
 return createPortal(<aside className="atlas-cell-panel" aria-label="Cell calculation" onKeyDown={e=>{if(e.key==='Escape')active.close();}}>
  <div role="status"><small><Calculator size={14}/> CELL CALCULATION</small><strong>{active.data.title}</strong>
   {active.data.lines.map((line,i)=><p key={i}>{line}</p>)}
   {active.inputCount>0&&<small className="atlas-cell-key"><i/> Highlighted inputs in the table</small>}
  </div>
  <button type="button" className="atlas-tool-icon" onClick={active.close} aria-label="Close cell calculation"><X size={16}/></button>
 </aside>,document.body);
}
