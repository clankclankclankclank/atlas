import React,{useEffect,useState} from 'react';
import {BookOpen,Layers3,NotebookPen,Repeat2,Save} from 'lucide-react';
import {formulaId,interval,intervalLabel,localDay,questionId,rate,ratings,removeQueue,resolveMistake,saveMistake,saveQueue,useReview} from './review-store.js';

function RatingButtons({card,onRate}){
 return <div className="recall-ratings" role="group" aria-label="Recall rating">{ratings.map(([id,label,description])=><button key={id} type="button" className="button secondary" title={description} onClick={()=>onRate(id)}><b>{label}</b><small>{intervalLabel(interval(card,id))}</small></button>)}</div>;
}
function MistakeNote({subject,id,entry}){
 const [note,setNote]=useState(entry?.note??'');
 const [saved,setSaved]=useState(false);
 return <form className="mistake-note" onSubmit={e=>{e.preventDefault();saveMistake(subject,id,note.trim());setSaved(true);}}>
  <label>What tripped you up?<textarea className="field" rows={2} maxLength={1200} value={note} onChange={e=>{setNote(e.target.value);setSaved(false);}} placeholder="Example: I used nominal instead of effective interest."/></label>
  <button className="button secondary" type="submit"><NotebookPen size={15}/> Save to mistakes</button>{saved&&<small role="status">Saved.</small>}
 </form>;
}
export function RecallTools({subject,question}){
 const state=useReview(subject),id=questionId(question),card=state.cards[id];
 const [noteOpen,setNoteOpen]=useState(false);
 return <section className="recall-tools" aria-label="Question recall">
  <div><b>Rate your recall</b><p>After checking the answer, choose how well you remembered it.</p></div>
  <RatingButtons card={card} onRate={rating=>rate(subject,id,rating)}/>
  {card&&<p role="status">Last rating: {ratings.find(([k])=>k===card.rating)?.[1]}. Next review {new Date(card.due).toLocaleString()}.</p>}
  <button className="button secondary" type="button" aria-expanded={noteOpen} onClick={()=>setNoteOpen(!noteOpen)}><NotebookPen size={15}/> {noteOpen?'Close mistake note':'Log a mistake'}</button>
  {noteOpen&&<MistakeNote subject={subject} id={id} entry={state.mistakes[id]}/>}
 </section>;
}
export function PracticeQueues({subject,filters,apply}){
 const {queues}=useReview(subject);
 const [name,setName]=useState('');
 const [feedback,setFeedback]=useState('');
 return <details className="practice-queues surface"><summary><Save size={16}/> Saved practice queues <small>{queues.length}</small></summary>
  <form onSubmit={e=>{e.preventDefault();const label=name.trim();if(!label)return;saveQueue(subject,label,filters);setFeedback('Saved '+label+'.');setName('');}}>
   <label>Queue name<input className="field" maxLength={64} required value={name} onChange={e=>setName(e.target.value)} placeholder="Graphs · 4+ marks"/></label>
   <button className="button secondary" type="submit">Save current filters</button>
  </form>
  <p>Stores your search, paper, topic, marks, question list, and quiz mode. Saving with the same name updates the queue.</p>
  {feedback&&<p role="status">{feedback}</p>}
  <QueueList subject={subject} queues={queues} open={apply}/>
 </details>;
}
function QueueList({subject,queues,open}){
 if(!queues.length)return <p>No saved queues yet.</p>;
 return <ul className="review-list">{queues.map(q=><li key={q.id}><div><b>{q.name}</b><small>{Object.values(q.filters).filter(v=>v&&v!=='all'&&v!==true).join(' · ')||'All questions'}{q.filters.quiz?' · Quiz mode':''}</small></div><button type="button" className="button secondary" onClick={()=>open(q.filters)}>Load</button><button type="button" className="button secondary" aria-label={'Delete '+q.name} onClick={()=>removeQueue(subject,q.id)}>Delete</button></li>)}</ul>;
}

function ReviewCard({item,subject,state,Rich,onAdvance,openQuestion}){
 const [show,setShow]=useState(false);
 const [noteOpen,setNoteOpen]=useState(false);
 return <article className="review-card surface">
  <p className="eyebrow">{item.type==='formula'?'FORMULA RECALL':'PAST-PAPER RECALL'} · {item.topic}</p>
  <h2>{item.type==='formula'?item.title:'Recall the solution'}</h2>
  {item.type==='question'&&<Rich html={item.prompt}/>}
  {show?<><div className="review-answer"><Rich html={item.answer}/>{item.description&&<p>{item.description}</p>}</div>
   <RatingButtons card={state.cards[item.id]} onRate={rating=>{rate(subject,item.id,rating);onAdvance(true);}}/>
   <button type="button" className="button secondary" onClick={()=>setNoteOpen(!noteOpen)} aria-expanded={noteOpen}>Log a mistake</button>
   {noteOpen&&<MistakeNote subject={subject} id={item.id} entry={state.mistakes[item.id]}/>}
  </>:<button className="button primary" type="button" onClick={()=>setShow(true)}>Reveal answer</button>}
  <div className="review-card-actions"><button type="button" className="button secondary" onClick={()=>onAdvance(false)}>Skip for now</button>{item.type==='question'&&<button type="button" className="button secondary" onClick={()=>openQuestion(item.question)}>Open source question</button>}</div>
 </article>;
}

