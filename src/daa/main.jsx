import {FilterGlow,StudyAction,StudyHeading,StudyScope,StudySelect,SubjectBranchNav} from '../subject-fx.jsx';
import {matchesQuestionType} from '../question-types.js';

import React, {useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {RevisionPlan} from '../revision-plan.jsx';
import {SubjectOverview} from '../subject-overview.jsx';
import {AtlasSettings} from '../settings.jsx';
import {FormulaSymbols} from '../formula-symbols.jsx';
import formulaDetails from './formula-details.json';
import {DiagramRich} from '../diagram-inspector.jsx';
import {useReadingTrail} from '../reading-trail.jsx';
import {PracticeQueues} from '../practice-queues.jsx';
import {PanelLeftClose,PanelLeftOpen} from 'lucide-react';
import {updatePreferences,useAtlasPreferences} from '../preferences.js';
import {Activity, ArrowRight, BookmarkCheck, BookmarkMinus, ArrowUpRight, BookOpen, Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, CircuitBoard, ClipboardList, Clock3, FileText, FlaskConical, House, Layers3, Menu, Network, Orbit, RotateCcw, Search, Settings2, ShieldCheck, Split, SquareFunction, X, GitBranch} from 'lucide-react';
import * as data from './course.mjs';
import clips from './reward-clips.json';
import {labs, calculate} from './calculators.js';
import {Reward} from '../reward.jsx';
import {useReward} from '../use-reward.js';
import {DailyVariants,QuestionTypeFilter,MarkFilter,CopyQuestionLink,useSubjectRoute} from '../shared.jsx';
import {navigate,readRoute,progressEvent,replaceQuestionType} from '../routing.mjs';

const {QS, SCANS:sourceScans, TOPICS, ORDER, REPEATS, NOTES, FORMULA_ENTRIES, PAPERS, DIAGRAMS} = data;
const subject='daa';
const SCANS=Object.fromEntries(Object.entries(sourceScans).map(([paper,pages])=>[paper,pages.map(file=>file.replace('assets/','assets/daa/'))]));
const markValues=[...new Set(QS.map(q=>q.marks))].sort((a,b)=>a-b);
const byId = new Map(QS.map(q => [q.id, q]));
const papers = ['E5','E3','E2','E4','E7','E6','E1'];
const year = paper => PAPERS[paper].label;
const reference = q => year(q.paper) + ' Q' + q.ref;
const strip = value => value.replace(/<[^>]*>/g, ' ');
const matches = (query, ...values) => query.toLowerCase().trim().split(/\s+/).every(term => values.join(' ').toLowerCase().includes(term));
const mainNav = [
  ['overview','Overview',House], ['questions','Question bank',BookOpen], ['notes','Lecture notes',FileText],
  ['formula','Formula sheet',SquareFunction], ['diagrams','Trace Studio',Network], ['repeats','Most repeated',RotateCcw],
  ['lab','Algorithm lab',FlaskConical], ['plan','Revision plan',ClipboardList], ['settings','Settings',Settings2]
];
const topicIcons = [Activity,Network,ShieldCheck,Split,Layers3,Orbit,RotateCcw,Clock3,Activity,CircuitBoard];
const emptyFilters = {query:'',paper:'all',topic:'all',marks:'all',type:'all',quiz:false,scope:'all'};
function read(key, fallback) { try {return {...fallback,...JSON.parse(localStorage.getItem(key))};} catch {return fallback;} }
function write(key, value) { try {localStorage.setItem(key,JSON.stringify(value));} catch {} }
function changed(items,id) { return items.includes(id) ? items.filter(item=>item!==id) : [...items,id]; }
function Rich({html,className=''}) {const key=useId().replace(/[^a-zA-Z0-9_-]/g,'');const scoped=html.replaceAll(/id="([\w-]+-(?:arrow|general|diamond|compose))"/g,(_,id)=>'id="'+key+'-'+id+'"').replaceAll(/url\(#([\w-]+-(?:arrow|general|diamond|compose))\)/g,(_,id)=>'url(#'+key+'-'+id+')');return <DiagramRich className={className} inspect={className!=='question-text'} html={scoped}/>;}
function Heading(props) {return <StudyHeading subject={subject} {...props}/>;}
function SearchBox({value,onChange,label,placeholder}) {
  return <label className="search-field"><Search size={17}/><input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/></label>;
}
const topicOptions=[{value:'all',label:'All topics'},...ORDER.map(value=>({value,label:TOPICS[value][0]}))];
function TopicSelect({value,onChange,label='Topic'}) {return <StudySelect options={topicOptions} {...{value,onChange,label}}/>;}
function Empty({children}) { return <p className="empty surface">{children}</p>; }

function TracePlayer({steps}){
  const [step,setStep]=useState(0);
  const [expanded,setExpanded]=useState(false);
  const shown=Math.min(step,steps.length-1);
  const next=n=>setStep(Math.min(steps.length-1,Math.max(0,n)));
  return <section className="trace-player" aria-label="Interactive algorithm trace">
    <button type="button" className="trace-toggle" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}><span className="trace-icon"><Activity size={17}/></span><span><strong>Interactive trace</strong><small>{steps.length} steps · inspect intermediate states</small></span><ChevronDown className={expanded?'trace-chevron open':'trace-chevron'} size={18}/></button>
    {expanded&&<div className="trace-inside">
      <div className="trace-controls">
        <button className="button secondary icon-only" aria-label="Previous trace step" disabled={shown===0} onClick={()=>next(shown-1)}><ChevronLeft size={18}/></button>
        <label className="trace-slider"><span aria-live="polite">Step {shown+1} / {steps.length}</span><input type="range" min={0} max={steps.length-1} value={shown} onChange={e=>next(+e.target.value)} aria-label="Trace step"/></label>
        <button className="button secondary icon-only" aria-label="Next trace step" disabled={shown===steps.length-1} onClick={()=>next(shown+1)}><ChevronRight size={18}/></button>
      </div>
      <div key={shown} className="trace-frame"><h4>{steps[shown].label}</h4><Rich html={steps[shown].html}/></div>
    </div>}
  </section>;
}

function Navigation({view,go,count,display}) {
  const [open,setOpen]=useState(false);
  const navigate = id => {setOpen(false);go(id);};
  return <aside className="rail">
    <button className="brand" onClick={()=>navigate('overview')} aria-label="DAA Atlas home"><span className="brand-icon"><GitBranch size={21}/></span><span><strong>DAA Atlas</strong><small>ALGORITHM WORKBENCH</small></span></button>
    <button className="mobile-menu button secondary" aria-expanded={open} aria-controls="main-nav" onClick={()=>setOpen(!open)}>{open?<X size={18}/>:<Menu size={18}/>} Menu</button>
    <SubjectBranchNav entries={mainNav} subject={subject} view={view} go={navigate}/>
    <nav id="main-nav" className={open?'nav-open':''} aria-label="Study sections">
      {mainNav.map(([id,name,Icon],i)=><React.Fragment key={id}>{(i===0||id==='diagrams'||id==='settings')&&<p className="nav-label">{i===0?'Study':id==='diagrams'?'Practice':'Preferences'}</p>}<button type="button" aria-current={view===id?'page':undefined} className="nav-item" aria-label={name} title={display.sidebar==='icons'?name:undefined} onClick={()=>navigate(id)}><Icon size={17}/><span>{name}</span></button></React.Fragment>)}
    </nav>
    <div className="rail-tools"><button type="button" className="rail-collapse" aria-label={display.sidebar==='icons'?'Expand sidebar':'Collapse sidebar'} title={display.sidebar==='icons'?'Expand sidebar':'Collapse sidebar'} onClick={()=>updatePreferences({sidebar:display.sidebar==='icons'?'expanded':'icons'})}>{display.sidebar==='icons'?<PanelLeftOpen size={16}/>:<PanelLeftClose size={16}/>}<span>Collapse sidebar</span></button></div>
    <div className="rail-progress"><div className="flex justify-between gap-2"><span>Mastered</span><b>{count} / {QS.length}</b></div><progress aria-label="Question mastery" max={QS.length} value={count}/></div>
  </aside>;
}
const overviewTopics=ORDER.map((id,i)=>({id,title:TOPICS[id][0],description:TOPICS[id][1],Icon:topicIcons[i]}));
const overviewPapers=papers.map(id=>({id,label:year(id),pages:SCANS[id].length}));
function Question({q,isOpen,toggle,quiz,mastered,saved,onMaster,onSave,onScan}) {
  const [revealed,setRevealed]=useState(false);
  const [copied,setCopied]=useState(false);
  const [copyError,setCopyError]=useState(false);
  async function copy() {try {await navigator.clipboard.writeText(q.question);setCopied(true);setCopyError(false);}catch {setCopyError(true);}}
  return <details id={'question-'+q.id} data-trail-title={q.question} className={'question surface'+(mastered?' mastered':'')} open={isOpen} onToggle={e=>{if(e.currentTarget.open!==isOpen)toggle(q.id,e.currentTarget.open);}}>
    <summary><div><div className="question-meta"><span>{year(q.paper)} · Q{q.ref}</span>{q.steps?.length>0&&<span className="trace-badge">Step trace</span>}<span>{q.marks} {q.marks===1?'mark':'marks'}</span>{mastered&&<span className="status"><Check size={13}/> Mastered</span>}{saved&&<span className="status saved-label"><BookmarkCheck size={13}/> Saved</span>}</div><Rich html={q.qhtml} className="question-text"/></div><ChevronDown className="question-chevron" size={19}/></summary>
    {isOpen&&<div className="answer-body">
      {q.tip&&<p className="exam-note"><strong>Exam note</strong> {q.tip}</p>}
      {quiz&&!revealed?<button className="button primary" onClick={()=>setRevealed(true)}>Reveal solution</button>:<>{q.steps?.length>0&&<TracePlayer key={q.id} steps={q.steps}/>}<h3 className="worked-label">Worked solution</h3><Rich html={q.ahtml}/></>}
      <div className="question-actions flex flex-wrap gap-2">
        <button className={'button '+(mastered?'secondary':'primary')} onClick={()=>onMaster(q.id)}>{mastered?<RotateCcw size={16}/>:<Check size={16}/>} {mastered?'Unmark mastery':'Mark mastered'}</button>
        <button className="button secondary" onClick={()=>onSave(q.id)}>{saved?<BookmarkMinus size={16}/>:<Bookmark size={16}/>} {saved?'Remove bookmark':'Bookmark'}</button>
        <button className="button secondary" onClick={()=>onScan(q)}><FileText size={16}/>Source scan</button>
        <CopyQuestionLink subject={subject} id={q.id}/>
        <button className="button secondary" onClick={copy}>{copied?'Copied':'Copy question'}</button>
      </div>{copyError&&<p role="status">Clipboard unavailable in this browser. Select the question text to copy it.</p>}
    </div>}
  </details>;
}
function Questions({filters,setFilters,opened,setOpened,progress,onMaster,onSave,onScan,onFocusQuestion,trail}) {
  const update=(key,value)=>setFilters(current=>({...current,[key]:value}));
  const results=QS.filter(q=>matchesQuestionType(subject,q.id,filters.type)&&(filters.paper==='all'||q.paper===filters.paper)&&(filters.topic==='all'||q.topic===filters.topic)&&(filters.marks==='all'||(filters.marks==='long'?q.marks>=4:q.marks===Number(filters.marks)))&&(filters.scope!=='saved'||progress.saved.includes(q.id))&&(filters.scope!=='review'||!progress.done.includes(q.id))&&matches(filters.query,q.question,q.solution,reference(q),TOPICS[q.topic][0]));
  const active = Number(filters.quiz);
  return <>
    <Heading eyebrow="WORKED EXAM PAPERS" title="Question bank" description="Filter seven exam papers by session or topic. Every solution links back to the original scan."><span className="meta-pill" aria-live="polite">{results.length} results</span></Heading>
    <FilterGlow subject={subject}><section className="workbench-filter-panel" aria-label="Question bank controls"><div className="filters flex flex-wrap gap-2.5"><SearchBox value={filters.query} onChange={v=>update('query',v)} label="Search questions" placeholder="Search LCS, Huffman, quicksort…"/><select className="field" value={filters.paper} aria-label="Exam year" onChange={e=>update('paper',e.target.value)}><option value="all">All papers</option>{papers.map(p=><option key={p} value={p}>{year(p)}</option>)}</select><TopicSelect value={filters.topic} onChange={v=>update('topic',v)}/></div>
    <div className="atlas-bank-controls"><MarkFilter values={markValues} marks={filters.marks} setMarks={v=>update('marks',v)}/><button className="button secondary atlas-shuffle" type="button" disabled={!results.length} onClick={()=>{const pool=results.filter(q=>!opened.includes(q.id));const items=pool.length?pool:results;onFocusQuestion(items[Math.floor(Math.random()*items.length)].id);}}>Shuffle question</button></div>
    <QuestionTypeFilter subject={subject} type={filters.type} setType={value=>{replaceQuestionType(subject,value);update('type',value);setOpened([]);}}/>
    <PracticeQueues subject={subject} filters={filters} apply={queue=>{replaceQuestionType(subject,queue.type);setFilters({...emptyFilters,...queue});setOpened([]);}}/>
    <StudyScope value={filters.scope} onChange={value=>update('scope',value)} options={[{value:'all',label:'All questions'},{value:'review',label:'Unmastered'},{value:'saved',label:'Bookmarks ('+progress.saved.length+')'}]}/>
    <details className="study-filters"><summary>Study filters{active?' · '+active+' active':''}</summary><div className="flex flex-wrap items-center gap-x-5 gap-y-3">{[['quiz','Quiz mode']].map(([key,label])=><label key={key} className="check-label"><input type="checkbox" checked={filters[key]} onChange={e=>{if(key==='quiz')setOpened([]);update(key,e.target.checked);}}/>{label}</label>)}<button className="text-button" onClick={()=>{replaceQuestionType(subject,'all');setFilters(emptyFilters);}}>Clear filters</button></div></details>
    </section></FilterGlow>
    {!results.length&&<Empty>{filters.scope==='saved'&&!progress.saved.length?'No bookmarks yet. Save a question to find it here.':'No matching questions. Try a different search or clear your filters.'}</Empty>}
    {ORDER.map(topic=>{const qs=results.filter(q=>q.topic===topic).sort((a,b)=>b.marks-a.marks||papers.indexOf(a.paper)-papers.indexOf(b.paper));return !!qs.length&&<section key={topic} className="question-group"><h2>{TOPICS[topic][0]} <small>{qs.length}</small></h2>{qs.map(q=><Question key={q.id} q={q} isOpen={opened.includes(q.id)} toggle={(id,isOpen)=>{if(isOpen)trail.visit('question',id,q.question);else trail.close('question',id);setOpened(current=>isOpen?[...new Set([...current,id])]:current.filter(x=>x!==id));}} quiz={filters.quiz} mastered={progress.done.includes(q.id)} saved={progress.saved.includes(q.id)} onMaster={onMaster} onSave={onSave} onScan={onScan}/>)}</section>;})}
  </>;
}

function Notes({openTopic,noteRequest,trail}) {
  const [query,setQuery]=useState('');
  const [opened,setOpened]=useState(()=>[noteRequest?.id??ORDER[0]]);
  const handled=useRef(null);
  useLayoutEffect(()=>{if(noteRequest){setQuery('');setOpened([noteRequest.id]);}},[noteRequest]);
  const canJump=noteRequest&&opened.includes(noteRequest.id)&&!query;
  useLayoutEffect(()=>{
    if(!canJump||handled.current===noteRequest)return;
    handled.current=noteRequest;
    trail.visit('note',noteRequest.id,TOPICS[noteRequest.id][0],{restore:noteRequest.resume,jump:true});
  },[noteRequest,canJump]);
  const notes=NOTES.filter(n=>matches(query,n.text,TOPICS[n.topic][0]));
  return <><Heading eyebrow="THEORY" title="Lecture notes" description="Read the algorithms in order, with invariants, worked examples and figures from your lecture slides."/>
    <div className="filters flex flex-wrap gap-2.5"><SearchBox value={query} onChange={v=>{setQuery(v);setOpened(v?ORDER:[ORDER[0]]);}} label="Search notes" placeholder="Search lecture notes…"/><button className="button secondary" onClick={()=>setOpened(ORDER)}>Expand all</button><button className="button secondary" onClick={()=>setOpened([])}>Collapse all</button></div>
    {!notes.length&&<Empty>No matching notes.</Empty>}
    {notes.map(n=><details className="notes-section surface" id={'note-'+n.topic} data-trail-title={TOPICS[n.topic][0]} key={n.topic} open={opened.includes(n.topic)} onToggle={e=>{const isOpen=e.currentTarget.open;if(isOpen!==opened.includes(n.topic)){if(isOpen)trail.visit('note',n.topic,TOPICS[n.topic][0]);else trail.close('note',n.topic);setOpened(current=>isOpen===current.includes(n.topic)?current:changed(current,n.topic));}}}><summary><span><b>{TOPICS[n.topic][0]}</b><small>{TOPICS[n.topic][1]}</small></span><ChevronDown size={18}/></summary>{opened.includes(n.topic)&&<div className="answer-body"><Rich html={n.html}/><button className="button secondary" onClick={()=>openTopic(n.topic)}>Practice this chapter <ArrowRight size={16}/></button></div>}</details>)}
  </>;
}
function Reference({id,openQuestion}) {const q=byId.get(id);return <button className="reference" onClick={()=>openQuestion(id)}>{reference(q)} <ArrowUpRight size={13}/></button>;}
function Formulas({openQuestion}) {
  const [query,setQuery]=useState('');
  const [topic,setTopic]=useState('all');
  const entries=FORMULA_ENTRIES.filter(f=>(topic==='all'||f.topic===topic)&&matches(query,f.title,strip(f.equation),f.description,TOPICS[f.topic][0],...f.refs.map(id=>reference(byId.get(id)))));
  return <><Heading eyebrow="QUICK REFERENCE" title="Formula sheet" description="Find an equation and jump straight to the paper question that uses it."><span className="meta-pill" aria-live="polite">{entries.length} formulas</span></Heading>

    <div className="filters flex flex-wrap gap-2.5"><SearchBox value={query} onChange={setQuery} label="Search formulas" placeholder="Search recurrences, knapsack, paths…"/><TopicSelect value={topic} onChange={setTopic}/></div>
    {!entries.length&&<Empty>No formulas match those filters.</Empty>}
    {ORDER.map(t=>{const group=entries.filter(f=>f.topic===t);return !!group.length&&<section className="formula-group" key={t}><h2>{TOPICS[t][0]}</h2><div className="formula-grid">{group.map(f=><article className="formula-card surface" key={f.title}><h3>{f.title}</h3><FormulaSymbols equation={f.equation} details={formulaDetails[f.title]}/><p>{f.description}</p><div className="flex flex-wrap gap-2">{f.refs.map(id=><Reference key={id} id={id} openQuestion={openQuestion}/>)}</div></article>)}</div></section>;})}
  </>;
}
function Repeats({openQuestion}) {
  return <><Heading eyebrow="EXAM PATTERNS" title="Most repeated" description="Recurring question types across the seven papers, with links to each worked example."/><DailyVariants groups={REPEATS} questions={byId} openQuestion={openQuestion}/><div className="formula-grid">{REPEATS.map(r=><article className="formula-card surface" key={r.title}><p className="eyebrow">{new Set(r.refs.map(id=>byId.get(id).paper)).size} / 7 PAPERS</p><h3>{r.title}</h3><p>{r.why}</p><div className="flex flex-wrap gap-2">{r.refs.map(id=><Reference key={id} id={id} openQuestion={openQuestion}/>)}</div></article>)}</div></>;
}
const defaults=lab=>Object.fromEntries(lab.fields.map(field=>[field.id,field.value]));

function Diagrams({openQuestion}) {
  const [query,setQuery]=useState('');
  const [topic,setTopic]=useState('all');
  const [selected,setSelected]=useState('E5-2(b)');
  const [zoom,setZoom]=useState(1);
  const [fit,setFit]=useState(false);
  const diagrams=DIAGRAMS.filter(d=>(topic==='all'||topic===d.topic)&&matches(query,d.title,TOPICS[d.topic][0],byId.get(d.ref).question));
  const current=diagrams.find(d=>d.id===selected)??diagrams[0];
  return <><Heading eyebrow="VISUAL REVISION" title="Trace Studio" description="Explore recursion trees, Huffman codes, heap states and weighted graphs. Zoom in or step through the trace."/><div className="filters flex flex-wrap gap-2.5"><SearchBox value={query} onChange={setQuery} label="Search diagrams" placeholder="Search recursion trees, heaps, graphs…"/><TopicSelect value={topic} onChange={setTopic}/></div>
  {current?<div className="diagram-studio"><aside className="diagram-picker surface" aria-label="Choose a diagram"><span className="studio-kicker">{diagrams.length} DIAGRAMS</span>{diagrams.map(d=><button key={d.id} aria-current={d.id===current.id?'true':undefined} onClick={()=>{setSelected(d.id);setZoom(1);setFit(false);}}><strong>{d.label}</strong><small>{reference(byId.get(d.ref))}</small></button>)}</aside><section className="diagram-panel surface"><div className="diagram-toolbar"><Reference id={current.ref} openQuestion={openQuestion}/><div className="zoom-control" role="group" aria-label="Diagram zoom"><button type="button" aria-label="Zoom out" disabled={!fit&&zoom<=.7} onClick={()=>{setFit(false);setZoom(z=>Math.max(.7,z-.2));}}>−</button><span aria-live="polite">{fit?'Fit':Math.round(zoom*100)+'%'}</span><button type="button" aria-label="Zoom in" disabled={!fit&&zoom>=1.8} onClick={()=>{setFit(false);setZoom(z=>Math.min(1.8,z+.2));}}>+</button><button type="button" className="fit-diagram" aria-pressed={fit} onClick={()=>setFit(v=>!v)}>Fit</button></div></div><div className={fit?'diagram-fit':undefined} style={{'--se-zoom':zoom}}><Rich key={current.id} html={current.html}/>{current.steps?.length>0&&<TracePlayer key={current.id} steps={current.steps}/>}</div></section></div>:<Empty>No matching diagrams.</Empty>}</>;
}
function LabForm({lab}) {
  const [values,setValues]=useState(()=>defaults(lab));
  const [result,setResult]=useState(()=>calculate(lab,defaults(lab)));
  return <section className="lab-form surface"><h2>{lab.title}</h2><p>{lab.description}</p><form onSubmit={e=>{e.preventDefault();setResult(calculate(lab,values));}}><div className="lab-fields">{lab.fields.map(({id,label,items,type,min,max,step})=><label key={id}>{label}{items?<select className="field" value={values[id]} onChange={e=>setValues({...values,[id]:e.target.value})}>{items.map(i=><option key={i.value} value={i.value}>{i.label}</option>)}</select>:<input className="field" type={type||'text'} min={min} max={max} step={step||(type==='number'?'any':undefined)} value={values[id]} onChange={e=>setValues({...values,[id]:e.target.value})} required/>}</label>)}</div>
    <div className="flex flex-wrap gap-2"><StudyAction type="submit">Calculate <ArrowRight size={16}/></StudyAction></div>
  </form><div className="lab-result" aria-live="polite">{result.error?<p>{result.error}</p>:<><Rich html={result.html}/>{result.steps?.length>0&&<TracePlayer key={JSON.stringify(result.value??result.steps[0])} steps={result.steps}/>}</>}</div></section>;
}
function Lab() {
  const [index,setIndex]=useState(0);
  return <><Heading eyebrow="INTERACTIVE PRACTICE" title="Algorithm lab" description="Edit the inputs and inspect the same step-by-step traces used in the worked answers."/><label className="lab-picker">Calculator<select aria-label="Calculator" className="field" value={index} onChange={e=>setIndex(+e.target.value)}>{labs.map((lab,i)=><option key={lab.method} value={i}>{lab.title}</option>)}</select></label><LabForm key={index} lab={labs[index]}/></>;
}
function Scan({scan,setScan}) {
  const dialog=useRef(null);
  useLayoutEffect(()=>{const node=dialog.current;node.showModal();return ()=>{if(node.open)node.close();};},[]);
  const scans=SCANS[scan.paper];
  const move=delta=>setScan({...scan,page:Math.max(1,Math.min(scans.length,scan.page+delta))});
  return <dialog className="scan-dialog" aria-label="Original exam page" ref={dialog} onCancel={e=>{e.preventDefault();setScan(null);}} onClick={e=>{if(e.target===e.currentTarget)setScan(null);}}><div className="scan-shell"><header><b>{year(scan.paper)} · Page {scan.page} of {scans.length}</b><div className="flex items-center gap-2"><button className="button secondary icon-only" aria-label="Previous page" disabled={scan.page===1} onClick={()=>move(-1)}><ChevronLeft size={18}/></button><button className="button secondary icon-only" aria-label="Next page" disabled={scan.page===scans.length} onClick={()=>move(1)}><ChevronRight size={18}/></button><button className="button secondary icon-only" aria-label="Close scan" onClick={()=>setScan(null)}><X size={18}/></button></div></header><div className="scan-scroll"><img src={scans[scan.page-1]} alt={'Original '+year(scan.paper)+' exam scan, page '+scan.page}/></div></div></dialog>;
}
function App() {
  const [view,setView]=useState(()=>{const v=readRoute().view;return mainNav.some(([id])=>id===v)?v:'overview';});
  const display=useAtlasPreferences();
  const [progress,setProgress]=useState(()=>{
    const saved=read('daa-atlas-progress-v1',{done:[],saved:[],plan:[]});
    return {...saved,rewarded:[...new Set([...(saved.rewarded??[]),...saved.done])]};
  });
  const rewarded=useRef(new Set(progress.rewarded));
  const [filters,setFilters]=useState(emptyFilters);
  const [opened,setOpened]=useState([]);
  const [scan,setScan]=useState(null);
  const {reward,play:showReward,close:closeReward}=useReward(clips);
  const [jump,setJump]=useState(null);
  const [noteRequest,setNoteRequest]=useState(null);
  const trail=useReadingTrail(subject,view);
  const main=useRef(null);
  useEffect(()=>{write('daa-atlas-progress-v1',progress);window.dispatchEvent(new Event(progressEvent));},[progress]);
  useLayoutEffect(()=>{if(jump&&view==='questions'){trail.visit('question',jump.id,byId.get(jump.id).question,{restore:jump.resume,jump:true});setJump(null);}},[jump,view]);
  useSubjectRoute(subject,route=>{
    const next=mainNav.some(([id])=>id===route.view)?route.view:'overview';
    setView(next);
    if(next==='notes')setNoteRequest(NOTES.some(n=>n.topic===route.note)?{id:route.note,resume:route.resume}:null);
    if(next==='questions'){
      const question=byId.get(route.question);
      if(question){
        setFilters({...emptyFilters,topic:question.topic});
        setOpened([question.id]);
        setJump({id:question.id,resume:route.resume});
      }else if(route.marks!=='all'||route.scope!=='all'||route.type!=='all'){
        setFilters({...emptyFilters,marks:route.marks,scope:route.scope,type:route.type});
        setOpened([]);
      }
    }
  });
  function go(next,question,options) {
    trail.save();
    setView(next);
    navigate(subject,next,question?{question}:options);
    window.scrollTo(0,0);
    main.current?.focus({preventScroll:true});
  }
  function openTopic(topic) {setFilters({...emptyFilters,topic});setOpened([]);go('questions');}
  function openQuestion(id) {setFilters({...emptyFilters,topic:byId.get(id).topic});setOpened([id]);go('questions',id);setJump({id});}
  function resetMastery() {
    rewarded.current.clear();
    setProgress(current=>({...current,done:[],rewarded:[]}));
  }
  function mark(id) {
    const firstMastery=!progress.done.includes(id)&&!rewarded.current.has(id);
    if(firstMastery)rewarded.current.add(id);
    setProgress(current=>({...current,done:changed(current.done,id),rewarded:[...rewarded.current]}));
    if(firstMastery&&display.rewards)showReward();
  }
  return <><a className="skip-link" href="#main-content">Skip to content</a><div className="atlas-shell">
    <Navigation display={display} view={view} go={go} count={progress.done.length}/>
    <main ref={main} id="main-content" tabIndex={-1}><div className="content atlas-page" key={view}>
      {view==='overview'&&<SubjectOverview subject={subject} questions={QS} topics={overviewTopics} papers={overviewPapers} go={go} openTopic={openTopic} openQuestion={openQuestion} openNumericals={()=>go('questions',null,{type:'numerical'})} openPaper={paper=>{setFilters({...emptyFilters,paper});setOpened([]);go('questions');}} done={progress.done} savedCount={progress.saved.length} openSaved={()=>{setFilters({...emptyFilters,scope:'saved'});go('questions');}}/>}
      {view==='questions'&&<Questions {...{filters,setFilters,opened,setOpened,progress,trail}} onFocusQuestion={id=>{setOpened([id]);setJump({id});}} onMaster={mark} onSave={id=>setProgress(current=>({...current,saved:changed(current.saved,id)}))} onScan={setScan}/>}
      {view==='notes'&&<Notes openTopic={openTopic} noteRequest={noteRequest} trail={trail}/>}
      {view==='formula'&&<Formulas openQuestion={openQuestion}/>}
      {view==='repeats'&&<Repeats openQuestion={openQuestion}/>}
      {view==='lab'&&<Lab/>}
      {view==='diagrams'&&<Diagrams openQuestion={openQuestion}/>}
      {view==='plan'&&<RevisionPlan Heading={Heading} topics={overviewTopics} questions={QS} papers={overviewPapers} repeats={REPEATS} done={progress.done} openTopic={openTopic} openQuestion={openQuestion} reference={reference} checked={progress.plan} toggle={id=>setProgress(current=>({...current,plan:changed(current.plan,id)}))}/>}
      {view==='settings'&&<AtlasSettings Heading={Heading} clips={clips} display={display} setDisplay={updatePreferences} rewards={display.rewards} setRewards={rewards=>updatePreferences({rewards})} preview={showReward} onReset={resetMastery} mastered={progress.done.length}/>}
      <footer><span>DAA Atlas</span><span>Spring & Autumn papers 2022–2025</span></footer>
    </div></main></div>{scan&&<Scan scan={scan} setScan={setScan}/>}
    {reward&&<Reward key={reward.version} item={reward} onClose={closeReward}/>}
  </>;
}

export function mount(container){const root=createRoot(container);flushSync(()=>root.render(<App/>));return ()=>root.unmount();}
