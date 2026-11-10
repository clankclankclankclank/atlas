import React,{useState} from 'react';
import {ArrowRight,BookOpen,Check} from 'lucide-react';

export function RevisionPlan({Heading,topics,questions,papers,repeats,done,checked,toggle,openTopic,openQuestion,reference}){
 const [remaining,setRemaining]=useState(false);
 const mastered=new Set(done), reviewed=new Set(checked);
 const groups=topics.map(topic=>{
  const items=questions.filter(q=>q.topic===topic.id);
  const patterns=repeats.filter(pattern=>items.some(q=>pattern.refs.includes(q.id)));
  const recent=[...items].sort((a,b)=>papers.findIndex(p=>p.id===a.paper)-papers.findIndex(p=>p.id===b.paper)||b.marks-a.marks);
  const pool=[...recent.filter(q=>!mastered.has(q.id)),...recent.filter(q=>mastered.has(q.id))];
  const long=pool.find(q=>q.marks>=4);
  const quick=pool.find(q=>q.marks===1);
  const picks=[long,quick].filter(Boolean);
  return {...topic,patterns,coverage:new Set(items.map(q=>q.paper)).size,count:items.length,mastered:items.filter(q=>mastered.has(q.id)).length,picks:picks.length?picks:pool.slice(0,2)};
 }).filter(group=>group.count).sort((a,b)=>b.coverage-a.coverage||b.count-a.count);
 const count=groups.filter(group=>reviewed.has('topic:'+group.id)).length;
 const visible=remaining?groups.filter(group=>!reviewed.has('topic:'+group.id)):groups;
 return <>
  <Heading eyebrow="PAST-PAPER TOPICS" title="Revision plan" description="Start with topics that appear in the most papers. Try the suggested questions and check off each topic after reviewing it.">
   <span className="meta-pill">{count} / {groups.length} topics reviewed</span>
  </Heading>
  <div className="atlas-plan-toolbar"><label className="check-label"><input type="checkbox" checked={remaining} onChange={e=>setRemaining(e.target.checked)}/> Show only unreviewed topics</label><progress value={count} max={groups.length||1} aria-label="Revision plan progress"/></div>
  <div className="atlas-plan-grid">{visible.map(group=>{
   const key='topic:'+group.id,complete=reviewed.has(key);
   return <article key={group.id} className="atlas-plan-card surface">
    <div className="atlas-plan-meta"><span className="eyebrow">{group.coverage} / {papers.length} PAPERS</span><span>{group.mastered} / {group.count} questions mastered</span></div>
    <h2>{group.title}</h2>
    {group.patterns.length>0&&<ul>{group.patterns.slice(0,3).map(pattern=><li key={pattern.title}>{pattern.title}</li>)}</ul>}
    <div className="atlas-plan-links">{group.picks.map(q=><button type="button" className="reference" key={q.id} onClick={()=>openQuestion(q.id)}><BookOpen size={14}/> {reference(q)} · {q.marks} {q.marks===1?'mark':'marks'}</button>)}</div>
    <div className="atlas-plan-actions"><button type="button" className="button secondary" onClick={()=>openTopic(group.id)}>Practice topic <ArrowRight size={15}/></button><button type="button" className="button secondary" aria-pressed={complete} onClick={()=>toggle(key)}>{complete&&<Check size={15}/>} {complete?'Reviewed':'Mark reviewed'}</button></div>
   </article>;
  })}</div>
  {visible.length===0&&<p>All topics in this plan are reviewed.</p>}
 </>;
}
