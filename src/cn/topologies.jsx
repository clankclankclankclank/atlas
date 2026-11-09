import React,{useState} from 'react';
import {DiagramRich} from '../diagram-inspector.jsx';

const topologies={
 'A25-3(b)':{title:'2025 distance-vector network',nodes:{A:[70,66],B:[335,66],C:[335,235],D:[70,235]},links:[['A','D',1],['A','B',2],['B','C',3],['C','D',11],['B','D',7]]},
 'A24-6(b)':{title:'2024 Dijkstra network from A',nodes:{A:[65,145],B:[210,65],C:[210,155],D:[110,253],E:[345,251],F:[365,142],G:[475,63]},links:[['A','B',4],['A','C',5],['A','D',3],['B','C',2],['B','F',3],['B','G',4],['C','D',6],['C','E',4],['C','F',4],['D','E',3],['E','F',2],['F','G',5]]},
 'A23-6(a)':{title:'2023 distance-vector network at C',nodes:{B:[70,66],C:[335,66],D:[335,235],E:[70,235]},links:[['B','C',1],['C','D',2],['C','E',5],['B','E',2],['D','E',2]]},
 'A22-6(b)':{title:'2022 distance-vector network',nodes:{A:[80,64],B:[244,65],C:[440,95],D:[365,245],E:[103,244]},links:[['A','B',7],['A','E',1],['B','E',8],['B','C',1],['C','D',2],['E','D',2]]}
};

function markup({title,nodes,links}){
 const edges=links.map(([a,b,cost])=>{
  const [x,y]=nodes[a],[u,v]=nodes[b],mx=(x+u)/2,my=(y+v)/2;
  return '<path data-inspect-edge="Router '+a+' — Router '+b+'" data-inspect-detail="Direct bidirectional link with routing cost '+cost+'. Path costs add across consecutive links." d="M'+x+' '+y+'L'+u+' '+v+'"/><text data-edge-label x="'+mx+'" y="'+my+'">'+cost+'</text>';
 }).join('');
 const routers=Object.entries(nodes).map(([name,[x,y]])=>{
  const neighbors=links.filter(([a,b])=>a===name||b===name).map(([a,b,cost])=>(a===name?b:a)+' (cost '+cost+')').join(', ');
  return '<g data-inspect-node="Router '+name+'" data-inspect-detail="Direct neighbors: '+neighbors+'." transform="translate('+x+' '+y+')"><circle r="22"/><text y="1">'+name+'</text></g>';
 }).join('');
 return '<figure class="cn-topology"><figcaption><strong>'+title+'</strong><span>Undirected links · labels are routing costs</span></figcaption><svg class="atlas-network-svg" viewBox="0 0 540 300" role="img" aria-label="'+title+'">'+edges+routers+'</svg></figure>';
}

export function NetworkTopology({id}){
 return topologies[id]?<DiagramRich html={markup(topologies[id])}/>:null;
}

export function NetworkStudio({openQuestion}){
 const [id,setId]=useState(Object.keys(topologies)[0]);
 return <section className="atlas-network-studio surface">
  <label>Past-paper topology<select className="field" value={id} onChange={e=>setId(e.target.value)}>{Object.entries(topologies).map(([key,value])=><option key={key} value={key}>{value.title}</option>)}</select></label>
  <NetworkTopology id={id}/>
  <button type="button" className="button secondary" onClick={()=>openQuestion(id)}>Open worked question</button>
 </section>;
}
