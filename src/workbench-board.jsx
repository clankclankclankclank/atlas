
import React,{useState} from 'react';
import {Activity,ArrowLeft,ArrowRight,ArrowUpRight,Boxes,GitBranch,Server} from 'lucide-react';
import {CursorGrid,SignalPath} from './visual-effects.jsx';

const sort=[
 ['Start','The first value is a sorted prefix of length one.','[7, 3, 5, 2]',[7,3,5,2]],
 ['Insert 3','Move 7 right and place 3 at the front.','KEY = 3',[3,7,5,2]],
 ['Insert 5','Move 7 right and place 5 between 3 and 7.','KEY = 5',[3,5,7,2]],
 ['Insert 2','Move the whole prefix right and place 2 first.','KEY = 2',[2,3,5,7]]
];
const recursion=[
 ['Root','The root contributes n units of local work.','LEVEL 0'],
 ['Split','The two children contribute n/4 and 3n/4.','LEVEL 1'],
 ['Expand','The four displayed grandchildren also contribute n in total.','LEVEL 2']
];
const tree=[
 [220,28,'n',0],[105,87,'n/4',1],[335,87,'3n/4',1],
 [49,151,'n/16',2],[159,151,'3n/16',2],[281,151,'3n/16',2],[391,151,'9n/16',2]
];
const edges=[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
const requirements=[
 {label:'Account lockout',steps:[['Specify','Lock the account after five consecutive failed sign-ins.','REQ-01'],['Implement','Track failed attempts and lock when the count reaches five.','AUTH MODULE'],['Verify','Four failures leave the account open. The fifth locks it.','TEST-01']]},
 {label:'Order status',steps:[['Specify','Only the order owner can view its delivery status.','REQ-02'],['Implement','Check ownership before returning tracking details.','ORDER API'],['Verify','The owner gets the status. Another account gets access denied.','TEST-02']]}
];

function StepControls({step,total,setStep}){
 return <div className="workbench-steps">
  <button type="button" className="button secondary" aria-label="Previous step" disabled={step===0} onClick={()=>setStep(step-1)}><ArrowLeft size={16}/></button>
  <button type="button" className="button secondary" aria-label="Next step" disabled={step===total-1} onClick={()=>setStep(step+1)}><ArrowRight size={16}/></button>
 </div>;
}
function Board({label,Icon,position,options,active,onSelect,children,readout,controls}){
 return <section className="workbench-board" aria-label={label}>
  <header className="workbench-board-head"><span><Icon size={15}/>{label}</span><span>{position}</span></header>
  <div className="workbench-tabs" role="group" aria-label={label+' options'}>{options.map((option,i)=><button key={option} type="button" aria-pressed={active===i} onClick={()=>onSelect(i)}>{option}</button>)}</div>
  <div className="workbench-stage"><CursorGrid/>{children}</div>
  <div className="workbench-readout"><div aria-live="polite"><span>{readout[2]}</span><h2>{readout[0]}</h2><p>{readout[1]}</p></div>{controls}</div>
 </section>;
}

export function AlgorithmBoard(){
 const [mode,setMode]=useState(0),[step,setStep]=useState(0);
 const states=mode?sort:recursion;
 return <Board label="Algorithm walkthrough" Icon={GitBranch} position={'0'+(step+1)+' / 0'+states.length} options={['Recurrence tree','Insertion sort']} active={mode} onSelect={i=>{setMode(i);setStep(0);}} readout={states[step]} controls={<StepControls step={step} total={states.length} setStep={setStep}/>}>
  {mode===0?<svg className="workbench-tree" viewBox="0 0 440 180" role="img" aria-label={'Recursion tree highlighting level '+step}>
   {edges.map(([a,b])=>{const [x,y]=tree[a],[u,v,,level]=tree[b];return <SignalPath key={b} path={'M'+x+' '+(y+13)+'C'+x+' '+(y+32)+' '+u+' '+(v-33)+' '+u+' '+(v-13)} active={step===level}/>;})}
   {tree.map(([x,y,label,level],i)=><g key={i} className="workbench-tree-node" data-active={level===step} opacity={level>step?.42:1}><rect x={x-27} y={y-13} width="54" height="26" rx="7"/><text x={x} y={y+4}>{label}</text></g>)}
  </svg>:<div className="workbench-sort" aria-label={'Current array '+states[step][3].join(', ')}>{states[step][3].map((value,i)=><div className="workbench-sort-item" key={value} style={{'--sort-index':i}} data-sorted={i<=step}><span>{value}</span><i style={{height:14+value*9}}/></div>)}</div>}
 </Board>;
}

const rates=[0,8,15];
const cash=[-300,120,120,120];
const currency=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2});
export function CashFlowBoard(){
 const [active,setActive]=useState(1);
 const rate=rates[active];
 const values=cash.map((flow,year)=>flow/(1+rate/100)**year);
 const npv=values.reduce((total,value)=>total+value,0);
 return <Board label="Cash-flow explorer" Icon={Activity} position="PRESENT WORTH" options={rates.map(rate=>rate+'% discount rate')} active={active} onSelect={setActive} readout={['Net present worth '+currency.format(npv),'Discount each receipt back to year 0, then subtract the initial ₹300.','AT '+rate+'% DISCOUNT']}>
  <div className="workbench-cash" aria-label="Present value of each cash flow">{values.map((value,i)=><div key={i} className="workbench-cash-item" data-cost={i===0}>
   <b>{currency.format(value)}</b><span className="workbench-cash-bar"><i style={{height:Math.abs(value)*.17}}/></span><small>Year {i}</small>
  </div>)}</div>
 </Board>;
}

