import React,{useEffect,useRef,useState} from 'react';
import {Check,Film,LockKeyhole,RotateCcw,Shuffle,Sparkles,Upload} from 'lucide-react';
import {MusicControls} from './music-controls.jsx';
import {lockAtlas} from './access-state.js';
import {listRewardVideos,removeRewardVideo,saveRewardVideo} from './reward-videos.js';

let lastClip;
function pickClip(clips,current=lastClip){
 const videos=clips.filter(clip=>/\.(mp4|webm)$/i.test(clip));
 const options=videos.filter(clip=>clip!==current);
 return options[Math.floor(Math.random()*options.length)]??videos[0];
}
function SettingsLoop({clips}){
 const [clip,setClip]=useState(()=>pickClip(clips));
 const [failed,setFailed]=useState(false);
 React.useEffect(()=>{if(clip)lastClip=clip;},[clip]);
 function shuffle(){
  setFailed(false);
  setClip(pickClip(clips,clip));
 }
 return <section className="settings-loop surface" aria-label="Settings video">
  <header><span><Film size={17}/> VIDEO LOOP</span><button type="button" className="button secondary" onClick={shuffle}><Shuffle size={15}/> Shuffle</button></header>
  <div className="settings-loop-frame">
   {clip&&!failed?<video key={clip} src={'media/'+encodeURIComponent(clip)} autoPlay muted loop playsInline controls aria-label="Random looping video" onError={()=>setFailed(true)}/>:<p>Video unavailable. Try Shuffle.</p>}
  </div>
 </section>;
}


function LocalRewardVideos({preview}){
 const [clips,setClips]=useState([]);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 React.useEffect(()=>{
  let active=true;
  listRewardVideos().then(items=>{if(active)setClips(items);}).catch(()=>{if(active)setNotice('Video storage is unavailable in this browser.');});
  return ()=>{active=false;};
 },[]);
 async function upload(e){
  const input=e.currentTarget,files=[...input.files];
  input.value='';
  if(!files.length)return;
  setBusy(true);
  setNotice('Checking videos…');
  const saved=[],failures=[];
  for(const file of files){
   try{saved.push(await saveRewardVideo(file));}
   catch(error){failures.push(file.name+' — '+(error.name==='QuotaExceededError'?'Browser storage is full.':error.message||'Could not save the video.'));}
  }
  setClips(current=>[...current,...saved]);
  setNotice([saved.length?saved.length+' '+(saved.length===1?'video saved.':'videos saved.'):'',...failures].filter(Boolean).join(' '));
  setBusy(false);
 }
 async function remove(clip){
  setBusy(true);
  try{
   await removeRewardVideo(clip.id);
   setClips(current=>current.filter(item=>item.id!==clip.id));
   setNotice('Removed '+clip.name+'.');
  }catch{setNotice('The video could not be removed.');}
  finally{setBusy(false);}
 }
 return <section className="formula-card surface local-reward-videos">
  <h2>Personal reward videos</h2>
  <p>Add MP4 or WebM clips up to 50 MB each. They join the reward pool in this browser profile across all four subjects. Clearing site data removes them.</p>
  <label className="local-reward-upload"><span><Upload size={16}/> Add reward videos</span><input type="file" accept="video/mp4,video/webm,.mp4,.webm" multiple disabled={busy} onChange={upload}/></label>
  {notice&&<p role="status">{notice}</p>}
  {clips.length>0&&<ul>{[...clips].sort((a,b)=>b.added-a.added).map(clip=><li key={clip.id}>
   <div><b>{clip.name}</b><small>{(clip.size/(1024*1024)).toFixed(1)} MB</small></div>
   <button type="button" className="button secondary" disabled={busy} aria-label={'Preview '+clip.name} onClick={async()=>{if(!await preview(clip.id))setNotice('The video could not be loaded.');}}>Preview</button>
   <button type="button" className="button secondary" disabled={busy} aria-label={'Remove '+clip.name} onClick={()=>remove(clip)}>Remove</button>
  </li>)}</ul>}
 </section>;
}


const resetHoldTime=1800;
const isHoldKey=key=>key===' '||key==='Enter';

