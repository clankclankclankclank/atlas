import React,{useLayoutEffect,useRef,useState} from 'react';
import {TableCalculation,useTableCalculations} from './table-calculations.jsx';
import {Maximize2,Minus,Plus,X} from 'lucide-react';

const textOf=node=>node?.textContent.trim()??'';
const distance=(point,box)=>Math.hypot(Math.max(box.x-point.x,0,point.x-box.x-box.width),Math.max(box.y-point.y,0,point.y-box.y-box.height));
const nearest=(point,items)=>items.reduce((best,item)=>!best||distance(point,item.box)<distance(point,best.box)?item:best,null);

function diagramParts(svg,title){
 const venn={
  P:'Decision problems solvable in polynomial time. P sits inside NP.',
  NP:'Decision problems whose yes instances have certificates verifiable in polynomial time.',
  'NP-hard':'Problems to which every problem in NP can be reduced in polynomial time.',
  'NP-complete':'The intersection of NP and NP-hard.'
 };
 if(/NP-complete equals the overlap/i.test(svg.getAttribute('aria-label')??'')){
  return [...svg.querySelectorAll('text')].map(el=>({el,title:textOf(el),kind:'Class',detail:venn[textOf(el)],labels:[]}));
 }
 const nodes=[...svg.querySelectorAll('.tree-node,.se-node,[data-inspect-node]')].map((el,i)=>{
  const source=el.getBBox(),matrix=svg.getCTM().inverse().multiply(el.getCTM());
  const topLeft=new DOMPoint(source.x,source.y).matrixTransform(matrix);
  const bottomRight=new DOMPoint(source.x+source.width,source.y+source.height).matrixTransform(matrix);
  const box={x:topLeft.x,y:topLeft.y,width:bottomRight.x-topLeft.x,height:bottomRight.y-topLeft.y};
  const kind=[['se-node-actor','Actor'],['se-node-usecase','Use case'],['se-node-store','Data store'],['se-node-class','Class'],['se-node-critical','Critical activity'],['se-node-process','Process']].find(([name])=>el.classList.contains(name))?.[1]??'Node';
  const after=el.nextElementSibling;
  const label=el.matches('.se-node-store')&&after?.matches('.se-edge')?after.nextElementSibling:after;
  const inside=[...el.querySelectorAll('text')];
  const name=el.dataset.inspectNode||textOf(inside[0])||(label?.matches('.se-node-title')&&textOf(label))||kind+' '+(i+1);
  const labels=[...inside.slice(1)];
  if(label?.matches('.se-node-title')){
   for(let sub=label.nextElementSibling;sub?.matches('.se-node-sub');sub=sub.nextElementSibling)labels.push(sub);
  }
  const detail=el.dataset.inspectDetail||labels.map(textOf).filter(Boolean).join(' · ')||
   (kind==='Node'?(/huffman/i.test(title)?'A subtree or symbol in the prefix code. Read the branch bits from the root to reach this node.':/split|recurrence|work|recursive/i.test(title)?'A recursive call. Its outgoing branches represent the subproblems it creates.':'A vertex or item in this diagram. Its incident edges show how it connects to the other items.'):'This '+kind.toLowerCase()+' is labeled “'+name+'” in the model.');
  return {el,box,title:name,detail,kind,labels:inside.length?[]:[label,...labels].filter(t=>t?.matches('.se-node-title,.se-node-sub'))};
 });
 const edges=[...svg.querySelectorAll('.tree-edge,.se-edge,.econ-axis,.econ-line,[data-inspect-edge]')].flatMap((el,i)=>{
  const length=el.getTotalLength();
  const start=nearest(el.getPointAtLength(0),nodes),end=nearest(el.getPointAtLength(length),nodes);
  if(el.matches('.se-edge')&&start===end&&start?.kind==='Data store'&&!el.getAttribute('marker-end'))return [];
  const next=el.nextElementSibling;
  const label=next?.matches('.graph-weight,.tree-bit,.se-link-label,[data-edge-label]')?next:null;
  const marker=el.getAttribute('marker-end')??'';
  const relation=marker.includes('-general')?'Generalization':marker.includes('-compose')?'Composition':marker.includes('-diamond')?'Aggregation':el.classList.contains('se-dash')?'Dashed relationship':marker?'Directed connection':'Connection';
  let name=el.dataset.inspectEdge||(start&&end?start.title+(marker?' → ':' — ')+end.title:'Connection '+(i+1));
  let detail=el.dataset.inspectDetail||(label?.matches('.graph-weight')?'Edge weight '+textOf(label)+(el.classList.contains('graph-hot')?' · selected in the displayed result.':'.'):label?.matches('.tree-bit')?'Take branch '+textOf(label)+' when reading the prefix code.':label?relation+' · '+textOf(label)+'.':el.matches('.tree-edge')?(el.classList.contains('graph-hot')?'Highlighted in the displayed result.':'Connects the two labeled items in the diagram.'):relation+' shown between the two elements.');
  if(el.matches('.econ-axis,.econ-line')){
   name=el.matches('.econ-axis')?'Chart axes':textOf(next)||'Series '+(i+1);
   detail=el.matches('.econ-axis')?'Read the quantity on the horizontal axis and the vertical measure from its axis label.':svg.getAttribute('aria-label')||'This is a plotted series in the graph.';
  }
  return [{el,title:name,detail,kind:'Edge',labels:label?[label]:[]}];
 });
 return [...nodes,...edges];
}

