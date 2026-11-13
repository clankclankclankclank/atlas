import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Headphones,Play,Square} from 'lucide-react';
import data from './study-data.json';
import {matchesQuestionType} from '../question-types.js';
import {StudySelect} from '../study-select.jsx';
import {seRecordings} from '../generated-index.mjs';
import {audioStem,narrationFor,speechChunks} from './narration.mjs';

const tracks=data.ORDER.flatMap(topic=>data.QS.filter(q=>q.topic===topic).map(q=>({
  id:q.id, paper:q.paper, ref:q.ref, topic:q.topic, question:q.question,
  narration:narrationFor(q), numerical:matchesQuestionType('se',q.id,'numerical'),
  recording:seRecordings.includes(audioStem(q.id))?'media/se-listening/'+audioStem(q.id)+'.mp3':null
})));

export function SEAudioLibrary({Heading,openQuestion}) {
  const [mode,setMode]=useState('theory');
  const [topic,setTopic]=useState('all');
  const [selected,setSelected]=useState(null);
  const [continuous,setContinuous]=useState(true);
  const [rate,setRate]=useState(1);
  const [playing,setPlaying]=useState(false);
  const [feedback,setFeedback]=useState('');
  const audio=useRef(null);
  const speech=useRef(0);
  const pendingPlay=useRef(false);
  const autoAdvance=useRef(true);
  const canSpeak=typeof window.speechSynthesis!=='undefined' && typeof window.SpeechSynthesisUtterance==='function';
  const queue=tracks.filter(q=>(mode==='all'||!q.numerical)&&(topic==='all'||q.topic===topic));
  const index=Math.max(0,queue.findIndex(q=>q.id===selected));
  const track=queue[index];

  function stop() {
    speech.current++;
    pendingPlay.current=false;
    if(canSpeak)window.speechSynthesis.cancel();
    audio.current?.pause();
    setPlaying(false);
  }

  useEffect(()=>()=>{speech.current++;if(canSpeak)window.speechSynthesis.cancel();},[canSpeak]);

  function choose(position,play=false) {
    const next=queue[position];
    if(!next)return;
    stop();
    setFeedback('');
    pendingPlay.current=play;
    setSelected(next.id);
  }

  function ended() {
    setPlaying(false);
    if(autoAdvance.current)choose(index+1,true);
  }

  function play() {
    setFeedback('');
    if(track.recording) {
      const player=audio.current;
      if(!player)return;
      player.playbackRate=rate;
      player.play().catch(()=>setFeedback('Press Play on the audio player to start this recording.'));
      return;
    }
    if(!canSpeak)return;
    const generation=++speech.current;
    const chunks=speechChunks(track.narration);
    let position=0;
    setPlaying(true);

    function speakNext() {
      if(generation!==speech.current)return;
      const chunk=chunks[position++];
      if(!chunk){ended();return;}
      const voice=new window.SpeechSynthesisUtterance(chunk);
      voice.lang='en';
      voice.rate=rate;
      voice.onend=speakNext;
      voice.onerror=()=>{
        if(generation!==speech.current)return;
        setPlaying(false);
        setFeedback('Read aloud could not start. The transcript is available below.');
      };
      window.speechSynthesis.speak(voice);
    }
    speakNext();
  }

  useEffect(()=>{
    if(!pendingPlay.current||!track)return;
    pendingPlay.current=false;
    play();
  },[track]);

  function updateFilter(setter,value) {
    stop();
    setFeedback('');
    setSelected(null);
    setter(value);
  }

  return <>
    <Heading eyebrow="SOFTWARE ENGINEERING" title="Listen to past papers"/>
    <div className="se-listening-filters">
      <StudySelect label="Playlist type" value={mode} onChange={value=>updateFilter(setMode,value)}
        options={[{value:'theory',label:'Theory questions'},{value:'all',label:'All questions'}]}/>
      <StudySelect label="Playlist topic" value={topic} onChange={value=>updateFilter(setTopic,value)}
        options={[{value:'all',label:'All topics'},...data.ORDER.map(value=>({value,label:data.TOPICS[value][0]}))]}/>
    </div>
    {track ? <div className="se-listening">
      <section className="surface se-listening-player" aria-labelledby="se-listening-question">
        <p className="eyebrow"><Headphones size={15}/> {index+1} / {queue.length} · {data.PAPERS[track.paper].label} · Q{track.ref}</p>
        <h2 id="se-listening-question">{track.question}</h2>
        <div className="se-listening-controls">
          <button type="button" className="button secondary icon-only" aria-label="Previous question" disabled={index===0} onClick={()=>choose(index-1,playing)}><ArrowLeft size={17}/></button>
          <button type="button" className="button primary" disabled={!track.recording&&!canSpeak} onClick={playing?stop:play}>
            {playing?<Square size={15}/>:<Play size={15}/>} {playing?(track.recording?'Pause':'Stop'):track.recording?'Play recording':'Read aloud'}
          </button>
          <button type="button" className="button secondary icon-only" aria-label="Next question" disabled={index===queue.length-1} onClick={()=>choose(index+1,playing)}><ArrowRight size={17}/></button>
          <StudySelect label="Playback speed" value={rate} onChange={value=>{if(!track.recording)stop();setRate(value);if(audio.current)audio.current.playbackRate=value;}}
            options={[0.75,1,1.25,1.5,2].map(value=>({value,label:value+'×'}))}/>
          <label className="check-label"><input type="checkbox" checked={continuous} onChange={event=>{autoAdvance.current=event.target.checked;setContinuous(event.target.checked);}}/> Auto-advance</label>
        </div>
        {track.recording
          ? <audio key={track.id} ref={audio} controls preload="metadata" src={track.recording}
              onPlay={()=>{audio.current.playbackRate=rate;setPlaying(true);}} onPause={()=>setPlaying(false)} onEnded={ended}
              onError={()=>{setPlaying(false);setFeedback('This recording could not load. The transcript is available below.');}}/>
          : <p className="se-listening-status">{canSpeak?'Uses your browser’s voice until a recording is added.':'Read aloud is unavailable in this browser. You can read the transcript below.'}</p>}
        {feedback&&<p role="status">{feedback}</p>}
        <button className="button secondary" type="button" onClick={()=>openQuestion(track.id)}>Open worked solution <ArrowRight size={16}/></button>
        <details className="se-listening-transcript"><summary>Transcript</summary><div>{track.narration.split('\n\n').map((part,i)=><p key={i}>{part}</p>)}</div></details>
      </section>
      <nav className="surface se-listening-queue" aria-label="Question playlist">
        <ol>{queue.map((question,position)=><li key={question.id}>
          <button type="button" aria-current={question.id===track.id?'true':undefined}
            onClick={()=>{if(position!==index)choose(position,playing);}}>
            <span>{data.PAPERS[question.paper].label} · Q{question.ref}</span>{question.question}
          </button>
        </li>)}</ol>
      </nav>
    </div> : <p>No questions match these filters.</p>}
  </>;
}
