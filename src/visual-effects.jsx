import React from 'react';

// React Bits Spotlight Card pattern. Keep pointer coordinates out of React state.
export function trackSpotlight(event){
 if(event.pointerType!=='mouse')return;
 const card=event.currentTarget,box=card.getBoundingClientRect();
 card.style.setProperty('--spot-x',event.clientX-box.left+'px');
 card.style.setProperty('--spot-y',event.clientY-box.top+'px');
}

// Motion Primitives Text Effect pattern, with the final text always available to assistive tech.
export function RevealLine({children,delay=0,accent=false}){
 const Tag=accent?'em':'span';
 return <span className="visual-reveal"><Tag style={{'--reveal-delay':delay+'ms'}}>{children}</Tag></span>;
}

// Magic UI Animated Beam pattern for diagrams with known SVG coordinates.
export function SignalPath({path,active=false,delay=0}){
 return <>
  <path className="visual-signal-track" d={path}/>
  {active&&<path className="visual-signal-beam" pathLength="100" d={path} style={{'--beam-delay':delay+'ms'}}/>}
 </>;
}