function Inspector({figure,close}){
 const dialog=useRef(null),canvas=useRef(null),viewport=useRef(null);
 const [parts,setParts]=useState([]);
 const [selected,setSelected]=useState(-1);
 const [scale,setScale]=useState(1);
 const [natural,setNatural]=useState(600);
 const [available,setAvailable]=useState(600);
 useLayoutEffect(()=>{
  const node=dialog.current;
  node.showModal();
  const observer=new ResizeObserver(([entry])=>setAvailable(entry.contentRect.width-24));
  observer.observe(viewport.current);
  return ()=>{observer.disconnect();if(node.open)node.close();};
 },[]);
 useLayoutEffect(()=>{
  const svg=canvas.current.querySelector('svg');
  const img=canvas.current.querySelector('img');
  if(!svg){setNatural(Number(img?.getAttribute('width'))||img?.naturalWidth||900);return;}
  setNatural(svg.viewBox.baseVal.width||600);
  setParts(diagramParts(svg,figure.title));
 },[figure]);
 useLayoutEffect(()=>{
  const cleanups=parts.map(({el,labels,kind},index)=>{
   const click=()=>setSelected(index);
   const targets=[el,...labels];
   if(kind==='Edge'){
    const hit=el.cloneNode(false);
    hit.removeAttribute('marker-end');
    hit.removeAttribute('marker-start');
    hit.removeAttribute('class');
    hit.removeAttribute('data-inspect-edge');
    hit.classList.add('atlas-edge-hit');
    el.before(hit);
    targets.push(hit);
   }
   for(const target of targets){target.classList.add('atlas-inspect-part');target.addEventListener('click',click);}
   return ()=>{for(const target of targets)target.removeEventListener('click',click);targets.find(t=>t.matches('.atlas-edge-hit'))?.remove();};
  });
  return ()=>cleanups.forEach(clean=>clean());
 },[parts]);
 useLayoutEffect(()=>{
  for(const [i,part] of parts.entries())for(const el of [part.el,...part.labels])el.classList.toggle('atlas-part-selected',i===selected);
 },[parts,selected]);
 const active=parts[selected],width=Math.max(80,Math.min(natural,available))*scale;
 return <dialog className="atlas-tool-dialog atlas-inspector" ref={dialog} aria-labelledby="inspector-title" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
  <div className="atlas-tool-shell">
   <header className="atlas-tool-header"><div><p><Maximize2 size={15}/> DIAGRAM INSPECTOR</p><h2 id="inspector-title">{figure.title}</h2></div><button type="button" className="atlas-tool-icon" aria-label="Close diagram inspector" onClick={close}><X size={20}/></button></header>
   <div className="atlas-inspector-toolbar" role="group" aria-label="Inspector zoom">
    <button type="button" className="atlas-tool-icon" aria-label="Zoom out" disabled={scale<=.75} onClick={()=>setScale(v=>v-.25)}><Minus size={16}/></button>
    <output>{Math.round(scale*100)}%</output>
    <button type="button" className="atlas-tool-icon" aria-label="Zoom in" disabled={scale>=4} onClick={()=>setScale(v=>v+.25)}><Plus size={16}/></button>
    <button type="button" className="atlas-tool-button" onClick={()=>{setScale(1);viewport.current.scrollTo(0,0);}}>Fit</button>
   </div>
   <div className="atlas-inspector-main">
    <div ref={viewport} className="atlas-inspector-viewport" tabIndex={0} aria-label="Diagram canvas. Scroll to pan when zoomed.">
     <div ref={canvas} className="rich atlas-inspector-canvas" style={{width}} dangerouslySetInnerHTML={{__html:figure.markup}}/>
    </div>
    <aside className="atlas-inspector-info" aria-label="Diagram details">
     <div aria-live="polite"><small>{active?.kind??'Explore'}</small><h3>{active?.title??figure.title}</h3><p>{active?.detail??(parts.length?'Tap a node or edge, or choose one below. Zoom in and scroll to pan.':figure.caption||'Zoom in to read the original figure, then scroll to pan.')}</p></div>
     {parts.length>0&&<label>Diagram element<select value={selected} onChange={e=>setSelected(Number(e.target.value))}><option value={-1}>Choose a node or edge</option>{parts.map(({title,kind},i)=><option key={i} value={i}>{kind} · {title}</option>)}</select></label>}
    </aside>
   </div>
  </div>
 </dialog>;
}