const tabs=[['due','Due reviews',BookOpen],['queues','Saved queues',Save],['mistakes','Mistake log',NotebookPen],['variants','Daily variants',Repeat2]];
export function ReviewStudio({subject,formulas,questions,repeats,Rich,openQuestion,openQueue,openBank}){
 const state=useReview(subject);
 const [tab,setTab]=useState('due');
 const [session,setSession]=useState(null);
 const [reviewed,setReviewed]=useState(0);
 const items=new Map([
  ...formulas.map(f=>[formulaId(f),{id:formulaId(f),type:'formula',topic:f.topic,title:f.title,answer:f.equation,description:f.description}]),
  ...questions.map(q=>[questionId(q.id),{id:questionId(q.id),type:'question',question:q.id,topic:q.topic,title:q.question,prompt:q.qhtml,answer:q.ahtml}])
 ]);
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),15000);return ()=>clearInterval(timer);},[]);
 const available=[...items.values()].filter(item=>item.type==='formula'||state.cards[item.id]);
 const due=available.filter(item=>(state.cards[item.id]?.due??0)<=now);
 const mistakes=Object.entries(state.mistakes).filter(([id])=>items.has(id)).sort(([,a],[,b])=>Number(a.resolved)-Number(b.resolved)||b.misses-a.misses||b.updated-a.updated);
 const current=session?.length?items.get(session[0]):null;
 function start(){
  setReviewed(0);
  setSession(due.slice().sort((a,b)=>(state.cards[a.id]?.due??now)-(state.cards[b.id]?.due??now)).map(item=>item.id));
 }
 return <section className="review-studio">
  <header className="review-hero surface"><div><p className="eyebrow">ACTIVE RECALL</p><h1>Review Studio</h1><p>Recall formulas, revisit missed questions, and keep your own practice queues.</p></div><div className="review-count"><Layers3 size={21}/><b>{due.length}</b><span>Due now</span></div></header>
  <div className="review-tabs" role="group" aria-label="Review Studio sections">{tabs.map(([id,label,Icon])=><button key={id} type="button" className="button secondary" aria-pressed={tab===id} onClick={()=>setTab(id)}><Icon size={16}/> {label}</button>)}</div>
  {tab==='due'&&(current?<><p className="review-session-count">{reviewed} rated · {session.length} left <button className="button secondary" onClick={()=>setSession(null)}>End session</button></p><ReviewCard key={current.id} item={current} subject={subject} state={state} Rich={Rich} openQuestion={openQuestion} onAdvance={rated=>{if(rated)setReviewed(n=>n+1);setSession(s=>s.slice(1));}}/></>:
   <section className="review-card surface"><h2>{session?'Session complete':'Your next review'}</h2>{session&&<p>{reviewed} cards rated in this session.</p>}<p>{due.length?due.length+' cards ready. Unseen formulas are included automatically. Rate a worked question to add it to this deck.':'You’re caught up. More cards will appear as they come due.'}</p><button className="button primary" type="button" onClick={start} disabled={!due.length}>Start due review</button>{available.length>due.length&&<p>{available.length-due.length} cards scheduled for later.</p>}</section>)}
  {tab==='queues'&&<section className="review-card surface"><h2>Saved practice queues</h2><p>Save filters from the question bank, then reopen them here.</p><QueueList subject={subject} queues={state.queues} open={openQueue}/><button className="button secondary" onClick={openBank}>Open question bank</button></section>}
  {tab==='mistakes'&&<section className="review-card surface"><h2>Mistake log</h2><p>“Again” adds a card here automatically. Repeated misses rise to the top.</p>
   {!mistakes.length&&<p>No mistakes logged yet.</p>}
   <ul className="review-list">{mistakes.map(([id,entry])=>{const item=items.get(id);return <li key={id}><div><b>{item.title}</b><small>{entry.misses} missed{entry.resolved?' · Resolved':''}</small>{entry.note&&<p className="review-note-text">{entry.note}</p>}</div>{item.question&&<button className="button secondary" onClick={()=>openQuestion(item.question)}>Open</button>}<button className="button secondary" onClick={()=>resolveMistake(subject,id,!entry.resolved)}>{entry.resolved?'Reopen':'Resolve'}</button></li>;})}</ul></section>}
  {tab==='variants'&&<section className="review-card surface"><h2>Today’s variants</h2><p>One past-paper question per recurring exam family. Each family rotates daily.</p><ul className="review-list">{repeats.map((group,i)=>{
   const ids=[...new Set(group.refs)].filter(id=>items.has(questionId(id)));
   if(!ids.length)return null;
   const index=(localDay()+i)%ids.length;
   const item=items.get(questionId(ids[index]));
   return <li key={group.title}><div><b>{group.title}</b><small>Variant {index+1} / {ids.length}</small><p>{item.title}</p></div><button className="button secondary" onClick={()=>openQuestion(item.question)}>Open variant</button></li>;
  })}</ul></section>}
 </section>;
}
