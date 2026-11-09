
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {SubjectOverview} from '../subject-overview.jsx';
import {Activity, ArrowRight, BookmarkCheck, BookmarkMinus, ArrowUpRight, BookOpen, Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, CircuitBoard, ClipboardList, Clock3, FileText, FlaskConical, House, Layers3, Menu, Network, Orbit, RotateCcw, Search, Settings2, ShieldCheck, Sparkles, Split, SquareFunction, X} from 'lucide-react';
import data from './study-data.json';
import clips from './reward-clips.json';
import {labs, calculate} from './calculators.js';
import {Reward} from './reward.jsx';
import {MarkFilter,CopyQuestionLink,useSubjectRoute} from '../shared.jsx';
import {navigate,readRoute,progressEvent} from '../routing.mjs';

const {QS, SCANS:sourceScans, TOPICS, ORDER, REPEATS, NOTES, FORMULA_ENTRIES} = data;
const subject='cn';
const SCANS=Object.fromEntries(Object.entries(sourceScans).map(([paper,pages])=>[paper,pages.map(file=>file.replace('assets/','assets/cn/'))]));
const markValues=[...new Set(QS.map(q=>q.marks))].sort((a,b)=>a-b);
const byId = new Map(QS.map(q => [q.id, q]));
const papers = ['A25','A24','A23','A22'];
const year = paper => '20' + paper.slice(1);
const reference = q => year(q.paper) + ' Q' + q.ref;
const strip = value => value.replace(/<[^>]*>/g, ' ');
const matches = (query, ...values) => query.toLowerCase().trim().split(/\s+/).every(term => values.join(' ').toLowerCase().includes(term));
const mainNav = [
  ['overview','Overview',House], ['questions','Question bank',BookOpen], ['notes','Short notes',FileText],
  ['formula','Formula sheet',SquareFunction], ['repeats','Most repeated',RotateCcw],
  ['lab','Numerical lab',FlaskConical], ['plan','Revision plan',ClipboardList], ['settings','Settings',Settings2]
];
const topicIcons = [Activity,Network,ShieldCheck,Split,Layers3,Orbit,RotateCcw,Clock3,Activity,CircuitBoard];
const emptyFilters = {query:'',paper:'all',topic:'all',marks:'all',quiz:false,scope:'all'};
const plan = [
  ['Congestion and addressing',['2022/2023/2025 AIMD 10-round table','TCP header + timers + receive window','2025 equal subnets /26 and 2024 VLSM /21','2024 fragmentation & IPv4 header offset']],
  ['Error control and routing',['CRC: all 3 paper problems without peeking','2025 distance vector rounds 0→2','2024 Dijkstra full settled-node table','ALOHA and Stop-and-Wait utilization']],
  ['Application protocols and mock exam',['DNS iterative / recursive resolution','HTTP persistent vs nonpersistent','Email HTTPS→SMTP→POP3 and DHCP DORA','Timed 2025 paper: 10 one-mark + four 5+5 questions']]
];
function read(key, fallback) { try {return {...fallback,...JSON.parse(localStorage.getItem(key))};} catch {return fallback;} }
function write(key, value) { try {localStorage.setItem(key,JSON.stringify(value));} catch {} }
function changed(items,id) { return items.includes(id) ? items.filter(item=>item!==id) : [...items,id]; }
function Rich({html,className=''}) {return <div className={'rich '+className} dangerouslySetInnerHTML={{__html:html}}/>;}
function Heading({eyebrow,title,description,children}) {
  return <header className="section-heading flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description&&<p className="section-description">{description}</p>}</div>{children}</header>;
}
function SearchBox({value,onChange,label,placeholder}) {
  return <label className="search-field"><Search size={17}/><input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/></label>;
}
function TopicSelect({value,onChange,label='Topic'}) {
  return <select className="field" aria-label={label} value={value} onChange={e=>onChange(e.target.value)}><option value="all">All topics</option>{ORDER.map(t=><option key={t} value={t}>{TOPICS[t][0]}</option>)}</select>;
}
function Empty({children}) { return <p className="empty surface">{children}</p>; }

