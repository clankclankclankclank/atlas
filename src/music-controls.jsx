import React, {useEffect,useState} from 'react';
import {Pause,Play} from 'lucide-react';
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

export function MusicPlayer() {
  return <audio id="atlas-music-player" src="media/sampling-dreams.mp3" loop preload="none"/>;
}

export function MusicControls() {
  const [volume,setVolume] = useState(readVolume);
  const [playing,setPlaying] = useState(false);
  const [error,setError] = useState(false);

  useEffect(() => {
    const audio = document.getElementById('atlas-music-player');
    if (!audio) return;
    const sync = () => setPlaying(!audio.paused);
    const failed = () => setError(true);
    sync();
    audio.addEventListener('play',sync);
    audio.addEventListener('pause',sync);
    audio.addEventListener('error',failed);
    return () => {
      audio.removeEventListener('play',sync);
      audio.removeEventListener('pause',sync);
      audio.removeEventListener('error',failed);
    };
  }, []);

  function changeVolume(value) {
    setVolume(value);
    const audio = document.getElementById('atlas-music-player');
    if (audio) audio.volume = value / 100;
    try { localStorage.setItem(volumeKey,String(value)); } catch {}
  }

  async function toggle() {
    const audio = document.getElementById('atlas-music-player');
    if (!audio) return;
    if (!audio.paused) { audio.pause(); return; }
    setError(false);
    audio.volume = volume / 100;
    try { await audio.play(); } catch { setError(true); }
  }

  return <section className="formula-card surface atlas-music-settings">
    <h2>Background music</h2>
    <div className="atlas-music-heading">
      <strong>Sampling Dreams</strong>
      <button className="button secondary" type="button" onClick={toggle}>
        {playing?<Pause size={16}/>:<Play size={16}/>} {playing?'Pause music':'Play music'}
      </button>
    </div>
    <WakeSlider value={volume} onChange={changeVolume} ariaLabel="Music volume" showValue
      formatValue={value=>value+'%'} bars={22} height={42}
      fillColor="var(--accent)" trackColor="var(--soft)"/>
    {error&&<p role="status">Music could not play.</p>}
  </section>;
}
