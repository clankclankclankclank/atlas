import React from 'react';
import GradientASCII from './GradientASCII.jsx';

const dark = ['#173773','#365fdb','#73a1ff','#d8e8ff'];
const light = ['#e3edff','#a7c6ff','#729aff','#315bbc'];

export function DistributedScene({light: isLight}) {
  return <GradientASCII
    colors={isLight ? light : dark}
    shape="pinch"
    characters=" .:01+=#"
    cellSize={15}
    density={0.83}
    glyphOpacity={0.9}
    gradientOpacity={0.8}
    glow={0.25}
    softness={0.62}
    scale={1.18}
    flow={0.72}
    speed={0.52}
    flicker={0.23}
    grain={0}
    dpr={0.85}
    intro={false}
    clickEffect="none"
    lightMode={isLight}
  />;
}
