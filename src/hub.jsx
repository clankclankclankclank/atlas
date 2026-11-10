import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Activity,ArrowDownRight,ArrowRight,ArrowUpRight,Bookmark,BookOpen,Calculator,ChevronRight,Layers3,Network,Search,Settings2,Compass,GitBranch,X} from 'lucide-react';
import {RevealLine,SignalPath,trackSpotlight} from './visual-effects.jsx';
import {index,totals} from './generated-index.mjs';
import {RecentTrail} from './reading-trail.jsx';
import {Clock3} from 'lucide-react';
import {migratePracticeQueues} from './practice-queue-store.js';
import {useAtlasPreferences} from './preferences.js';
import {getStudyProgress,linkTo,navigate,observeRoute,progressEvent,readRoute} from './routing.mjs';

const subjects={
 daa:{abbr:'DAA',title:'Design & Analysis of Algorithms',short:'Algorithms',tag:'Recursion, DP, graphs',tone:'#8fe5ee',light:'#17667e',icon:GitBranch,global:'AtlasDAA'},
 cn:{abbr:'CN',title:'Computer Networks',short:'Networks',tag:'Layers, routing, protocols',tone:'#b5b3ff',light:'#573ca1',icon:Network,global:'AtlasCN'},
 ee:{abbr:'EE',title:'Engineering Economics',short:'Economics',tag:'Cash flows, markets, decisions',tone:'#f8bc79',light:'#8a501a',icon:Calculator,global:'AtlasEE'},
 se:{abbr:'SE',title:'Software Engineering',short:'Software',tag:'Models, testing, estimation',tone:'#acd9ab',light:'#216644',icon:Layers3,global:'AtlasSE'}
};
const subjectEntries=Object.entries(subjects);
const lastKey='study-atlas-last-route';
const savedRoute=()=>{try{return localStorage.getItem(lastKey)||'';}catch{return '';}};
const remember=hash=>{try{localStorage.setItem(lastKey,hash);}catch{}};
const persistedSubject=()=>{const r=readRoute(savedRoute());return subjects[r.subject]?r:null;};
const hrefFor=q=>linkTo(q.subject,'questions',{question:q.id});
function smartLink(e){
 if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;
 const route=readRoute(e.currentTarget.hash);
 e.preventDefault();navigate(route.subject,route.view,route);
}

function Header({shown,pending,view,showSearch,showRecent}){
 const settingsSubject=subjects[shown]?shown:persistedSubject()?.subject??'daa';
 return <header className="atlas-top" data-switching={pending ? 'true' : undefined}><div className="atlas-top-inner">
  <a href="#/" onClick={smartLink} className="atlas-brand" aria-label="Study Atlas home"><span className="atlas-brand-icon"><Compass size={20}/></span><span>Study Atlas</span></a>
  <nav aria-label="Subjects" className="atlas-subnav">
   {subjectEntries.map(([id,course])=><a key={id} href={linkTo(id)} onClick={smartLink} style={{'--subject-accent':course.tone}} aria-current={shown===id?'page':undefined} data-pending={pending===id?'true':undefined} onPointerEnter={()=>warmSubject(id)} onFocus={()=>warmSubject(id)}><course.icon size={13} aria-hidden="true"/>{course.abbr}</a>)}
  </nav>
  <div className="atlas-top-actions"><button type="button" className="atlas-global-settings atlas-history-open" aria-label="Recently opened" title="Recently opened" onClick={showRecent}><Clock3 size={17}/></button><a className="atlas-global-settings" href={linkTo(settingsSubject,'settings')} onClick={smartLink} aria-label="Atlas settings" aria-current={view==='settings'?'page':undefined}><Settings2 size={17}/></a><button type="button" className="atlas-search-open" onClick={()=>showSearch('all')} aria-label="Search all subjects"><Search size={18}/><span>Find a question</span><kbd>Ctrl K</kbd></button></div>
 </div></header>;
}

