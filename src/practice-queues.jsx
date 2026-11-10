import {questionTypeLabels} from './question-types.js';
import React,{useState} from 'react';
import {Save} from 'lucide-react';
import {removeQueue,saveQueue,useQueues} from './practice-queue-store.js';

export function PracticeQueues({subject,filters,apply}){
 const {queues}=useQueues(subject);
 const [name,setName]=useState('');
 const [feedback,setFeedback]=useState('');
 return <details className="practice-queues surface"><summary><Save size={16}/> Saved practice queues <small>{queues.length}</small></summary>
  <form onSubmit={e=>{e.preventDefault();const label=name.trim();if(!label)return;saveQueue(subject,label,filters);setFeedback('Saved '+label+'.');setName('');}}>
   <label>Queue name<input className="field" maxLength={64} required value={name} onChange={e=>setName(e.target.value)} placeholder="Graphs · 4+ marks"/></label>
   <button className="button secondary" type="submit">Save current filters</button>
  </form>
  <p>Stores your search, paper, topic, marks, question type, question list, and quiz mode. Saving with the same name updates the queue.</p>
  {feedback&&<p role="status">{feedback}</p>}
  <QueueList subject={subject} queues={queues} open={apply}/>
 </details>;
}
function QueueList({subject,queues,open}){
 if(!queues.length)return <p>No saved queues yet.</p>;
 return <ul className="practice-queue-list">{queues.map(q=><li key={q.id}><div><b>{q.name}</b><small>{Object.entries(q.filters).filter(([,v])=>v&&v!=='all'&&v!==true).map(([key,value])=>key==='type'?questionTypeLabels[value]??value:value).join(' · ')||'All questions'}{q.filters.quiz?' · Quiz mode':''}</small></div><button type="button" className="button secondary" onClick={()=>open(q.filters)}>Load</button><button type="button" className="button secondary" aria-label={'Delete '+q.name} onClick={()=>removeQueue(subject,q.id)}>Delete</button></li>)}</ul>;
}