export function TraceabilityBoard(){
 const [active,setActive]=useState(0),[step,setStep]=useState(0);
 const steps=requirements[active].steps;
 return <Board label="Traceability walkthrough" Icon={Boxes} position={'0'+(step+1)+' / 03'} options={requirements.map(item=>item.label)} active={active} onSelect={i=>{setActive(i);setStep(0);}} readout={steps[step]} controls={<StepControls step={step} total={steps.length} setStep={setStep}/>}>
  <div className="workbench-trace">
   <svg viewBox="0 0 440 118" preserveAspectRatio="none" aria-hidden="true"><SignalPath path="M75 54H220" active={step===1}/><SignalPath path="M220 54H365" active={step===2}/></svg>
   {steps.map(([name,,id],i)=><button type="button" key={name} aria-pressed={i===step} onClick={()=>setStep(i)}><span>{id}</span><b>{name}</b></button>)}
  </div>
 </Board>;
}

const distributedTraces=[
 {
  label:'Remote calls',question:'D25-3(b)',topic:'RPC timing',
  steps:[
   ['Client','Marshal the arguments into a request.','REQUEST'],
   ['Network','For one 32 KB call, the data takes 32 × 1.5 = 48 ms to transfer.','TRANSFER'],
   ['Server','One call costs 49 ms. Splitting the same data into 32 calls costs 80 ms.','RESULT']
  ]
 },
 {
  label:'Clock sync',question:'D25-4(a)',topic:'Berkeley algorithm',
  steps:[
   ['Poll','Collect the readings at the same instant: 300, 270, 290 and 310 ms.','4 CLOCKS'],
   ['Average','Compute the target: (300 + 270 + 290 + 310) ÷ 4 = 292.5 ms.','292.5 ms'],
   ['Adjust','Send each clock its signed correction: −7.5, +22.5, +2.5 and −17.5 ms.','OFFSETS']
  ]
 }
];

export function DistributedBoard({openQuestion}) {
 const [active,setActive]=useState(0),[step,setStep]=useState(0);
 const {steps,question,topic}=distributedTraces[active];
 return <Board label="Distributed systems walkthrough" Icon={Server}
   position={(step+1)+' / '+steps.length} options={distributedTraces.map(trace=>trace.label)}
   active={active} onSelect={index=>{setActive(index);setStep(0);}} readout={steps[step]}
   controls={<div className="dos-trace-controls">
    <StepControls step={step} total={steps.length} setStep={setStep}/>
    <button className="dos-trace-link" type="button" onClick={()=>openQuestion(question)}>Open question <ArrowUpRight size={14}/></button>
   </div>}>
   <div className="workbench-trace">
    <svg viewBox="0 0 440 118" preserveAspectRatio="none" aria-hidden="true">
     <SignalPath path="M75 54H220" active={step===1}/>
     <SignalPath path="M220 54H365" active={step===2}/>
    </svg>
    {steps.map(([name,,tag],index)=><button key={name} type="button" aria-pressed={step===index}
      onClick={()=>setStep(index)} aria-label={topic+' · '+name}>
     <span>{tag}</span><b>{name}</b>
    </button>)}
   </div>
  </Board>;
}
