import {StudySelect} from '../study-select.jsx';
import React,{useState} from 'react';
import {ArrowRight,Check,RotateCcw,X} from 'lucide-react';
import {drills} from './formula-drills-data.mjs';

function shuffle(items){
 const result=[...items];
 for(let i=result.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}
function makeDeck(questions,topic){
 return shuffle(drills.flatMap(([id,prompt,...options])=>{
  const question=questions.get(id);
  if(!question||(topic!=='all'&&question.topic!==topic))return [];
  return [{question,prompt,options:shuffle(options.map(([formula,reason],i)=>({formula,reason,correct:i===0})))}];
 }));
}
export function FormulaDrills({Heading,Rich,questions,topics,reference}){
 const [topic,setTopic]=useState('all');
 const [deck,setDeck]=useState(()=>makeDeck(questions,'all'));
 const [index,setIndex]=useState(0);
 const [selected,setSelected]=useState(null);
 const [checked,setChecked]=useState(false);
 const [score,setScore]=useState(0);
 const current=deck[index];
 function start(nextTopic){
  setTopic(nextTopic);
  setDeck(makeDeck(questions,nextTopic));
  setIndex(0);setScore(0);setSelected(null);setChecked(false);
 }
 function check(e){
  e.preventDefault();
  if(selected===null||checked)return;
  setChecked(true);
  if(current.options[selected].correct)setScore(v=>v+1);
 }
 return <>
  <Heading eyebrow="FORMULA PRACTICE" title="Formula selection drills" description="Read the past-paper question and choose the formula for the highlighted task."/>
  <div className="atlas-drill-toolbar"><StudySelect label="Formula topic" value={topic} onChange={start} options={[{value:'all',label:'All formula topics'},...topics.filter(t=>drills.some(([id])=>questions.get(id)?.topic===t.id)).map(t=>({value:t.id,label:t.title}))]}/><button type="button" className="button secondary" onClick={()=>start(topic)}><RotateCcw size={16}/> Restart drill</button></div>
  {!current?<section className="atlas-drill surface"><h2>Drill complete</h2><p>{score} / {deck.length} formulas correct on the first try.</p><button type="button" className="button primary" onClick={()=>start(topic)}>Practice again</button></section>:
   <section className="atlas-drill surface">
    <div className="atlas-plan-meta"><span className="eyebrow">{reference(current.question)} · {current.question.marks} {current.question.marks===1?'mark':'marks'}</span><span>{index+1} / {deck.length} · {score} correct</span></div>
    <Rich html={current.question.qhtml}/>
    <form onSubmit={check}>
     <fieldset><legend>{current.prompt}</legend>
      {current.options.map(({formula,reason,correct},i)=><label key={formula} className="atlas-drill-option" data-selected={selected===i} data-result={checked?(correct?'correct':selected===i?'wrong':undefined):undefined}>
       <input type="radio" name="formula-choice" value={i} disabled={checked} checked={selected===i} onChange={()=>setSelected(i)}/>
       <span><code>{formula}</code>{checked&&<small>{reason}</small>}</span>
       {checked&&correct&&<Check size={18} aria-label="Correct formula"/>}{checked&&selected===i&&!correct&&<X size={18} aria-label="Incorrect selection"/>}
      </label>)}
     </fieldset>
     <div className="atlas-drill-actions">{checked?<><span role="status">{current.options[selected].correct?'Correct formula.':'Check the reasoning below each formula.'}</span><button type="button" className="button primary" onClick={()=>{setIndex(i=>i+1);setSelected(null);setChecked(false);}}>{index+1===deck.length?'See results':'Next question'} <ArrowRight size={16}/></button></>:<button type="submit" className="button primary" disabled={selected===null}>Check formula</button>}</div>
    </form>
    {checked&&<details key={current.question.id} className="atlas-drill-solution"><summary>View worked solution</summary><Rich html={current.question.ahtml}/></details>}
   </section>}
 </>;
}
