import React,{useState} from 'react';
import {Activity,ArrowLeft,ArrowRight,Database,Globe2,Layers3,Laptop,Router,Server} from 'lucide-react';
import {CursorGrid,SignalPath} from '../visual-effects.jsx';

const traces=[
 {id:'route',label:'Routing',nodes:[[Laptop,'Source'],[Router,'Gateway'],[Router,'Next hop'],[Server,'Destination']],steps:[
  ['Frame the packet','The source sends the frame to its default gateway.','DESTINATION IP'],
  ['Look up the route','The gateway chooses the longest matching destination prefix.','LONGEST PREFIX'],
  ['Forward the packet','The next router decrements TTL and forwards the packet.','TTL − 1'],
  ['Deliver locally','The last router delivers the frame to the destination host.','LOCAL DELIVERY']
 ]},
 {id:'tcp',label:'TCP',nodes:[[Laptop,'Client'],[Server,'Server'],[Laptop,'Client'],[Server,'Server']],steps:[
  ['SYN','The client starts the connection with initial sequence number x.','SEQ = x'],
  ['SYN–ACK','The server sends its own sequence number y and acknowledges x + 1.','ACK = x + 1'],
  ['ACK','The client acknowledges y + 1. The three-way handshake is complete.','ACK = y + 1'],
  ['Data','Once established, the connection can carry application bytes.','ESTABLISHED']
 ]},
 {id:'dns',label:'DNS',nodes:[[Laptop,'Client'],[Layers3,'Resolver'],[Globe2,'Authority'],[Database,'Cache']],steps:[
  ['Request a name','The client asks its recursive resolver for the domain’s IP address.','A QUERY'],
  ['Follow referrals','On a cache miss, the resolver can follow root and TLD referrals.','CACHE MISS'],
  ['Get the record','The authoritative server returns the requested record if it exists.','A RECORD'],
  ['Cache and respond','The resolver returns the result and caches it for the record’s TTL.','CACHE TTL']
 ]}
];
const x=[48,158,268,378];
const y=[98,57,98,57];

export function SignalBoard(){
 const [mode,setMode]=useState(0),[step,setStep]=useState(0);
 const trace=traces[mode],last=trace.steps.length-1;
 const [title,body,field]=trace.steps[step];
 return <section className="cn-signal-board" aria-label="Packet walkthrough">
  <header className="cn-board-head"><span><Activity size={15}/> PACKET WALKTHROUGH</span><span className="cn-board-index">0{step+1} / 0{trace.steps.length}</span></header>
  <div className="cn-protocol-switch" role="group" aria-label="Choose a protocol">{traces.map(({id,label},i)=><button type="button" key={id} aria-pressed={mode===i} onClick={()=>{setMode(i);setStep(0);}}>{label}</button>)}</div>
  <div className="cn-signal-graph"><CursorGrid/>
   <svg viewBox="0 0 426 149" aria-hidden="true">
    <path className="cn-signal-guide" d="M0 57H426M0 98H426M48 0v130M158 0v130M268 0v130M378 0v130"/>
    {x.slice(0,-1).map((value,i)=><SignalPath key={trace.id+i} path={'M'+value+' '+y[i]+'H'+(value+47)+'L'+(x[i+1]-26)+' '+y[i+1]+'H'+x[i+1]} active={i===Math.min(step,last-1)}/>)}
   </svg>
   {trace.nodes.map(([Icon,label],i)=><button type="button" key={trace.id+i} className="cn-signal-node" style={{left:x[i]/426*100+'%',top:y[i]/149*100+'%'}} aria-label={'Step '+(i+1)+' · '+trace.steps[i][0]} aria-pressed={step===i} onClick={()=>setStep(i)}><span><Icon size={18}/></span><small>{label}</small></button>)}
  </div>
  <div className="cn-board-readout">
   <div aria-live="polite"><span className="cn-signal-field">{field}</span><h2>{title}</h2><p>{body}</p></div>
   <div className="cn-board-controls"><button type="button" className="button secondary" aria-label="Previous packet step" onClick={()=>setStep(step-1)} disabled={!step}><ArrowLeft size={16}/></button><button type="button" className="button secondary" aria-label="Next packet step" onClick={()=>setStep(step+1)} disabled={step===last}><ArrowRight size={16}/></button></div>
  </div>
 </section>;
}