function MasteryReset({mastered,onReset}){
 const [holding,setHolding]=useState(false);
 const [reset,setReset]=useState(false);
 const active=useRef(null);
 function cancel(){
  if(!active.current)return;
  clearTimeout(active.current.timer);
  active.current=null;
  setHolding(false);
 }
 useEffect(()=>{
  const hidden=()=>{if(document.hidden)cancel();};
  window.addEventListener('blur',cancel);
  document.addEventListener('visibilitychange',hidden);
  return ()=>{
   clearTimeout(active.current?.timer);
   window.removeEventListener('blur',cancel);
   document.removeEventListener('visibilitychange',hidden);
  };
 },[]);
 function begin(input){
  if(active.current||document.hidden)return;
  setReset(false);
  setHolding(true);
  const timer=setTimeout(()=>{
   if(document.hidden){cancel();return;}
   active.current=null;
   setHolding(false);
   onReset();
   setReset(true);
  },resetHoldTime);
  active.current={input,timer};
 }
 function move(event){
  if(active.current?.input!==event.pointerId)return;
  const box=event.currentTarget.getBoundingClientRect();
  if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)cancel();
 }
 function endPointer(event){if(active.current?.input===event.pointerId)cancel();}
 return <section className="formula-card surface mastery-reset">
  <h2>Mastery progress</h2>

  <button type="button" className="button hold-reset-button" aria-description="Hold for 1.8 seconds using a pointer, Space, or Enter." data-holding={holding} style={{'--hold-time':resetHoldTime+'ms'}}
   onPointerDown={event=>{if(!event.isPrimary||event.button!==0)return;event.currentTarget.setPointerCapture(event.pointerId);begin(event.pointerId);}}
   onContextMenu={event=>{if(active.current)event.preventDefault();}}
   onPointerMove={move} onPointerUp={endPointer} onPointerCancel={endPointer} onLostPointerCapture={endPointer} onBlur={cancel}
   onKeyDown={event=>{if(event.key==='Escape'){cancel();return;}if(!isHoldKey(event.key))return;event.preventDefault();if(!event.repeat)begin(event.key);}}
   onKeyUp={event=>{if(isHoldKey(event.key))event.preventDefault();if(active.current?.input===event.key)cancel();}}>
   <span><RotateCcw size={16}/> Hold to reset mastery</span>
  </button>
  <p role="status">{reset?'Mastery progress reset.':mastered+' questions mastered'}</p>
 </section>;
}

export function AtlasSettings({Heading,display,setDisplay,rewards,setRewards,preview,onReset,mastered,clips}) {
  return <><Heading eyebrow="PREFERENCES" title="Settings"/>
  <div className="settings-composition"><div className="settings-list">
    <section className="formula-card surface"><h2>Layout</h2><div className="choices">{[['original','Atlas','Navigation rail and dashboard overview'],['minimal','Minimalistic','Top navigation and a single study column']].map(([id,label,hint])=><button key={id} className="choice" aria-pressed={display.ui===id} onClick={()=>setDisplay({ui:id})}><b>{label}</b><small>{hint}</small>{display.ui===id&&<Check size={17}/>}</button>)}</div></section>
    <section className="formula-card surface"><h2>Sidebar</h2><div className="choices">{[['expanded','Expanded','Show section icons and labels'],['icons','Icons only','Keep the subject logo and section icons']].map(([id,label,hint])=><button key={id} className="choice" aria-pressed={display.sidebar===id} onClick={()=>setDisplay({sidebar:id})}><b>{label}</b><small>{hint}</small>{display.sidebar===id&&<Check size={17}/>}</button>)}</div></section>
    <section className="formula-card surface"><h2>Theme</h2><div className="choices">{[['dark','Dark'],['light','Light']].map(([id,label])=><button key={id} className="choice" aria-pressed={display.theme===id} onClick={()=>setDisplay({theme:id})}><b>{label}</b>{display.theme===id&&<Check size={17}/>}</button>)}</div></section>
    <section className="formula-card surface"><h2>Mastery rewards</h2><label className="check-label"><input type="checkbox" checked={rewards} onChange={e=>setRewards(e.target.checked)}/>Play a reward after marking a question mastered</label><button className="button secondary" onClick={()=>preview()}><Sparkles size={17}/> Preview reward</button></section>
    <MusicControls/>
    <LocalRewardVideos preview={preview}/>
    <section className="formula-card surface"><h2>Site access</h2><button type="button" className="button secondary" onClick={lockAtlas}><LockKeyhole size={16}/> Lock website</button></section>
    <MasteryReset mastered={mastered} onReset={onReset}/>
  </div><SettingsLoop clips={clips}/></div></>;
}