export function DiagramRich({html,className='',inspect=true}){
 const host=useRef(null);
 const [figure,setFigure]=useState(null);
 const calculation=useTableCalculations(host,html);
 useLayoutEffect(()=>{
  if(!inspect||!/<svg|<img/i.test(html))return;
  const visuals=[...host.current.querySelectorAll('svg,figure img')];
  const buttons=visuals.map(visual=>{
   const wrapper=visual.closest('figure')||visual;
   const button=document.createElement('button');
   button.type='button';
   button.className='atlas-inspect-open';
   button.textContent='Inspect diagram';
   const title=visual.getAttribute('aria-label')||visual.getAttribute('alt')||textOf(wrapper.querySelector('figcaption strong, figcaption'))||'Study diagram';
   button.setAttribute('aria-label','Inspect diagram: '+title);
   button.addEventListener('click',()=>{
    const copy=visual.cloneNode(true);
    const suffix='-inspector';
    const ids=[...copy.querySelectorAll('[id]')].map(el=>el.id);
    for(const el of copy.querySelectorAll('*'))for(const attr of [...el.attributes]){
     if(attr.name==='id')el.id+=suffix;
     else for(const id of ids)if(attr.value.includes('url(#'+id+')'))el.setAttribute(attr.name,attr.value.replaceAll('url(#'+id+')','url(#'+id+suffix+')'));
    }
    if(copy.matches('img'))copy.removeAttribute('loading');
    setFigure({title,markup:copy.outerHTML,caption:textOf(wrapper.querySelector('figcaption'))});
   });
   if(wrapper===visual)visual.after(button);
   else wrapper.append(button);
   return button;
  });
  return ()=>buttons.forEach(button=>button.remove());
 },[html,inspect]);
 return <><div ref={host} className={'rich '+className} dangerouslySetInnerHTML={{__html:html}}/><TableCalculation active={calculation}/>{figure&&<Inspector figure={figure} close={()=>setFigure(null)}/>}</>;
}