function HeroMap({active,setActive}){
 const points=[[82,68],[358,68],[82,214],[358,214]];
 const course=subjects[active];
 return <div className="hub-map" aria-label="Choose a subject to preview" style={{'--map-active':course.tone,'--map-active-light':course.light}}>
  <div className="hub-map-head"><span><i/> SUBJECT MAP</span><span>01–04 / ATLAS</span></div>
  <div className="hub-map-body">
   <svg viewBox="0 0 440 280" aria-hidden="true">
    <defs><pattern id="hub-grid" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="currentColor" opacity=".25"/></pattern></defs>
    <rect width="440" height="280" fill="url(#hub-grid)"/>
    <path className="hub-map-crosshair" d="M220 20V260M20 140H420"/>
    <circle cx="220" cy="140" r="105" className="hub-orbit"/>
    <circle cx="220" cy="140" r="77" className="hub-orbit hub-orbit-secondary"/>
    <circle cx="220" cy="140" r="48" className="hub-orbit"/>
    <path className="hub-map-ticks" d="M220 32v12m0 192v12m-108-108h12m192 0h12M144 64l8 8m136 136 8 8m-152 0 8-8m136-136 8-8"/>
    {subjectEntries.map(([id],j)=>{const [x,y]=points[j];return <SignalPath key={id} path={'M220 140H'+(x<220?149:291)+'L'+(x<220?112:328)+' '+y+'H'+x} active={active===id}/>;})}
    <circle cx="220" cy="140" r="33" className="hub-map-core"/>
    <path d="M235 125l-9 21-21 9 9-21Z" className="hub-map-glyph"/>
    <circle cx="220" cy="140" r="3" className="hub-map-dot"/>
   </svg>
   {subjectEntries.map(([id,item],j)=>{const [x,y]=points[j],Icon=item.icon;return <button key={id} type="button" className="hub-map-node" style={{left:(x/440*100)+'%',top:(y/280*100)+'%','--map-tone':item.tone,'--map-tone-light':item.light}} aria-pressed={active===id} onClick={()=>setActive(id)}><Icon size={16}/><b>{item.abbr}</b></button>;})}
  </div>
  <div className="hub-map-foot"><div key={active} className="hub-map-selection" aria-live="polite"><b>{course.short}</b><span>{course.tag}</span></div><a href={linkTo(active)} onClick={smartLink}>Open {course.abbr} <ArrowUpRight size={15}/></a></div>
 </div>;
}
function SubjectGlyph({subject}){
 const art={
  daa:<><path d="M90 24v25m0 0-52 40m52-40 52 40m-52-40v40"/><circle cx="90" cy="21" r="8"/><circle cx="38" cy="92" r="8"/><circle cx="90" cy="92" r="8"/><circle cx="142" cy="92" r="8"/></>,
  cn:<><path d="M24 77h40l27-45h55M64 77h44l33 22M91 32l17 45"/>{[[24,77],[64,77],[91,32],[146,32],[108,77],[141,99]].map(([x,y])=><circle key={x+':'+y} cx={x} cy={y} r="6"/>)}</>,
  ee:<><path d="M20 101h139M24 101V21m22 67 34-19 26-28 44-19"/>{[[46,88],[80,69],[106,41],[150,22]].map(([x,y])=><circle key={x} cx={x} cy={y} r="5"/>)}</>,
  se:<><rect x="64" y="17" width="52" height="28" rx="5"/><rect x="21" y="79" width="52" height="28" rx="5"/><rect x="107" y="79" width="52" height="28" rx="5"/><path d="M90 45v18H47v16m43-16h43v16"/></>
 };
 return <svg className="hub-card-art" viewBox="0 0 180 125" aria-hidden="true">{art[subject]}</svg>;
}
function Home({progress,showSearch}){
 const last=persistedSubject();
 const [active,setActive]=useState(last?.subject??'daa');
 const done=index.filter(q=>progress[q.subject].done.has(q.id)).length;
 const saved=index.filter(q=>progress[q.subject].saved.has(q.id)).length;
 const countPapers=Object.values(totals).reduce((n,x)=>n+x.papers,0);
 return <main className="study-hub" id="hub-main" tabIndex={-1}>
  <section className="hub-hero">
   <div className="hub-hero-copy"><p className="hub-kicker"><span></span> PAST-PAPER STUDY</p>
    <h1 aria-label="Study Atlas"><RevealLine>Study</RevealLine><RevealLine delay={85} accent>Atlas.</RevealLine></h1>
    <p className="hub-description">Past papers, worked solutions, and practice tools across four subjects.</p>
    <div className="hub-hero-actions">{last?<a className="hub-action hub-primary" href={savedRoute()} onClick={smartLink}>Resume {subjects[last.subject].abbr} <ArrowRight size={17}/></a>:<a className="hub-action hub-primary" href="#/daa" onClick={smartLink}>Start studying <ArrowRight size={17}/></a>}<button type="button" className="hub-action" onClick={()=>showSearch('all')}><Search size={16}/> Find a question</button></div>
   </div>
   <HeroMap active={active} setActive={setActive}/>
  </section>
  <section className="hub-stat-strip" aria-label="Study Atlas statistics">{[[index.length,'worked questions'],[countPapers,'exam papers'],[done,'mastered'],[saved,'bookmarks']].map(([number,label])=><div key={label}><b>{number}</b><span>{label}</span></div>)}</section>
  <section className="hub-collection" aria-labelledby="subjects-heading"><header className="hub-section-head"><div><p className="hub-kicker">01 / SUBJECTS</p><h2 id="subjects-heading">Choose a workbench</h2></div></header>
   <div className="hub-cards">{subjectEntries.map(([id,course],j)=>{
    const Icon=course.icon,stats=totals[id],mastered=index.filter(q=>q.subject===id&&progress[id].done.has(q.id)).length;
    return <article className="hub-card" key={id} onPointerMove={trackSpotlight} style={{'--card-tone':course.tone,'--card-light':course.light,'--card-delay':j*48+'ms'}}>
     <SubjectGlyph subject={id}/><div className="hub-card-meta"><span className="hub-card-icon"><Icon size={22}/></span><span>{course.abbr} <b>0{j+1}</b></span></div>
     <h3><a href={linkTo(id)} onClick={smartLink}>{course.title}<ArrowUpRight size={18}/></a></h3>
     <p>{course.tag}</p>
     <div className="hub-card-progress"><span>{mastered} / {stats.questions} mastered</span><progress aria-label={course.abbr+' mastery'} max={stats.questions} value={mastered}/></div>
     <div className="hub-card-actions"><a href={linkTo(id,'questions')} onClick={smartLink}>Question bank <ChevronRight size={14}/></a><a href={linkTo(id,'questions',{marks:'1'})} onClick={smartLink}>1-mark drill <ChevronRight size={14}/></a></div>
    </article>;
   })}</div>
  </section>
  <section className="hub-shortcuts" aria-labelledby="shortcuts-heading"><header className="hub-section-head"><div><p className="hub-kicker">02 / QUICK ACCESS</p><h2 id="shortcuts-heading">Get straight to the work</h2></div></header>
   <div className="hub-shortcut-grid">
    <a href={linkTo('ee','questions',{marks:'long'})} onClick={smartLink}><Calculator size={20}/><span><b>EE worked solutions</b><small>64 rewritten long answers with formulas, tables, and a step player.</small></span><ArrowDownRight size={17}/></a>
    <a href={linkTo('daa','diagrams')} onClick={smartLink}><BookOpen size={20}/><span><b>DAA Trace Studio</b><small>Step through recursion, Huffman, and graph diagrams.</small></span><ArrowDownRight size={17}/></a>
    <button type="button" onClick={()=>showSearch('saved')}><Bookmark size={20}/><span><b>All bookmarks</b><small>Open saved questions across all four subjects.</small></span><ArrowDownRight size={17}/></button>
   </div>
  </section>
  <footer className="hub-footer"><span>Study Atlas</span><span>Algorithms · Networks · Economics · Software</span></footer>
 </main>;
}

