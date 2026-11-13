import React from 'react';
import GlideSelect from './react-bits/GlideSelect.jsx';
import {useAtlasPreferences} from './preferences.js';

export function StudySelect({options,value,onChange,label,align="right"}) {
 const {ui}=useAtlasPreferences();
 return <GlideSelect className="atlas-glide-filter" options={options} value={value} onChange={onChange}
  ariaLabel={label} showTags={false} size="md" menuWidth={245} align={align}
  popDuration={ui==='minimal'?0:180} glideDuration={ui==='minimal'?0:220}
  surfaceColor="var(--panel,var(--hub-panel))" textColor="var(--ink,var(--hub-ink))"
  accentColor="var(--accent,var(--hub-accent))" highlightColor="var(--soft,var(--hub-soft))"/>;
}
