import React from 'react';
import {AlgorithmBoard,CashFlowBoard,TraceabilityBoard} from './workbench-board.jsx';
import {CountStat,RevealGrid,RevealLine,trackSpotlight} from './visual-effects.jsx';
import {SignalBoard} from './cn/signal-board.jsx';
import {Activity,ArrowRight,ArrowUpRight,BookOpen,Bookmark,Boxes,Calculator,FileText,GitBranch,Layers3,Network,ShieldCheck,SquareFunction} from 'lucide-react';

const models={
 daa:{
  heading:['Design & Analysis','of Algorithms'],date:'2022–2025',
  tool:['Trace Studio','diagrams'],
  features:[
   ['Recurrence tree','Trace the branches for an uneven split.',GitBranch,{question:'E5-2(b)'}],
   ['LCS backtracking','Follow the highlighted path through the table.',Layers3,{question:'E5-6(a)'}],
   ['0/1 knapsack','See which choices produce the optimum.',Boxes,{question:'E5-5(a)'}]
  ]
 },
 cn:{
  heading:['Computer','Networks'],date:'2022–2025',
  tool:['Network diagrams','diagrams'],
  features:[
   ['Numerical lab','Practice subnet masks, timing, and error checks.',Calculator,{view:'lab'}],
   ['Most repeated','Start with recurring exam patterns.',Network,{view:'repeats'}],
   ['Formula sheet','Look up routing, transport, and timing formulas.',SquareFunction,{view:'formula'}]
  ]
 },
 ee:{
  heading:['Engineering','Economics'],date:'2024–2026',
  tool:['Formula drills','drills'],
  features:[
   ['Present worth','Compare two projects on a common date.',Activity,{question:'E1-4(a)'}],
   ['Depreciation','Build the schedule one year at a time.',Calculator,{question:'E2-4(a)'}],
   ['Numerical lab','Try the calculations with your own inputs.',SquareFunction,{view:'lab'}]
  ]
 },
 se:{
  heading:['Software','Engineering'],date:'2022–2025',
  tool:['Diagram Studio','diagrams'],
  features:[
   ['Diagram Studio','Explore UML, design models, and their relationships.',Boxes,{view:'diagrams'}],
   ['Estimation lab','Work through COCOMO, function points, and PERT.',Calculator,{view:'lab'}],
   ['Revision plan','Organize your practice across the core chapters.',ShieldCheck,{view:'plan'}]
  ]
 }
};
const boards={daa:AlgorithmBoard,cn:SignalBoard,ee:CashFlowBoard,se:TraceabilityBoard};
export function SubjectOverview({subject,go,openTopic,openQuestion,openPaper,openNumericals,done,savedCount,openSaved,questions,topics,papers}){
 const model=models[subject],mastered=new Set(done),Board=boards[subject];
 return <div className="subject-overview">
  <section className="subject-hero">
   <div className="subject-hero-copy"><p className="subject-kicker"><i/> PAST PAPERS · {model.date}</p><h1 aria-label={model.heading.join(' ')}><RevealLine>{model.heading[0]}</RevealLine><RevealLine delay={85} accent>{model.heading[1]}.</RevealLine></h1>
    <div className="subject-actions"><button className="button primary" onClick={()=>go('questions')}>Open question bank <ArrowRight size={16}/></button><button className="button secondary" onClick={openNumericals}><Calculator size={16}/> Numericals</button><button className="button secondary" onClick={()=>go(model.tool[1])}>{model.tool[0]} <ArrowUpRight size={16}/></button></div>
   </div>
   <Board/>
  </section>
  <div className="subject-stats">{[[questions.length,'worked questions',BookOpen],[papers.length,'exam papers',FileText],[topics.length,'topics',Layers3],[mastered.size,'mastered',ShieldCheck]].map(([n,label,Icon])=><div key={label}><Icon size={15} aria-hidden="true"/><CountStat value={n}/><span>{label}</span></div>)}</div>
  <section className="subject-section" aria-labelledby="subject-practice"><div className="subject-section-heading"><div><p className="subject-kicker">01 / QUICK ACCESS</p><h2 id="subject-practice">Practice shortcuts</h2></div></div>
   <RevealGrid className="subject-practice">{model.features.map(([label,description,Icon,target],i)=><button key={label} className="subject-card" onPointerMove={trackSpotlight} type="button" onClick={()=>target.question?openQuestion(target.question):go(target.view)}><span className="subject-card-top"><span className="subject-icon"><Icon size={20}/></span><small>0{i+1}</small></span><strong>{label} <ArrowUpRight size={17}/></strong><span>{description}</span></button>)}</RevealGrid>
  </section>
  <section className="subject-section" aria-labelledby="subject-library"><div className="subject-section-heading"><div><p className="subject-kicker">02 / STUDY BY TOPIC</p><h2 id="subject-library">Chapter library</h2></div><button className="button secondary" onClick={openSaved}><Bookmark size={16}/> Bookmarks{savedCount?' · '+savedCount:''}</button></div>
   <div className="subject-library">{topics.map(({id,title,description,Icon})=>{const list=questions.filter(q=>q.topic===id),count=list.length,complete=list.filter(q=>mastered.has(q.id)).length;return <button key={id} className="subject-card subject-chapter" onPointerMove={trackSpotlight} type="button" onClick={()=>openTopic(id)}><span className="subject-icon"><Icon size={18}/></span><span><strong>{title}</strong><small>{description}</small><span className="subject-chapter-count">{complete?complete+' / '+count+' mastered':count+' questions'}</span>{count>0&&<progress value={complete} max={count} aria-label={title+' mastery'}/>}</span><ArrowUpRight size={16}/></button>;})}</div>
  </section>
  <section className="subject-section" aria-labelledby="subject-archive"><div className="subject-section-heading"><div><p className="subject-kicker">03 / ORIGINAL PAPERS</p><h2 id="subject-archive">Exam archive</h2></div><BookOpen size={19}/></div>
   <div className="subject-library">{papers.map(({id,label,pages})=><button className="subject-card subject-chapter" key={id} type="button" onClick={()=>openPaper(id)}><span className="subject-icon"><FileText size={17}/></span><span><strong>{label}</strong><small>{questions.filter(q=>q.paper===id).length} worked questions · {pages} scan pages</small></span><ArrowUpRight size={16}/></button>)}</div>
  </section>
 </div>;
}