const tokens=value=>value.toLowerCase().trim().split(/\s+/).filter(Boolean);
function Finder({mode,close,progress}){
 const dialog=useRef(null), input=useRef(null);
 const [query,setQuery]=useState('');
 const [scope,setScope]=useState(mode);
 const [active,setActive]=useState('all');
 const [marks,setMarks]=useState('all');
 const [limit,setLimit]=useState(30);
 useLayoutEffect(()=>{
  const el=dialog.current,trigger=document.activeElement;
  el.showModal();input.current.focus();
  return ()=>{if(el.open)el.close();if(trigger instanceof HTMLElement&&trigger.isConnected)trigger.focus({preventScroll:true});};
 },[]);
 const terms=tokens(query);
 const candidates=index.filter(q=>(active==='all'||active===q.subject)&&(scope!=='saved'||progress[q.subject].saved.has(q.id))&&(marks==='all'||(marks==='long'?q.marks>=4:q.marks===Number(marks)))&&terms.every(t=>q.search.includes(t)));
 const ordered=terms.length?[...candidates].sort((a,b)=>terms.filter(t=>b.name.includes(t)).length-terms.filter(t=>a.name.includes(t)).length):candidates;
 const open=q=>{close();navigate(q.subject,'questions',{question:q.id});};
 return <dialog className="atlas-finder" ref={dialog} aria-labelledby="finder-title" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
  <div className="atlas-finder-body">
   <header><div><p className="hub-kicker">QUESTION FINDER</p><h2 id="finder-title">{scope==='saved'?'Your bookmarks':'Search all subjects'}</h2></div><button className="atlas-finder-close" type="button" aria-label="Close question finder" onClick={close}><X size={22}/></button></header>
   <label className="atlas-finder-input"><Search size={18}/><input ref={input} type="search" placeholder="Search questions, topics, or years…" aria-label="Search across subjects" value={query} onChange={e=>{setLimit(30);setQuery(e.target.value);}} onKeyDown={e=>{if(e.key==='Enter'&&ordered[0])open(ordered[0]);}}/></label>
   <div className="atlas-finder-controls"><select aria-label="Subject" value={active} onChange={e=>{setLimit(30);setActive(e.target.value);}}><option value="all">All subjects</option>{subjectEntries.map(([id,s])=><option key={id} value={id}>{s.abbr}</option>)}</select>
   <select aria-label="Marks in search" value={marks} onChange={e=>{setLimit(30);setMarks(e.target.value);}}><option value="all">All marks</option><option value="1">1 mark</option><option value="long">4+ marks</option></select>
   <button type="button" aria-pressed={scope==='saved'} onClick={()=>{setLimit(30);setScope(scope==='saved'?'all':'saved');}}><Bookmark size={15}/> Saved only</button></div>
   <p className="atlas-finder-count" aria-live="polite">{ordered.length} {ordered.length===1?'match':'matches'}</p>
   <div className="atlas-results">{ordered.slice(0,limit).map(q=><a key={q.subject+q.id} href={hrefFor(q)} onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();open(q);}}><span style={{'--result-tone':subjects[q.subject].tone}}>{q.subject.toUpperCase()}</span><div><b>{q.title}</b><small>{q.year} · Q{q.ref} · {q.marks} {q.marks===1?'mark':'marks'}{progress[q.subject].done.has(q.id)?' · Mastered':''}</small></div><ArrowUpRight size={17}/></a>)}
   {!ordered.length&&<p className="atlas-empty">Try another keyword or change the filters.</p>}
   {ordered.length>limit&&<button className="atlas-load-more" onClick={()=>setLimit(n=>n+30)}>Show more results</button>}</div>
  </div>
 </dialog>;
}
const subjectAssets=new Map();
function subjectAsset(id,extension){
 const revision=document.documentElement.dataset.atlasRevision;
 return 'app/'+id+'.'+extension+(revision?'?v='+revision:'');
}
function loadSubject(id){
 const cached=subjectAssets.get(id);
 if(cached)return cached;
 const style=document.createElement('link');
 style.rel='stylesheet';
 style.href=subjectAsset(id,'css');
 style.media='not all';
 const css=new Promise((resolve,reject)=>{
  style.onload=resolve;
  style.onerror=()=>reject(new Error('Subject stylesheet could not load'));
 });
 document.head.append(style);

 const global=subjects[id].global;
 const script=document.createElement('script');
 const module=window[global]?Promise.resolve(window[global]):new Promise((resolve,reject)=>{
  script.src=subjectAsset(id,'js');
  script.onload=()=>{
   script.remove();
   if(window[global])resolve(window[global]);
   else reject(new Error('Subject module did not register'));
  };
  script.onerror=()=>{script.remove();reject(new Error('Subject module could not load'));};
  document.head.append(script);
 });
 const assets=Promise.all([module,css]).then(([app])=>({app,style})).catch(error=>{
  style.remove();
  subjectAssets.delete(id);
  throw error;
 });
 subjectAssets.set(id,assets);
 return assets;
}
function warmSubject(id){loadSubject(id).catch(()=>{});}
function useSubjectPreviews(){
 useEffect(()=>{
  if(navigator.connection?.saveData)return;
  const warm=()=>{if(!document.hidden)subjectEntries.forEach(([id])=>warmSubject(id));};
  if(typeof requestIdleCallback==='function'){
   const handle=requestIdleCallback(warm,{timeout:1800});
   return ()=>cancelIdleCallback(handle);
  }
  const handle=setTimeout(warm,900);
  return ()=>clearTimeout(handle);
 },[]);
}

