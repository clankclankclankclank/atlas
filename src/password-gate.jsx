import React, {useEffect,useRef,useState} from 'react';
import {AudioLines, KeyRound} from 'lucide-react';

import GridScan from './react-bits/GridScan.jsx';
import {MusicControls} from './music-controls.jsx';
import {lockEvent} from './access-state.js';

const key = 'study-atlas-unlocked';
const namespace = 'study-atlas-access-v1:';
const verifier = '369bd710d72ee91c09057f457e8641e0799b28b7fb8e319a6d5478c0930edb9a';

function remembered() {
  try {
    return localStorage.getItem(key) === verifier;
  } catch {
    return false;
  }
}

export function PasswordGate({children}) {
  const [unlocked, setUnlocked] = useState(remembered);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const attempt = useRef(0);
  const [motion,setMotion] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotion(!media.matches);
    const lock = () => {
      attempt.current++;
      try { localStorage.removeItem(key); } catch {}
      setChecking(false);
      setPassword('');
      setError('');
      setUnlocked(false);
    };
    media.addEventListener('change',update);
    window.addEventListener(lockEvent,lock);
    return () => {
      media.removeEventListener('change',update);
      window.removeEventListener(lockEvent,lock);
    };
  }, []);

  async function unlock(event) {
    event.preventDefault();
    if (checking) return;
    const pending = ++attempt.current;
    setChecking(true);
    try {
      const bytes = new TextEncoder().encode(namespace + password);
      const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
      const entered = Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('');
      if (pending !== attempt.current) return;
      if (entered !== verifier) {
        setError('Incorrect password.');
        return;
      }
      try { localStorage.setItem(key, verifier); } catch {}
      setUnlocked(true);
    } catch {
      if (pending === attempt.current) setError('Password checking requires HTTPS or localhost.');
    } finally {
      if (pending === attempt.current) setChecking(false);
    }
  }

  return <><MusicControls/>{unlocked ? children : <main className="atlas-lock">
    {motion && <GridScan aria-hidden="true" className="atlas-lock-grid" linesColor="#745784" scanColor="#ffc0e3"
      cells={10} depth={3.1} parallax={0.22} dpr={0.8} clickEffect="none" scanDirection="pingpong"
      scanDuration={3.2} scanDelay={1.0} reflection={0.22}/>}

    <section className="atlas-lock-card" aria-labelledby="atlas-lock-title">
      <AudioLines className="atlas-lock-mark" size={28} aria-hidden="true"/>
      <p className="atlas-lock-series">Angels of Delusion</p>
      <h1 id="atlas-lock-title">Study Atlas</h1>
      <form onSubmit={unlock}>
        <label htmlFor="atlas-password">Password</label>
        <input id="atlas-password" name="password" type="password" autoComplete="current-password"
          value={password} onChange={event => {setPassword(event.target.value); setError('');}}
          aria-invalid={Boolean(error)} aria-describedby={error ? 'atlas-lock-error' : undefined} required/>
        {error && <p id="atlas-lock-error" role="alert">{error}</p>}
        <button type="submit" disabled={checking}><KeyRound size={16} aria-hidden="true"/> Unlock Atlas</button>
      </form>
    </section>
  </main>}</>;
}
