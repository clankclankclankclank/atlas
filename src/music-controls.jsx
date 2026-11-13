import React, {useRef,useState} from 'react';
import {Music2,Pause,Play} from 'lucide-react';
import WakeSlider from './react-bits/WakeSlider.jsx';

const volumeKey = 'study-atlas-music-volume';
function readVolume() {
  try {
    const saved = localStorage.getItem(volumeKey);
    const volume = Number(saved);
    if (saved !== null && Number.isFinite(volume)) return Math.max(0, Math.min(100, volume));
  } catch {}
  return 10;
}

export function MusicControls() {
  const player = useRef(null);
  const [volume,setVolume] = useState(readVolume);
  const [playing,setPlaying] = useState(false);
  const [error,setError] = useState(false);

  function changeVolume(value) {
    setVolume(value);
    player.current.volume = value / 100;
    try { localStorage.setItem(volumeKey,String(value)); } catch {}
  }

  async function toggle() {
    const audio = player.current;
    if (!audio.paused) { audio.pause(); return; }
    setError(false);
    audio.volume = volume / 100;
    try { await audio.play(); } catch { setError(true); }
  }

  return <aside className="atlas-music" aria-label="Background music">
    <audio ref={player} src="media/sampling-dreams.mp3" loop preload="none"
      onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>setError(true)}/>
    <details>
      <summary aria-label="Music controls"><Music2 size={18}/></summary>
      <div className="atlas-music-panel">
        <div className="atlas-music-heading">
          <button type="button" aria-label={playing?'Pause music':'Play music'} onClick={toggle}>{playing?<Pause size={17}/>:<Play size={17}/>}</button>
          <strong>Sampling Dreams</strong>
        </div>
        <WakeSlider value={volume} onChange={changeVolume} ariaLabel="Music volume" showValue
          formatValue={value=>value+'%'} bars={22} height={42} fillColor="#ffc5e0" trackColor="#49374e"/>
        {error&&<p role="status">Music could not play.</p>}
      </div>
    </details>
  </aside>;
}