function Hub(){
 const preferences=useAtlasPreferences();
 useLayoutEffect(()=>{
  document.documentElement.dataset.theme=preferences.theme;
  document.documentElement.dataset.layout=preferences.ui;
  document.documentElement.dataset.sidebar=preferences.sidebar;
 },[preferences.theme,preferences.ui,preferences.sidebar]);
 const [route,setRoute]=useState(readRoute);
 const [shown,setShown]=useState(()=>readRoute().subject==='home'?'home':null);
 const [progress,setProgress]=useState(getStudyProgress);
 const [finder,setFinder]=useState(null);
 const [recent,setRecent]=useState(false);
 const [problem,setProblem]=useState(null);
 const [retry,setRetry]=useState(0);
 const host=useRef(null);
 const stage=useRef(null);
 const mounted=useRef({id:shown});
 useSubjectPreviews();
 useEffect(()=>observeRoute(()=>setRoute(readRoute())),[]);
 useEffect(()=>{
  const update=()=>setProgress(getStudyProgress());
  window.addEventListener(progressEvent,update);window.addEventListener('storage',update);
  const shortcut=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){if(document.querySelector('dialog[open]:not(.atlas-finder)'))return;e.preventDefault();setFinder(x=>x??'all');}};
  window.addEventListener('keydown',shortcut);
  return ()=>{window.removeEventListener(progressEvent,update);window.removeEventListener('storage',update);window.removeEventListener('keydown',shortcut);};
 },[]);
 useLayoutEffect(()=>{
  if(shown==null)return;
  if(shown==='home')document.documentElement.dataset.subject='home';
  document.title=shown==='home'?'Study Atlas · Past Papers and Practice':subjects[shown].title+' · Study Atlas';
  if(shown===route.subject&&shown!=='home')remember(location.hash||linkTo(shown));
 },[shown,route]);
 useEffect(()=>{
  let cancelled=false;
  const id=route.subject;
  if(mounted.current.id===id)return;
  const destination=id==='home'?Promise.resolve(null):loadSubject(id);
  destination.then(assets=>{
   if(cancelled||readRoute().subject!==id)return;
   const html=document.documentElement;
   const animate=mounted.current.id!==null&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
   if(animate)html.dataset.atlasTransition='true';
   const commit=()=>{
    if(cancelled||readRoute().subject!==id)return;
    const previous=mounted.current;
    previous.unmount?.();
    if(previous.style)previous.style.media='not all';
    if(assets)assets.style.media='all';
    html.dataset.subject=id;
    window.scrollTo(0,0);
    flushSync(()=>setShown(id));
    const unmount=assets?.app.mount(host.current);
    mounted.current={id,unmount,style:assets?.style};
   };
   commit();
   if(animate){
    const content=stage.current?.querySelector(id==='home'?'.study-hub':'.atlas-page');
    content?.animate([{opacity:.84,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.2,.72,.25,1)'});
    delete html.dataset.atlasTransition;
   }
  }).catch(()=>{
   if(!cancelled)setProblem({id,retry});
  });
  return ()=>{cancelled=true;};
 },[route.subject,retry]);
 const error=problem?.id===route.subject&&problem.retry===retry&&shown!==route.subject;
 const pending=shown!==route.subject&&!error?route.subject:null;
 return <>
  <Header shown={shown} pending={pending} view={route.view} showSearch={setFinder} showRecent={()=>setRecent(true)}/>
  <div ref={stage} className="atlas-stage" aria-busy={Boolean(pending)}>
   {shown==='home'&&<Home progress={progress} showSearch={setFinder}/>}
   {shown===null&&!error&&<p className="atlas-loading" role="status">Opening Study Atlas…</p>}
   <div ref={host} className="atlas-subject-host" hidden={shown===null||shown==='home'}/>
  </div>
  {error&&<div className="atlas-route-error" role="status"><span>{subjects[route.subject]?.abbr} could not load.</span><button type="button" onClick={()=>setRetry(n=>n+1)}>Retry</button></div>}
  {recent&&<RecentTrail close={()=>setRecent(false)}/>}
  {finder&&<Finder mode={finder} close={()=>setFinder(null)} progress={progress}/>}
 </>;
}
for(const id of Object.keys(subjects))migratePracticeQueues(id);
createRoot(document.getElementById('atlas-root')).render(<Hub/>);
