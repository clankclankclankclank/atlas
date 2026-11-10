import React,{useState} from 'react';
import {Check,Film,RotateCcw,Shuffle,Sparkles,Upload} from 'lucide-react';
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

export function AtlasSettings({Heading,display,setDisplay,rewards,setRewards,preview,onReset,mastered,clips}) {
  const [confirmReset,setConfirmReset]=useState(false);
  const [resetMessage,setResetMessage]=useState('');
  return <><Heading eyebrow="PREFERENCES" title="Settings" description="Appearance, study tools, and reward preferences apply across Study Atlas."/>
  <div className="settings-composition"><div className="settings-list">
    <section className="formula-card surface"><h2>Layout</h2><div className="choices">{[['original','Atlas','Navigation rail and dashboard overview'],['minimal','Minimalistic','Top navigation and a single study column']].map(([id,label,hint])=><button key={id} className="choice" aria-pressed={display.ui===id} onClick={()=>setDisplay({ui:id})}><b>{label}</b><small>{hint}</small>{display.ui===id&&<Check size={17}/>}</button>)}</div></section>
    <section className="formula-card surface"><h2>Sidebar</h2><div className="choices">{[['expanded','Expanded','Show section icons and labels'],['icons','Icons only','Keep the subject logo and section icons']].map(([id,label,hint])=><button key={id} className="choice" aria-pressed={display.sidebar===id} onClick={()=>setDisplay({sidebar:id})}><b>{label}</b><small>{hint}</small>{display.sidebar===id&&<Check size={17}/>}</button>)}</div></section>
    <section className="formula-card surface"><h2>Theme</h2><div className="choices">{[['dark','Dark'],['light','Light']].map(([id,label])=><button key={id} className="choice" aria-pressed={display.theme===id} onClick={()=>setDisplay({theme:id})}><b>{label}</b>{display.theme===id&&<Check size={17}/>}</button>)}</div></section>
    <section className="formula-card surface"><h2>Mastery rewards</h2><label className="check-label"><input type="checkbox" checked={rewards} onChange={e=>setRewards(e.target.checked)}/>Play a reward after marking a question mastered</label><p>The first time you master a question, a random reward plays for five seconds with sparkle confetti. Re-marking the question updates your progress without replaying it. The background blurs and pauses interaction until the clip ends or you press Escape.</p><button className="button secondary" onClick={()=>preview()}><Sparkles size={17}/> Preview reward</button></section>
    <LocalRewardVideos preview={preview}/>
    <section className="formula-card surface"><h2>Mastery progress</h2><p>Reset mastery and reward history for this subject. Bookmarks and revision checklists are kept.</p>
    {confirmReset?<div className="reset-confirm"><p id="reset-question">Reset all mastery progress?</p><div className="flex flex-wrap gap-2"><button className="button reset-button" onClick={()=>{onReset();setConfirmReset(false);setResetMessage('Mastery progress reset.');}}>Confirm reset</button><button className="button secondary" onClick={()=>setConfirmReset(false)}>Cancel</button></div></div>:<button className="button secondary" onClick={()=>{setResetMessage('');setConfirmReset(true);}}><RotateCcw size={16}/> Reset mastery</button>}
    <p role="status">{resetMessage||mastered+' questions mastered'}</p></section>
  </div><SettingsLoop clips={clips}/></div></>;
}
