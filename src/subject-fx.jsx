import React,{useEffect,useMemo,useState} from 'react';
import {useAtlasPreferences} from './preferences.js';
import Scanner from './react-bits/Scanner.jsx';
import MoltenMetal from './react-bits/MoltenMetal.jsx';
import GradientWaves from './react-bits/GradientWaves.jsx';
import PatternWaves from './react-bits/PatternWaves.jsx';
import GlowCursor from './react-bits/GlowCursor.jsx';
import BranchedMenu from './react-bits/BranchedMenu.jsx';
import GlideSelect from './react-bits/GlideSelect.jsx';
import RubberSegment from './react-bits/RubberSegment.jsx';
import SpecularButton from './react-bits/SpecularButton.jsx';
import BorderGlow from './react-bits/BorderGlow.jsx';

const media='(prefers-reduced-motion: reduce)';
const palettes={
 daa:['#4b92ae','#75e6ed','#c7f9ff'],
 cn:['#5425ab','#a864e8','#efd3ff'],
 ee:['#95542b','#e2a446','#ffe0a0'],
 se:['#348966','#61c899','#baf6cb']
};
function useEffects(){
 const {ui,theme}=useAtlasPreferences();
 const [reduce,setReduce]=useState(()=>matchMedia(media).matches);
 useEffect(()=>{
  const query=matchMedia(media),sync=()=>setReduce(query.matches);
  query.addEventListener('change',sync);
  return ()=>query.removeEventListener('change',sync);
 },[]);
 return {minimal:ui==='minimal',light:theme==='light',animated:ui!=='minimal'&&!reduce};
}
export function SubjectBackdrop({subject,diagram=false}){
 const {minimal,light,animated}=useEffects();
 if(minimal)return null;
 const [base,mid,bright]=palettes[subject];
 const trail=diagram&&matchMedia('(hover:hover) and (pointer:fine)').matches;
 return <div className="atlas-subject-backdrop" data-scene={subject} aria-hidden="true">
  <div className="atlas-scene-art">
   {animated&&subject==='daa'&&<Scanner color1={light?'#356986':base} color2={light?'#007c92':mid} color3={light?'#005665':bright} lightMode={light} dpr={1} speed={.28} sweepSpeed={.21} bandDensity={15} glow={.72} grain={false} clickEffect="ping" intro={false}/>}
   {animated&&subject==='cn'&&<MoltenMetal colors={light?['#7746c6','#a35ed5','#5e2ab5']:[base,mid]} coreColor={light?'#54268b':bright} lightMode={light} dpr={.8} speed={.19} scale={2.6} detail={3} thickness={1.45} glow={2} brightness={1.48} grain={0} intro={false}/>}
   {animated&&subject==='ee'&&<GradientWaves horizonColor={light?'#bc7a47':base} waveColor={light?'#be8137':mid} crestColor={light?'#9b5821':bright} lightMode={light} quality="low" dpr={.75} speed={.21} amplitude={2.25} tilt={62} sheen={.3} grain={0} intro={false}/>}
   {animated&&subject==='se'&&<PatternWaves preset="lines" wave="silk" pattern="line" color={light?'#277653':bright} backgroundColor="transparent" fade="edges" spacing={16} speed={.25} depth={1.7} interactive intro={false}/>}
   {animated&&trail&&<GlowCursor className="atlas-scene-trail" color={light?base:bright} quality="low" theme={light?'light':'dark'} maxDevicePixelRatio={1} trailWidth={1.6} intensity={.9} linger={.48} clickBurst={false}/>}
  </div>
 </div>;
}
export function StudyHeading({subject,eyebrow,title,description,children}){
 return <header className="section-heading atlas-scene-heading flex flex-wrap items-end justify-between gap-4">
  <SubjectBackdrop subject={subject} diagram={/diagram|trace studio/i.test(title)}/>
  <div className="atlas-scene-copy"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description&&<p className="section-description">{description}</p>}</div>
  {children}
 </header>;
}
export function SubjectBranchNav({entries,subject,view,go}){
 const groups=useMemo(()=>{
  const study=[],practice=[],preferences=[];
  const boundary=entries.findIndex(([id])=>id===(subject==='ee'?'repeats':'diagrams'));
  entries.forEach(([value,label,Icon],i)=>{
   (value==='settings'?preferences:i<boundary?study:practice).push({value,label,icon:<Icon size={15}/>});
  });
  return [{label:'Study',children:study},{label:'Practice',children:practice},{label:'Preferences',children:preferences}];
 },[entries,subject]);
 return <BranchedMenu className="atlas-branch-nav" items={groups} activeValue={view} defaultOpen={[0,1,2]} onSelect={go} width="100%" color="var(--ink)" accentColor="var(--accent)" lineColor="var(--line)" indent={25} trunk={7} radius={6} rowHeight={34} fontSize={13}/>;
}
export function StudySelect({options,value,onChange,label}){
 const {minimal}=useEffects();
 if(minimal)return <select className="field" aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>;
 return <GlideSelect className="atlas-glide-filter" options={options} value={value} onChange={onChange} ariaLabel={label} showTags={false} size="sm" menuWidth={225} surfaceColor="var(--panel)" textColor="var(--ink)" accentColor="var(--accent)" highlightColor="var(--soft)"/>;
}
export function StudyScope({options,value,onChange}){
 const {minimal}=useEffects();
 if(minimal)return <div className="study-scopes" role="group" aria-label="Question list">{options.map(({value:id,label})=><button key={id} type="button" className="scope-button" aria-pressed={value===id} onClick={()=>onChange(id)}>{label}</button>)}</div>;
 return <RubberSegment className="atlas-study-scope" aria-label="Question list" items={options} value={value} onChange={onChange} size="sm" equalSlots={false} draggable={false} trackColor="var(--soft)" thumbColor="var(--accent)" activeTextColor="var(--accent-ink)" textColor="var(--ink)" radius={9}/>;
}
export function StudyAction({children,...props}){
 const {animated}=useEffects();
 if(!animated)return <button type="button" className="button primary" {...props}>{children}</button>;
 return <SpecularButton className="atlas-specular-action" tint="var(--accent)" textColor="var(--accent-ink)" lineColor="#ffffff" baseColor="#9eb9d8" tintOpacity={1} radius={9} idleIntensity={.32} size="sm" {...props}>{children}</SpecularButton>;
}
export function FilterGlow({subject,children}){
 const {animated}=useEffects();
 if(!animated)return children;
 return <BorderGlow className="atlas-filter-glow" colors={palettes[subject]} glowColor={{daa:'186 82 65',cn:'271 81 68',ee:'36 78 61',se:'154 60 55'}[subject]} backgroundColor="var(--panel)" borderRadius={15} glowRadius={23} glowIntensity={.74} fillOpacity={.18}>{children}</BorderGlow>;
}
