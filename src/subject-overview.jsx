import React,{useState} from 'react';
import {Activity,ArrowRight,ArrowUpRight,BookOpen,Bookmark,Boxes,Calculator,FileText,GitBranch,Layers3,Network,ShieldCheck,SquareFunction} from 'lucide-react';

const models={
 daa:{
  heading:['Design & Analysis','of Algorithms'],date:'2022–2025',
  description:'Work through past papers, trace recursive calls, and follow the decisions behind each algorithm.',
  tool:['Trace Studio','diagrams'],caption:'RECURSION TREE',
  steps:[['Root','T(n) · one original problem'],['Split','T(n/4) and T(3n/4)'],['Expand','Work across each complete level sums to n']],
  features:[
   ['Recurrence tree','Trace the branches for an uneven split.',GitBranch,{question:'E5-2(b)'}],
   ['LCS backtracking','Follow the highlighted path through the table.',Layers3,{question:'E5-6(a)'}],
   ['0/1 knapsack','See which choices produce the optimum.',Boxes,{question:'E5-5(a)'}]
  ]
 },
 cn:{
  heading:['Computer','Networks'],date:'2022–2025',
  description:'Follow a packet across the network and practice routing, subnetting, and error control with worked papers.',
  tool:['Formula sheet','formula'],caption:'PACKET PATH',
  steps:[['Send','The source hands a packet to its gateway'],['Route','The router forwards it to the next hop'],['Deliver','The packet arrives at its destination']],
  features:[
   ['Numerical lab','Practice subnet masks, timing, and error checks.',Calculator,{view:'lab'}],
   ['Most repeated','Start with recurring exam patterns.',Network,{view:'repeats'}],
   ['Formula sheet','Look up routing, transport, and timing formulas.',SquareFunction,{view:'formula'}]
  ]
 },
 ee:{
  heading:['Engineering','Economics'],date:'2024–2026',
  description:'Start with the cash-flow timeline, work through the calculations, and check the final decision.',
  tool:['Formula sheet','formula'],caption:'CASH-FLOW TIMELINE',
  steps:[['Invest','Year 0 · initial cost is an outflow'],['Operate','Year 1 · the first operating inflow arrives'],['Compare','Discount cash flows to the same date']],
  features:[
   ['Present worth','Compare two projects on a common date.',Activity,{question:'E1-4(a)'}],
   ['Depreciation','Build the schedule one year at a time.',Calculator,{question:'E2-4(a)'}],
   ['Numerical lab','Try the calculations with your own inputs.',SquareFunction,{view:'lab'}]
  ]
 },
 se:{
  heading:['Software','Engineering'],date:'2022–2025',
  description:'Follow a system from requirements to release. Practice design, testing, and estimation with worked papers.',
  tool:['Diagram Studio','diagrams'],caption:'SYSTEM DELIVERY MAP',
  steps:[['Define','Turn stakeholder needs into requirements'],['Model','Use the requirements to guide system design'],['Verify','Trace test results back to requirements']],
  features:[
   ['Diagram Studio','Explore UML, design models, and their relationships.',Boxes,{view:'diagrams'}],
   ['Estimation lab','Work through COCOMO, function points, and PERT.',Calculator,{view:'lab'}],
   ['Revision plan','Organize your practice across the core chapters.',ShieldCheck,{view:'plan'}]
  ]
 }
};
const drawings={
 daa:{
  nodes:[[220,30,'T(n)',0],[115,99,'T(n/4)',1],[325,99,'T(3n/4)',1],[63,169,'T(n/16)',2],[169,169,'T(3n/16)',2],[273,169,'T(3n/16)',2],[379,169,'T(9n/16)',2]],
  edges:[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]
 },
 cn:{
  nodes:[[70,102,'Source',0],[220,102,'Router',1],[370,102,'Destination',2]],
  edges:[[0,1],[1,2]]
 },
 se:{
  nodes:[[66,101,'Requirements',0],[220,52,'Design',1],[373,101,'Tests',2]],
  edges:[[0,1],[1,2]]
 }
};
function BoardGraph({subject,step}){
 if(subject==='ee'){
  const points=[[64,154],[165,85],[270,69],[373,52]];
  return <>
   <path className="subject-axis" d="M39 114H409M64 32V176"/>
   {points.map(([x,y],i)=><g key={x} className={'subject-graph-node '+(step===Math.min(i,2)?'is-active':'')}><path className="subject-cash" d={'M'+x+' 114V'+y}/><path className="subject-cash" d={'M'+(x-6)+' '+(y+(i===0?-7:7))+'L'+x+' '+y+'l6 '+(i===0?-7:7)}/><text x={x} y={i===0?173:y-11}>{['Cost','Inflow','Inflow','Inflow'][i]}</text><text className="subject-graph-sub" x={x+12} y={i===0?103:139}>Year {i}</text></g>)}
   <path className={'subject-return '+(step===2?'is-active':'')} d="M373 152H98l9-5m-9 5 9 5"/><text className="subject-return-label" x="238" y="174">DISCOUNT TO YEAR 0</text>
  </>;
 }
 const {nodes,edges}=drawings[subject];
 return <>
  {subject==='cn'&&<><circle cx="220" cy="102" r="68" className="subject-orbit"/><circle cx="220" cy="102" r="84" className="subject-orbit"/></>}
  {edges.map(([a,b])=>{const [x,y]=nodes[a],[nx,ny,,level]=nodes[b],flat=y===ny;return <path key={b} className={'subject-edge '+(step>=level?'is-active':'')} d={flat?'M'+(x+51)+' '+y+'H'+(nx-51):'M'+x+' '+(y+(ny>y?16:-16))+'C'+x+' '+(y+32)+' '+nx+' '+(ny-32)+' '+nx+' '+(ny+(ny>y?-16:16))}/>;})}
  {subject==='se'&&<><path className={'subject-return '+(step===2?'is-active':'')} d="M373 124v34H66v-34m-5 8 5-8 5 8"/><text className="subject-return-label" x="220" y="179">TRACEABILITY LOOP</text></>}
  {nodes.map(([x,y,label,level])=><g key={x+'-'+y} className={'subject-graph-node '+(level===step?'is-active':'')}><rect x={x-51} y={y-16} width="102" height="32" rx="8"/><text x={x} y={y+4}>{label}</text></g>)}
 </>;
}
function SubjectBoard({subject,model}){
 const [step,setStep]=useState(0);
 return <section className="subject-board" aria-label={model.caption}>
  <header><span><i/>{model.caption}</span><span>{subject.toUpperCase()} / 01</span></header>
  <div className="subject-board-art"><svg viewBox="0 0 440 202" role="img" aria-label={model.caption+' · '+model.steps[step][0]}><BoardGraph subject={subject} step={step}/></svg></div>
  <div className="subject-board-controls" role="group" aria-label="Diagram steps">{model.steps.map(([label],i)=><button key={label} type="button" aria-pressed={step===i} onClick={()=>setStep(i)}>{label}</button>)}</div>
  <p aria-live="polite">{model.steps[step][1]}</p>
 </section>;
}
export function SubjectOverview({subject,go,openTopic,openQuestion,openPaper,done,savedCount,openSaved,questions,topics,papers}){
 const model=models[subject],mastered=new Set(done);
 return <div className="subject-overview">
  <section className="subject-hero">
   <div className="subject-hero-copy"><p className="subject-kicker"><i/> KIIT / {model.date}</p><h1>{model.heading[0]} <em>{model.heading[1]}.</em></h1><p className="subject-description">{model.description}</p>
    <div className="subject-actions"><button className="button primary" onClick={()=>go('questions')}>Open question bank <ArrowRight size={16}/></button><button className="button secondary" onClick={()=>go(model.tool[1])}>{model.tool[0]} <ArrowUpRight size={16}/></button></div>
   </div>
   <SubjectBoard subject={subject} model={model}/>
  </section>
  <div className="subject-stats">{[[questions.length,'worked questions'],[papers.length,'exam papers'],[topics.length,'topics'],[mastered.size,'mastered']].map(([n,label])=><div key={label}><b>{n}</b><span>{label}</span></div>)}</div>
  <section className="subject-section" aria-labelledby="subject-practice"><div className="subject-section-heading"><div><p className="subject-kicker">01 / QUICK ACCESS</p><h2 id="subject-practice">Start with a worked example</h2></div></div>
   <div className="subject-practice">{model.features.map(([label,description,Icon,target],i)=><button key={label} className="subject-card" type="button" onClick={()=>target.question?openQuestion(target.question):go(target.view)}><span className="subject-card-top"><span className="subject-icon"><Icon size={20}/></span><small>0{i+1}</small></span><strong>{label} <ArrowUpRight size={17}/></strong><span>{description}</span></button>)}</div>
  </section>
  <section className="subject-section" aria-labelledby="subject-library"><div className="subject-section-heading"><div><p className="subject-kicker">02 / STUDY BY TOPIC</p><h2 id="subject-library">Chapter library</h2></div><button className="button secondary" onClick={openSaved}><Bookmark size={16}/> Bookmarks{savedCount?' · '+savedCount:''}</button></div>
   <div className="subject-library">{topics.map(({id,title,description,Icon})=>{const list=questions.filter(q=>q.topic===id),count=list.length,complete=list.filter(q=>mastered.has(q.id)).length;return <button key={id} className="subject-card subject-chapter" type="button" onClick={()=>openTopic(id)}><span className="subject-icon"><Icon size={18}/></span><span><strong>{title}</strong><small>{description}</small><span className="subject-chapter-count">{complete?complete+' / '+count+' mastered':count+' questions'}</span>{count>0&&<progress value={complete} max={count} aria-label={title+' mastery'}/>}</span><ArrowUpRight size={16}/></button>;})}</div>
  </section>
  <section className="subject-section" aria-labelledby="subject-archive"><div className="subject-section-heading"><div><p className="subject-kicker">03 / ORIGINAL PAPERS</p><h2 id="subject-archive">Exam archive</h2></div><BookOpen size={19}/></div>
   <div className="subject-library">{papers.map(({id,label,pages})=><button className="subject-card subject-chapter" key={id} type="button" onClick={()=>openPaper(id)}><span className="subject-icon"><FileText size={17}/></span><span><strong>{label}</strong><small>{questions.filter(q=>q.paper===id).length} worked questions · {pages} scan pages</small></span><ArrowUpRight size={16}/></button>)}</div>
  </section>
 </div>;
}