function Navigation({view,go,count}) {
  const [open,setOpen]=useState(false);
  const navigate = id => {setOpen(false);go(id);};
  return <aside className="rail">
    <button className="brand" onClick={()=>navigate('overview')} aria-label="Network Atlas home"><span className="brand-icon"><Network size={21}/></span><span><strong>Network Atlas</strong><small>COMPUTER NETWORKS</small></span></button>
    <button className="mobile-menu button secondary" aria-expanded={open} aria-controls="main-nav" onClick={()=>setOpen(!open)}>{open?<X size={18}/>:<Menu size={18}/>} Menu</button>
    <nav id="main-nav" className={open?'nav-open':''} aria-label="Study sections">
      {mainNav.map(([id,name,Icon],i)=><React.Fragment key={id}>{(i===0||i===4||i===7)&&<p className="nav-label">{i===0?'Study':i===4?'Practice':'Preferences'}</p>}<button type="button" aria-current={view===id?'page':undefined} className="nav-item" onClick={()=>navigate(id)}><Icon size={17}/>{name}</button></React.Fragment>)}
    </nav>
    <div className="rail-progress"><div className="flex justify-between gap-2"><span>Mastered</span><b>{count} / {QS.length}</b></div><progress aria-label="Question mastery" max={QS.length} value={count}/></div>
  </aside>;
}
const overviewTopics=ORDER.map((id,i)=>({id,title:TOPICS[id][0],description:TOPICS[id][1],Icon:topicIcons[i]}));
const overviewPapers=papers.map(id=>({id,label:'Autumn '+year(id),pages:SCANS[id].length}));
function Question({q,isOpen,toggle,quiz,mastered,saved,onMaster,onSave,onScan}) {
  const [revealed,setRevealed]=useState(false);
  const [copied,setCopied]=useState(false);
  const [copyError,setCopyError]=useState(false);
  async function copy() {try {await navigator.clipboard.writeText(q.question);setCopied(true);setCopyError(false);}catch {setCopyError(true);}}
  return <details id={'question-'+q.id} className={'question surface'+(mastered?' mastered':'')} open={isOpen} onToggle={e=>{if(e.currentTarget.open!==isOpen)toggle(q.id,e.currentTarget.open);}}>
    <summary><div><div className="question-meta"><span>{year(q.paper)} · Q{q.ref}</span><span>{q.marks} {q.marks===1?'mark':'marks'}</span>{mastered&&<span className="status"><Check size={13}/> Mastered</span>}{saved&&<span className="status saved-label"><BookmarkCheck size={13}/> Saved</span>}</div><Rich html={q.qhtml} className="question-text"/></div><ChevronDown className="question-chevron" size={19}/></summary>
    {isOpen&&<div className="answer-body">
      {q.tip&&<p className="exam-note"><strong>Exam note</strong> {q.tip}</p>}
      {quiz&&!revealed?<button className="button primary" onClick={()=>setRevealed(true)}>Reveal solution</button>:<Rich html={q.ahtml}/>}
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
function Questions({filters,setFilters,opened,setOpened,progress,onMaster,onSave,onScan,onFocusQuestion}) {
  const update=(key,value)=>setFilters(current=>({...current,[key]:value}));
  const results=QS.filter(q=>(filters.paper==='all'||q.paper===filters.paper)&&(filters.topic==='all'||q.topic===filters.topic)&&(filters.marks==='all'||(filters.marks==='long'?q.marks>=4:q.marks===Number(filters.marks)))&&(filters.scope!=='saved'||progress.saved.includes(q.id))&&(filters.scope!=='review'||!progress.done.includes(q.id))&&matches(filters.query,q.question,q.solution,reference(q),TOPICS[q.topic][0]));
  const active = Number(filters.quiz);
  return <>
    <Heading eyebrow="WORKED EXAM PAPERS" title="Question bank" description="Search questions and solutions across the 2022–2025 Autumn papers."><span className="meta-pill" aria-live="polite">{results.length} results</span></Heading>
    <div className="filters flex flex-wrap gap-2.5"><SearchBox value={filters.query} onChange={v=>update('query',v)} label="Search questions" placeholder="Search CRC, TCP, CIDR…"/><select className="field" value={filters.paper} aria-label="Exam year" onChange={e=>update('paper',e.target.value)}><option value="all">All papers</option>{papers.map(p=><option key={p} value={p}>Autumn {year(p)}</option>)}</select><TopicSelect value={filters.topic} onChange={v=>update('topic',v)}/></div>
    <div className="atlas-bank-controls"><MarkFilter values={markValues} marks={filters.marks} setMarks={v=>update('marks',v)}/><button className="button secondary atlas-shuffle" type="button" disabled={!results.length} onClick={()=>{const pool=results.filter(q=>!opened.includes(q.id));const items=pool.length?pool:results;onFocusQuestion(items[Math.floor(Math.random()*items.length)].id);}}>Shuffle question</button></div>
    <div className="study-scopes" role="group" aria-label="Question list">{[['all','All questions'],['review','To review'],['saved','Bookmarks']].map(([id,label])=><button className="scope-button" key={id} type="button" aria-pressed={filters.scope===id} onClick={()=>update('scope',id)}>{label}{id==='saved'&&<span>{progress.saved.length}</span>}</button>)}</div>
    <details className="study-filters"><summary>Study filters{active?' · '+active+' active':''}</summary><div className="flex flex-wrap items-center gap-x-5 gap-y-3">{[['quiz','Quiz mode']].map(([key,label])=><label key={key} className="check-label"><input type="checkbox" checked={filters[key]} onChange={e=>{if(key==='quiz')setOpened([]);update(key,e.target.checked);}}/>{label}</label>)}<button className="text-button" onClick={()=>setFilters(emptyFilters)}>Clear filters</button></div></details>
    {!results.length&&<Empty>{filters.scope==='saved'&&!progress.saved.length?'No bookmarks yet. Save a question to find it here.':'No matching questions. Try a different search or clear your filters.'}</Empty>}
    {ORDER.map(topic=>{const qs=results.filter(q=>q.topic===topic).sort((a,b)=>b.marks-a.marks||b.paper.localeCompare(a.paper));return !!qs.length&&<section key={topic} className="question-group"><h2>{TOPICS[topic][0]} <small>{qs.length}</small></h2>{qs.map(q=><Question key={q.id} q={q} isOpen={opened.includes(q.id)} toggle={(id,isOpen)=>setOpened(current=>isOpen?[...new Set([...current,id])]:current.filter(x=>x!==id))} quiz={filters.quiz} mastered={progress.done.includes(q.id)} saved={progress.saved.includes(q.id)} onMaster={onMaster} onSave={onSave} onScan={onScan}/>)}</section>;})}
  </>;
}

function Notes({openTopic}) {
  const [query,setQuery]=useState('');
  const [opened,setOpened]=useState([ORDER[0]]);
  const notes=NOTES.filter(n=>matches(query,n.text,TOPICS[n.topic][0]));
  return <><Heading eyebrow="THEORY" title="Short notes" description="Review the ideas, comparisons, and common exam traps for each chapter."/>
    <div className="filters flex flex-wrap gap-2.5"><SearchBox value={query} onChange={v=>{setQuery(v);setOpened(v?ORDER:[ORDER[0]]);}} label="Search notes" placeholder="Search short notes…"/><button className="button secondary" onClick={()=>setOpened(ORDER)}>Expand all</button><button className="button secondary" onClick={()=>setOpened([])}>Collapse all</button></div>
    {!notes.length&&<Empty>No matching notes.</Empty>}
    {notes.map(n=><details className="notes-section surface" key={n.topic} open={opened.includes(n.topic)} onToggle={e=>{const isOpen=e.currentTarget.open;setOpened(current=>isOpen===current.includes(n.topic)?current:changed(current,n.topic));}}><summary><span><b>{TOPICS[n.topic][0]}</b><small>{TOPICS[n.topic][1]}</small></span><ChevronDown size={18}/></summary>{opened.includes(n.topic)&&<div className="answer-body"><Rich html={n.html}/><button className="button secondary" onClick={()=>openTopic(n.topic)}>Practice this chapter <ArrowRight size={16}/></button></div>}</details>)}
  </>;
}
function Reference({id,openQuestion}) {const q=byId.get(id);return <button className="reference" onClick={()=>openQuestion(id)}>{reference(q)} <ArrowUpRight size={13}/></button>;}
function Formulas({openQuestion}) {
  const [query,setQuery]=useState('');
  const [topic,setTopic]=useState('all');
  const entries=FORMULA_ENTRIES.filter(f=>(topic==='all'||f.topic===topic)&&matches(query,f.title,strip(f.equation),f.description,TOPICS[f.topic][0],...f.refs.map(id=>reference(byId.get(id)))));
  return <><Heading eyebrow="QUICK REFERENCE" title="Formula sheet" description="Find an equation and jump straight to the paper question that uses it."><span className="meta-pill" aria-live="polite">{entries.length} formulas</span></Heading>
    <div className="filters flex flex-wrap gap-2.5"><SearchBox value={query} onChange={setQuery} label="Search formulas" placeholder="Search MTU, timeout, slow start…"/><TopicSelect value={topic} onChange={setTopic}/></div>
    {!entries.length&&<Empty>No formulas match those filters.</Empty>}
    {ORDER.map(t=>{const group=entries.filter(f=>f.topic===t);return !!group.length&&<section className="formula-group" key={t}><h2>{TOPICS[t][0]}</h2><div className="formula-grid">{group.map(f=><article className="formula-card surface" key={f.title}><h3>{f.title}</h3><Rich html={f.equation} className="equation"/><p>{f.description}</p><div className="flex flex-wrap gap-2">{f.refs.map(id=><Reference key={id} id={id} openQuestion={openQuestion}/>)}</div></article>)}</div></section>;})}
  </>;
}
function Repeats({openQuestion}) {
  return <><Heading eyebrow="EXAM PATTERNS" title="Most repeated" description="Recurring question types across the four papers, with links to each worked example."/><div className="formula-grid">{REPEATS.map(r=><article className="formula-card surface" key={r.title}><p className="eyebrow">{new Set(r.refs.map(id=>byId.get(id).paper)).size} / 4 PAPERS</p><h3>{r.title}</h3><p>{r.why}</p><div className="flex flex-wrap gap-2">{r.refs.map(id=><Reference key={id} id={id} openQuestion={openQuestion}/>)}</div></article>)}</div></>;
}
const defaults=lab=>Object.fromEntries(lab.fields.map(field=>[field.id,field.value]));
function LabForm({lab}) {
  const [values,setValues]=useState(()=>defaults(lab));
  const [result,setResult]=useState(()=>calculate(lab,defaults(lab)));
  function preset(overrides) {const next={...defaults(lab),...overrides};setValues(next);setResult(calculate(lab,next));}
  return <section className="lab-form surface"><h2>{lab.title}</h2><p>{lab.description}</p><form onSubmit={e=>{e.preventDefault();setResult(calculate(lab,values));}}><div className="lab-fields">{lab.fields.map(({id,label,items,type,min,max,step})=><label key={id}>{label}{items?<select className="field" value={values[id]} onChange={e=>setValues({...values,[id]:e.target.value})}>{items.map(i=><option key={i.value} value={i.value}>{i.label}</option>)}</select>:<input className="field" type={type||'text'} min={min} max={max} step={step||(type==='number'?'any':undefined)} value={values[id]} onChange={e=>setValues({...values,[id]:e.target.value})} required/>}</label>)}</div>
    <div className="flex flex-wrap gap-2"><button className="button primary" type="submit">Calculate <ArrowRight size={16}/></button>{lab.method==='runCSMA'&&<><button className="button secondary" type="button" onClick={()=>preset({csmaKm:2,csmaSpeed:2})}>2022 Q4(b)</button><button className="button secondary" type="button" onClick={()=>preset({csmaKm:2.5,csmaSpeed:2.3})}>2022 Q8(a)</button></>}</div>
  </form><div className="lab-result" aria-live="polite">{result.error?<p>{result.error}</p>:<Rich html={result.html}/>}</div></section>;
}
function Lab() {
  const [index,setIndex]=useState(0);
  return <><Heading eyebrow="INTERACTIVE PRACTICE" title="Numerical lab" description="Change the inputs and follow the intermediate steps for eight exam techniques."/><label className="lab-picker">Calculator<select aria-label="Calculator" className="field" value={index} onChange={e=>setIndex(+e.target.value)}>{labs.map((lab,i)=><option key={lab.method} value={i}>{lab.title}</option>)}</select></label><LabForm key={index} lab={labs[index]}/></>;
}
function Plan({checked,toggle}) {
  return <><Heading eyebrow="CHECKLIST" title="Revision plan" description="Three sessions covering the main exam techniques. Check off each task as you finish it."/><div className="plan-list">{plan.map(([title,tasks],i)=><section className="formula-card surface" key={title}><p className="eyebrow">SESSION 0{i+1}</p><h2>{title}</h2>{tasks.map((task,j)=>{const id='p'+i+j;return <label className="check-label" key={id}><input type="checkbox" checked={checked.includes(id)} onChange={()=>toggle(id)}/>{task}</label>;})}</section>)}</div></>;
}
function Settings({display,setDisplay,rewards,setRewards,preview,onReset,mastered}) {
  const [confirmReset,setConfirmReset]=useState(false);
  const [resetMessage,setResetMessage]=useState('');
  return <><Heading eyebrow="PREFERENCES" title="Settings" description="Choose a layout, a color theme, and how mastery rewards behave."/>
  <div className="settings-list">
    <section className="formula-card surface"><h2>Layout</h2><div className="choices">{[['original','Atlas','Navigation rail and dashboard overview'],['minimal','Minimalistic','Top navigation and a single study column']].map(([id,label,hint])=><button key={id} className="choice" aria-pressed={display.ui===id} onClick={()=>setDisplay({...display,ui:id})}><b>{label}</b><small>{hint}</small>{display.ui===id&&<Check size={17}/>}</button>)}</div></section>
    <section className="formula-card surface"><h2>Theme</h2><div className="choices">{[['dark','Dark'],['light','Light']].map(([id,label])=><button key={id} className="choice" aria-pressed={display.theme===id} onClick={()=>setDisplay({...display,theme:id})}><b>{label}</b>{display.theme===id&&<Check size={17}/>}</button>)}</div></section>
    <section className="formula-card surface"><h2>Mastery rewards</h2><label className="check-label"><input type="checkbox" checked={rewards} onChange={e=>setRewards(e.target.checked)}/>Play a reward after marking a question mastered</label><p>The first time you master a question, a random reward plays for five seconds with sparkle confetti. Re-marking the question updates your progress without replaying it. The background blurs and pauses interaction until the clip ends or you press Escape.</p><button className="button secondary" onClick={preview}><Sparkles size={17}/> Preview reward</button></section>
    <section className="formula-card surface"><h2>Mastery progress</h2><p>Reset the mastered questions and their reward history. Your bookmarks and revision checklist are kept.</p>
    {confirmReset?<div className="reset-confirm"><p id="reset-question">Reset all mastery progress?</p><div className="flex flex-wrap gap-2"><button className="button reset-button" onClick={()=>{onReset();setConfirmReset(false);setResetMessage('Mastery progress reset.');}}>Confirm reset</button><button className="button secondary" onClick={()=>setConfirmReset(false)}>Cancel</button></div></div>:<button className="button secondary" onClick={()=>{setResetMessage('');setConfirmReset(true);}}><RotateCcw size={16}/> Reset mastery</button>}
    <p role="status">{resetMessage||mastered+' questions mastered'}</p></section>
  </div></>;
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
  const [display,setDisplay]=useState(()=>read('cn-atlas-display-v1',{ui:'original',theme:'dark'}));
  const [progress,setProgress]=useState(()=>{
    const saved=read('cn-atlas-2025-v1',{done:[],saved:[],plan:[],sunnaEnabled:true});
    return {...saved,rewarded:[...new Set([...(saved.rewarded??[]),...saved.done])]};
  });
  const rewarded=useRef(new Set(progress.rewarded));
  const [filters,setFilters]=useState(emptyFilters);
  const [opened,setOpened]=useState([]);
  const [scan,setScan]=useState(null);
  const [reward,setReward]=useState(null);
  const [jump,setJump]=useState(null);
  const lastClip=useRef(null);
  const main=useRef(null);
  useLayoutEffect(()=>{document.documentElement.dataset.theme=display.theme;document.documentElement.dataset.layout=display.ui;write('cn-atlas-display-v1',display);},[display]);
  useEffect(()=>{write('cn-atlas-2025-v1',progress);window.dispatchEvent(new Event(progressEvent));},[progress]);
  useLayoutEffect(()=>{if(jump&&view==='questions'){const item=document.getElementById('question-'+jump);if(item){item.scrollIntoView({block:'start'});item.querySelector('summary').focus({preventScroll:true});}setJump(null);}},[jump,view]);
  useSubjectRoute(subject,route=>{
    const next=mainNav.some(([id])=>id===route.view)?route.view:'overview';
    setView(next);
    if(next==='questions'){
      const question=byId.get(route.question);
      if(question){
        setFilters({...emptyFilters,topic:question.topic});
        setOpened([question.id]);
        setJump(question.id);
      }else if(route.marks!=='all'||route.scope!=='all'){
        setFilters({...emptyFilters,marks:route.marks,scope:route.scope});
        setOpened([]);
      }
    }
  });
  function go(next,question) {
    setView(next);
    navigate(subject,next,question?{question}:undefined);
    window.scrollTo(0,0);
    main.current?.focus({preventScroll:true});
  }
  function openTopic(topic) {setFilters({...emptyFilters,topic});setOpened([]);go('questions');}
  function openQuestion(id) {setFilters({...emptyFilters,topic:byId.get(id).topic});setOpened([id]);go('questions',id);setJump(id);}
  function showReward() {
    const pool=clips.filter(name=>name!==lastClip.current);
    const clip=pool[Math.floor(Math.random()*pool.length)];
    lastClip.current=clip;
    setReward(clip);
  }
  function resetMastery() {
    rewarded.current.clear();
    setProgress(current=>({...current,done:[],rewarded:[]}));
  }
  function mark(id) {
    const firstMastery=!progress.done.includes(id)&&!rewarded.current.has(id);
    if(firstMastery)rewarded.current.add(id);
    setProgress(current=>({...current,done:changed(current.done,id),rewarded:[...rewarded.current]}));
    if(firstMastery&&progress.sunnaEnabled)showReward();
  }
  return <><a className="skip-link" href="#main-content">Skip to content</a><div className="atlas-shell">
    <Navigation view={view} go={go} count={progress.done.length}/>
    <main ref={main} id="main-content" tabIndex={-1}><div className="content atlas-page" key={view}>
      {view==='overview'&&<SubjectOverview subject={subject} questions={QS} topics={overviewTopics} papers={overviewPapers} go={go} openTopic={openTopic} openQuestion={openQuestion} openPaper={paper=>{setFilters({...emptyFilters,paper});setOpened([]);go('questions');}} done={progress.done} savedCount={progress.saved.length} openSaved={()=>{setFilters({...emptyFilters,scope:'saved'});go('questions');}}/>}
      {view==='questions'&&<Questions {...{filters,setFilters,opened,setOpened,progress}} onFocusQuestion={id=>{setOpened([id]);setJump(id);}} onMaster={mark} onSave={id=>setProgress(current=>({...current,saved:changed(current.saved,id)}))} onScan={setScan}/>}
      {view==='notes'&&<Notes openTopic={openTopic}/>}
      {view==='formula'&&<Formulas openQuestion={openQuestion}/>}
      {view==='repeats'&&<Repeats openQuestion={openQuestion}/>}
      {view==='lab'&&<Lab/>}
      {view==='plan'&&<Plan checked={progress.plan} toggle={id=>setProgress(current=>({...current,plan:changed(current.plan,id)}))}/>}
      {view==='settings'&&<Settings display={display} setDisplay={setDisplay} rewards={progress.sunnaEnabled} setRewards={sunnaEnabled=>setProgress(current=>({...current,sunnaEnabled}))} preview={showReward} onReset={resetMastery} mastered={progress.done.length}/>}
      <footer><span>Network Atlas</span><span>KIIT · Autumn papers 2022–2025</span></footer>
    </div></main></div>{scan&&<Scan scan={scan} setScan={setScan}/>}
    {reward&&<Reward key={reward} file={reward} onClose={()=>setReward(null)}/>}
  </>;
}

export function mount(container){const root=createRoot(container);flushSync(()=>root.render(<App/>));return ()=>root.unmount();}
