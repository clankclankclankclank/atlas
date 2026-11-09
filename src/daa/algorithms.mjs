export const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const para = s => '<p>'+s+'</p>';
export const title = s => '<h3>'+s+'</h3>';
export const code = s => '<pre><code>'+esc(s)+'</code></pre>';
export const answer = (result,why) => '<p class="result"><strong>'+result+'</strong></p>'+para(why);
export const tab = (heads,rows,hot=new Set(),rowHead=false) => '<div class="trace-table" tabindex="0" role="region" aria-label="Scrollable algorithm table"><table><thead><tr>'+heads.map(c=>'<th scope="col">'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map((row,i)=>'<tr>'+row.map((c,j)=>{const tag=rowHead&&j===0?'th':'td';return '<'+tag+(tag==='th'?' scope="row"':'')+(hot.has(i+','+j)?' class="trace-hot"':'')+'>'+esc(c)+'</'+tag+'>';}).join('')+'</tr>').join('')+'</tbody></table></div>';
const part=(label,html)=>({label,html});
const grid=(r,c,seed=0)=>Array.from({length:r},()=>Array(c).fill(seed));
export function treeDrawing(root,caption,{level=Infinity,focus=-1,note=''}={}) {
  const nodes=[], edges=[];
  let leaf=0, maxDepth=0;
  function visit(node, depth){
    const item={...node,depth,x:0}; nodes.push(item);maxDepth=Math.max(maxDepth,depth);
    if(node.children?.length){const kids=node.children.map(child=>visit(child,depth+1));item.x=(kids[0].x+kids.at(-1).x)/2;kids.forEach((child,i)=>edges.push([item,child,node.edges?.[i]??'']));}
    else item.x=leaf++;
    return item;
  }
  visit(root,0);
  const w=Math.max(360,leaf*100),h=74+maxDepth*88,x=n=>w*(n.x+.5)/leaf,y=n=>38+n.depth*88;
  const edgesHtml=edges.filter(([,b])=>b.depth<=level).map(([a,b,l])=>'<path class="tree-edge" d="M'+x(a)+' '+(y(a)+23)+' L'+x(b)+' '+(y(b)-23)+'"/>'+(l!==''?'<text class="tree-bit" x="'+((x(a)+x(b))/2+7)+'" y="'+((y(a)+y(b))/2-4)+'">'+esc(l)+'</text>':'')).join('');
  const nodesHtml=nodes.filter(n=>n.depth<=level).map(n=>'<g class="tree-node '+(n.depth===focus?'tree-focus':'')+'" transform="translate('+x(n)+' '+y(n)+')"><rect x="-43" y="-23" width="86" height="46" rx="9"/><text y="'+(n.sub?-4:4)+'">'+esc(n.label)+'</text>'+(n.sub?'<text class="tree-sub" y="13">'+esc(n.sub)+'</text>':'')+'</g>').join('');
  return '<figure class="se-diagram daa-diagram"><figcaption><span>TRACE</span><strong>'+esc(caption)+'</strong></figcaption><div class="se-drawing" tabindex="0" aria-label="'+esc(caption)+'"><svg viewBox="0 0 '+w+' '+h+'" style="--diagram-width:'+w+'px" role="img" aria-label="'+esc(caption)+'">'+edgesHtml+nodesHtml+'</svg></div>'+(note?para(note):'')+'</figure>';
}
const gcd=(a,b)=>b?gcd(b,a%b):a;
export function recurrence({factors,a,b,toll='n',depth=2,caption='Recurrence tree',levels=[],result,reason}){
  const ratios=factors??Array.from({length:a},()=>[1,b]);
  function make(num,den,d){
    const g=gcd(num,den);num/=g;den/=g;
    const size=(num===1?'':num)+'n'+(den===1?'':'/'+den);
    let cost=toll==='n'?size:toll==='1'?'1':toll==='6'?'6':toll.replaceAll('n',d?'('+size+')':'n');
    return {label:'T('+size+')',sub:'work '+cost,children:d<depth?ratios.map(([x,y])=>make(num*x,den*y,d+1)):[]};
  }
  const root=make(1,1,0), display=treeDrawing(root,caption,{note:'The drawing expands the first '+(depth+1)+' levels. Node labels give subproblem sizes and local work.'});
  return {html:answer(result,reason)+display+(levels.length?tab(['Level','Nodes','Work on level'],levels):''),diagram:display,steps:Array.from({length:depth+1},(_,i)=>part('Expand depth '+i,treeDrawing(root,caption,{level:i,focus:i,note:levels[i]?'Total local work at depth '+i+' = '+levels[i][2]+'.':'Highlighted nodes are at depth '+i+'.'})))};
}
export function lcs(x,y){
  const d=grid(x.length+1,y.length+1);
  for(let i=1;i<=x.length;i++)for(let j=1;j<=y.length;j++)d[i][j]=x[i-1]===y[j-1]?1+d[i-1][j-1]:Math.max(d[i-1][j],d[i][j-1]);
  let i=x.length,j=y.length,seq='', path=new Set([i+','+(j+1)]);
  const table=(last=x.length,marked=path)=>tab(['X ∖ Y','∅',...y],d.slice(0,last+1).map((r,k)=>[x[k-1]??'∅',...r]),marked,true);
  const moves=[], traceback=[];
  while(i&&j){
    const from='('+i+', '+j+')';
    let move;
    if(x[i-1]===y[j-1]){move='Match '+x[i-1]+' and move diagonally';seq=x[i-1]+seq;i--;j--;}
    else if(d[i-1][j]>=d[i][j-1]){move='Move up to the greater or tied value';i--;}
    else {move='Move left to the greater value';j--;}
    path.add(i+','+(j+1));moves.push([from,move,'('+i+', '+j+')',seq||'∅']);
    traceback.push(part(move,table(x.length,path)+para('Reached ('+i+', '+j+'). Recovered suffix: '+esc(seq||'∅')+'.')));
  }
  const full=table();
  const steps=[part('Initialize row and column 0',tab(['X ∖ Y','∅',...y],[['∅',...d[0]]],new Set(),true)),...d.slice(1).map((_,k)=>part('Fill row '+(k+1)+' for '+x[k],tab(['X ∖ Y','∅',...y],d.slice(0,k+2).map((r,t)=>[x[t-1]??'∅',...r]),new Set(d[k+1].map((v,c)=>(k+1)+','+(c+1))),true))),...traceback,part('Backtracking complete · '+seq,full+tab(['From','Move','To','Suffix found'],moves))];
  return {html:answer('LCS '+esc(seq||'∅')+' · length '+seq.length,'For matching symbols, L[i,j] = 1 + L[i−1,j−1]. Otherwise take max(L[i−1,j], L[i,j−1]). Initialize row and column 0 to zero. Green cells show one optimal traceback, choosing up on equal values.')+full+title('Traceback from the bottom-right')+tab(['From','Move','To','Suffix found'],moves)+para('The table takes Θ(mn) time and space. The direct recursive version below can take exponential time. Memoizing the same states gives Θ(mn) worst-case time.')+code('L(i, j):\n  if i == 0 or j == 0: return 0\n  if X[i-1] == Y[j-1]: return 1 + L(i-1, j-1)\n  return max(L(i-1, j), L(i, j-1))'),steps,value:seq};
}
export function matrixChain(p){
  const n=p.length-1,m=grid(n,n),s=grid(n,n,null),steps=[];
  const show=(data,spot=new Set())=>tab(['i ∖ j',...Array.from({length:n},(_,i)=>i+1)],data.map((row,i)=>[i+1,...row.map((v,j)=>j<i?'—':v??'·')]),spot,true);
  const matrixInputs=tab(['Matrix','Dimensions'],p.slice(0,-1).map((x,i)=>['A'+(i+1),x+' × '+p[i+1]]));
  for(let len=2;len<=n;len++){
    const hot=new Set(),tries=[];
    for(let i=0;i+len<=n;i++){
      const j=i+len-1;m[i][j]=Infinity;hot.add(i+','+(j+1));
      for(let k=i;k<j;k++){
        const cost=m[i][k]+m[k+1][j]+p[i]*p[k+1]*p[j+1];
        tries.push([i+1,j+1,k+1,m[i][k]+' + '+m[k+1][j]+' + '+p[i]+'×'+p[k+1]+'×'+p[j+1],cost]);
        if(cost<m[i][j]){m[i][j]=cost;s[i][j]=k+1;}
      }
    }
    const snapshot=m.map((row,i)=>row.map((v,j)=>j-i>=len?null:v));
    steps.push(part('Chains of length '+len,show(snapshot,hot)+tab(['Start','End','Split','Candidate','Cost'],tries)));
  }
  function build(i,j){if(i===j)return 'A'+(i+1);const k=s[i][j]-1;return '('+build(i,k)+' × '+build(k+1,j)+')';}
  const expression=build(0,n-1);
  return {html:answer(m[0][n-1]+' scalar multiplications · '+expression,'For each interval [i,j], try split k. Combining the two products costs p[i−1]·p[k]·p[j] using one-based matrix indices.')+matrixInputs+title('Minimum cost m[i,j]')+show(m,new Set(['0,'+n]))+title('Best split s[i,j]')+show(s)+code('M(i, j):\n  if i == j: return 0\n  return min over i <= k < j of\n    M(i,k) + M(k+1,j) + p[i-1]*p[k]*p[j]')+para('Fill diagonals by increasing length or memoize. Θ(n³) time and Θ(n²) space. The split table reconstructs the parentheses.'),steps,value:m[0][n-1]};
}
export function knapsack(weights,values,W){
  const n=weights.length,d=grid(n+1,W+1),names=weights.map((_,i)=>String.fromCharCode(97+i));
  for(let i=1;i<=n;i++)for(let w=0;w<=W;w++)d[i][w]=Math.max(d[i-1][w],w>=weights[i-1]?values[i-1]+d[i-1][w-weights[i-1]]:-Infinity);
  let rem=W, chosen=[],path=new Set([n+','+(W+1)]),moves=[];
  for(let i=n;i>0;i--){
    const before=rem,take=d[i][rem]!==d[i-1][rem];
    if(take){chosen.unshift(names[i-1]);rem-=weights[i-1];}
    moves.push([names[i-1],before,d[i][before],take?'Take':'Skip',rem]);path.add((i-1)+','+(rem+1));
  }
  const table=(last,marks)=>tab(['Item ∖ capacity',...Array.from({length:W+1},(_,i)=>i)],d.slice(0,last+1).map((r,i)=>[names[i-1]??'∅',...r]),marks,true);
  const choices=tab(['Item','Capacity','Current value','Decision','Capacity left'],moves);
  const steps=weights.map((w,i)=>part('Item '+names[i]+' · weight '+w+' · value '+values[i],table(i+1,new Set(d[i+1].map((_,c)=>(i+1)+','+(c+1))))));
  steps.push(part('Trace the optimal selection',table(n,path)+choices));
  return {html:answer('Maximum value '+d[n][W]+' · '+(chosen.join(', ')||'empty set'),'The chosen items weigh '+(W-rem)+' of '+W+'. State K[i,w] is the maximum value using only the first i items with capacity w.')+tab(['Item','Value','Weight'],names.map((a,i)=>[a,values[i],weights[i]]))+para('Skip gives K[i−1,w]. Take gives vᵢ + K[i−1,w−wᵢ] when the item fits. Using the previous row prevents taking an item twice.')+table(n,path)+title('Recover the items')+choices+para('Θ(nW) time and space, pseudo-polynomial in W. A one-row value-only version uses descending capacities.'),steps,value:d[n][W]};
}
export function huffman(labels,weights,bits=''){
  let serial=labels.length;
  let queue=labels.map((label,i)=>({label,weight:weights[i],order:i,name:label}));
  const rows=[],steps=[];
  const fmt=node=>node.name+' ('+node.weight+')';
  while(queue.length>1){
    queue.sort((a,b)=>a.weight-b.weight||a.order-b.order);
    const [a,b]=queue.splice(0,2);
    const parent={label:'',weight:a.weight+b.weight,order:serial++,name:a.name+b.name,children:[a,b],edges:[0,1]};
    queue.push(parent);
    rows.push([rows.length+1,fmt(a),fmt(b),fmt(parent)]);
    steps.push(part('Merge '+fmt(a)+' and '+fmt(b),tab(['Step','Smallest','Second smallest','Reinsert'],rows)+para('Queue: '+esc([...queue].sort((x,y)=>x.weight-y.weight||x.order-y.order).map(fmt).join(' · ')))));
  }
  const root=queue[0], enc=new Map();
  function stamp(n,prefix){n.sub=n.children?'merge weight':n.label;n.label=String(n.weight);if(n.children){stamp(n.children[0],prefix+'0');stamp(n.children[1],prefix+'1');}else enc.set(n.name,prefix||'0');}
  stamp(root,'');
  const total=weights.reduce((a,b)=>a+b,0),weighted=labels.reduce((sum,l,i)=>sum+weights[i]*enc.get(l).length,0);
  const fixed=Math.ceil(Math.log2(labels.length))*total;
  const picture=treeDrawing(root,'Huffman prefix tree',{note:'0 follows the left edge and 1 follows the right edge. Equal weights use insertion order in the priority queue.'});
  let decode='',token='',at=root, chunks=[];
  for(const bit of bits){token+=bit;at=at.children[+bit];if(!at.children){decode+=at.name;chunks.push([token,at.name,decode]);token='';at=root;}}
  const decoding=bits?title('Decode '+esc(bits))+tab(['Bits','Symbol','Decoded prefix'],chunks)+para(token?'A trailing '+esc(token)+' ends at an internal node under this convention.':'The walk ends at a leaf and resets to the root after each decoded symbol.')+para('The bit string requires the same tree as the encoder. With tied weights or swapped left and right children, another optimal tree can decode it differently.'):'';
  const result=bits?(token?'Incomplete suffix under this tie convention':'Decoded string '+decode):'Average '+Number((weighted/total).toFixed(6))+' bits per symbol';
  steps.push(part('Read the final prefix tree',picture+decoding));
  return {html:answer(result,'Repeatedly merge the two smallest weights. A min-heap takes O(k log k) for k distinct symbols. Each symbol is a leaf, so no codeword is a prefix of another.')+tab(['Step','Smallest','Second smallest','Reinsert'],rows)+picture+tab(['Symbol','Weight','Code','Bits'],labels.map((l,i)=>[l,weights[i],enc.get(l),enc.get(l).length]))+para('Weighted encoded length '+weighted+' bits, compared with '+fixed+' fixed-width bits, excluding any codebook overhead.')+decoding,steps,diagram:picture,value:Object.fromEntries(enc),decoded:decode,valid:!token};
}
export function partition(input){
  const a=[...input],pivot=a.at(-1);let i=-1;
  const rows=[],steps=[];
  for(let j=0;j<a.length-1;j++){
    const test=a[j]+' ≤ '+pivot;
    const take=a[j]<=pivot;
    if(take){i++;[a[i],a[j]]=[a[j],a[i]];}
    rows.push([j,test,take?'Swap positions '+i+' and '+j:'No swap',i,a.join(', ')]);
    steps.push(part('Inspect position '+j,tab(['Index',...a.map((_,k)=>k)],[['Array',...a]],new Set(['0,'+(j+1),'0,'+a.length]),true)+para(esc(rows.at(-1)[2])+'. The pivot is '+pivot+'.')));
  }
  [a[i+1],a[a.length-1]]=[a[a.length-1],a[i+1]];
  steps.push(part('Place pivot in its final position',tab(['Index',...a.map((_,k)=>k)],[['Array',...a]],new Set(['0,'+(i+2)]),true)));
  return {html:answer('Pivot '+pivot+' placed at index '+(i+1)+' (zero based)','Lomuto uses the last element as pivot. Before each comparison, A[0…i] holds elements ≤ pivot and A[i+1…j−1] holds elements > pivot.')+tab(['j','Test','Action','i','Array after comparison'],rows)+para('Final swap produces ['+a.join(', ')+']. One partition uses Θ(n) time and Θ(1) extra space.'),steps,value:a};
}
export function heapify(input){
  const a=[...input],n=a.length,rows=[],steps=[];
  const snapshot=(i)=>{function child(k){return k<n?{label:String(a[k]),sub:'index '+(k+1),children:[child(2*k+1),child(2*k+2)].filter(Boolean)}:null;}return treeDrawing(child(0),'Max heap · processing index '+(i+1));};
  for(let i=Math.floor(n/2)-1;i>=0;i--){
    let k=i,swaps=[];
    while(2*k+1<n){
      let big=2*k+1;if(big+1<n&&a[big+1]>a[big])big++;
      if(a[big]<=a[k])break;
      swaps.push((k+1)+' ↔ '+(big+1));[a[k],a[big]]=[a[big],a[k]];k=big;
    }
    rows.push([i+1,swaps.join(', ')||'No swap',a.join(', ')]);
    steps.push(part('Heapify at index '+(i+1),snapshot(i)));
  }
  return {html:answer('Max heap ['+a.join(', ')+']','Start at ⌊n/2⌋ and work backwards to 1 with one-based indices. At each node, swap with the larger child while the heap property is violated.')+tab(['Root index','Swaps','Array'],rows)+steps.at(-1)?.html+para('Sum the node heights: at most n/2ʰ⁺¹ nodes of height h, so the total cost is Θ(n).'),steps,diagram:steps.at(-1)?.html,value:a};
}

const vertices = edges=>[...new Set(edges.flatMap(([a,b])=>[a,b]))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));
const edgeName=([a,b])=>a+'–'+b;
const distance=n=>Number.isFinite(n)?n:'∞';
export function graphDrawing(edges,{directed=false,active=[],caption='Weighted graph',positions}={}){
  const v=vertices(edges), coords=new Map(v.map((k,i)=>[k,positions?.[k]??[245+185*Math.sin(i*2*Math.PI/v.length),145-107*Math.cos(i*2*Math.PI/v.length)]]));
  const hot=new Set(active);
  const paths=edges.map((e,i)=>{
    const [a,b,weight]=e,[x,y]=coords.get(a),[u,w]=coords.get(b),dx=u-x,dy=w-y,d=Math.hypot(dx,dy);
    const dual=directed&&edges.some(([from,to])=>from===b&&to===a);
    const ox=dual?-dy/d*13:0,oy=dual?dx/d*13:0;
    const xx=(x+u)/2+ox,yy=(y+w)/2+oy;
    return '<path class="tree-edge '+(hot.has(i)?'graph-hot':'')+'" d="M'+(x+dx/d*17)+' '+(y+dy/d*17)+' Q'+(xx+ox)+' '+(yy+oy)+' '+(u-dx/d*18)+' '+(w-dy/d*18)+'"'+(directed?' marker-end="url(#daa-graph-arrow)"':'')+'/>'+(weight==null?'':'<text class="graph-weight" x="'+xx+'" y="'+(yy-4)+'">'+weight+'</text>');
  }).join('');
  const dots=v.map(k=>{const [x,y]=coords.get(k);return '<g class="tree-node" transform="translate('+x+' '+y+')"><circle r="16"/><text y="4">'+esc(k)+'</text></g>';}).join('');
  return '<figure class="se-diagram daa-diagram"><figcaption><span>GRAPH</span><strong>'+esc(caption)+'</strong></figcaption><div class="se-drawing" tabindex="0" aria-label="'+esc(caption)+'"><svg viewBox="0 0 490 290" style="--diagram-width:490px" role="img" aria-label="'+esc(caption)+'"><defs><marker id="daa-graph-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8Z" fill="context-stroke"/></marker></defs>'+paths+dots+'</svg></div></figure>';
}
export function spanning(edges,{start,positions,lead=''}={}){
  const v=vertices(edges), order=edges.map((e,i)=>[e,i]).sort(([a],[b])=>a[2]-b[2]||edgeName(a).localeCompare(edgeName(b)));
  const parent=new Map(v.map(k=>[k,k]));
  const root=k=>parent.get(k)===k?k:root(parent.get(k));
  const seen=new Set(start==null?[]:[start]),active=[], rows=[],steps=[];
  let cost=0;
  const name=start==null?'Kruskal':'Prim';
  const headers=['Edge','Weight','Decision','State after decision','Cost'];
  function move([e,i],ok,state){
    if(ok){active.push(i);cost+=e[2];}
    rows.push([edgeName(e),e[2],ok?'Accept':'Reject · cycle',state,cost]);
    steps.push(part(rows.at(-1)[2]+' '+edgeName(e),graphDrawing(edges,{active,positions,caption:name+' · '+edgeName(e)})+tab(headers,rows)));
  }
  if(start!=null){
    while(seen.size<v.length){const next=order.find(([[a,b]])=>seen.has(a)!==seen.has(b));if(!next)break;seen.add(next[0][0]);seen.add(next[0][1]);move(next,true,[...seen].join(', '));}
  }else{
    for(const entry of order){
      const [[a,b]]=entry,A=root(a),B=root(b);
      if(A!==B)parent.set(B,A);
      const groups=new Map();
      for(const k of v){const key=root(k);groups.set(key,[...(groups.get(key)??[]),k]);}
      move(entry,A!==B,[...groups.values()].map(g=>'{'+g.join(',')+'}').join(' '));
    }
  }
  const diagram=graphDrawing(edges,{active,positions,caption:name+' minimum spanning tree'});
  const adj=tab(['Vertex','Adjacent vertex (weight)'],v.map(k=>[k,edges.filter(([a,b])=>a===k||b===k).map(([a,b,w])=>(a===k?b:a)+' ('+w+')').join(', ')]));
  return {html:answer('MST weight '+cost+' · '+active.map(i=>edgeName(edges[i])).join(', '),start==null?'Sort by weight and break ties by edge name. Accept an edge when its endpoints are in different disjoint sets. A complete tree has |V|−1 edges. The trace also checks remaining edges for cycles.':'Start at '+start+'. Take the cheapest edge crossing from the reached vertices to the rest. The cut property guarantees the edge is safe.')+lead+adj+diagram+tab(headers,rows)+para(start==null?'Sorting dominates at O(E log E) with union by rank and path compression.':'An adjacency-list implementation with a binary heap takes O(E log V).'),steps,diagram,value:cost};
}
export function dijkstra(edges,start,{directed=false,positions}={}){
  const v=vertices(edges),d=new Map(v.map(k=>[k,k===start?0:Infinity])), parent=new Map(), visited=new Set(),rows=[],steps=[];
  const hdr=['Settle',...v.map(k=>'d('+k+')')];
  rows.push(['Initial',...v.map(k=>distance(d.get(k)))]);
  const findEdges=()=>[...parent].map(([k,z])=>edges.findIndex(([a,b])=>(a===z&&b===k)||(!directed&&b===z&&a===k)));
  while(visited.size<v.length){
    const u=v.filter(k=>!visited.has(k)).sort((a,b)=>d.get(a)-d.get(b))[0];
    if(d.get(u)===Infinity)break;
    visited.add(u);
    const relax=[];
    for(const [a,b,w] of edges){
      const k=a===u?b:(!directed&&b===u?a:null);
      if(k==null||visited.has(k))continue;
      const candidate=d.get(u)+w, before=d.get(k);
      if(candidate<before){d.set(k,candidate);parent.set(k,u);}
      relax.push([u,k,before===Infinity?'∞':before,d.get(u)+' + '+w,candidate<before?'Update':'Keep']);
    }
    rows.push([u,...v.map(k=>distance(d.get(k)))]);
    steps.push(part('Settle '+u+' at distance '+d.get(u),graphDrawing(edges,{directed,positions,active:findEdges(),caption:'Tentative predecessor edges'})+tab(hdr,rows)+tab(['From','To','Old','Candidate','Decision'],relax)));
  }
  function path(k){if(d.get(k)===Infinity)return 'Unreachable';const route=[k];while(parent.has(k)){k=parent.get(k);route.unshift(k);}return route.join(' → ');}
  const diagram=graphDrawing(edges,{directed,positions,active:findEdges(),caption:'Shortest-path tree from '+start});
  return {html:answer('Shortest distances from '+start,'Initialize the source to 0 and other vertices to infinity. Repeatedly settle the least tentative unvisited distance and relax its outgoing edges. Nonnegative weights make each settled distance final.')+diagram+tab(hdr,rows)+tab(['Vertex','Distance','Route'],v.map(k=>[k,distance(d.get(k)),path(k)]))+para('Array selection takes Θ(V²+E). A binary heap with adjacency lists takes O((V+E) log V).'),steps,diagram};
}
export function floyd(edges){
  const v=vertices(edges),d=grid(v.length,v.length,Infinity),next=grid(v.length,v.length,null);
  for(let i=0;i<v.length;i++){d[i][i]=0;next[i][i]=i;}
  for(const [a,b,w] of edges){const i=v.indexOf(a),j=v.indexOf(b);if(w<d[i][j]){d[i][j]=w;next[i][j]=j;}}
  const table=(hot=new Set())=>tab(['From ∖ To',...v],d.map((row,i)=>[v[i],...row.map(distance)]),hot,true);
  const steps=[part('Initialize direct edges',table())];
  for(let k=0;k<v.length;k++){
    const hot=new Set();
    for(let i=0;i<v.length;i++)for(let j=0;j<v.length;j++){
      const x=d[i][k]+d[k][j];
      if(x<d[i][j]){d[i][j]=x;next[i][j]=next[i][k];hot.add(i+','+(j+1));}
    }
    steps.push(part('Allow '+v[k]+' as an intermediate',table(hot)));
  }
  const routes=v.flatMap((a,i)=>v.flatMap((b,j)=>{
    if(i===j)return [];
    const path=[a];let k=i;
    while(k!==j&&next[k][j]!=null&&path.length<=v.length){k=next[k][j];path.push(v[k]);}
    return [[a,b,distance(d[i][j]),k===j?path.join(' → '):'—']];
  }));
  return {html:answer('All-pairs shortest-path matrix','At pass k, permit vertex k as an intermediate. D[i,j] ← min(D[i,j], D[i,k] + D[k,j]). Initialize the diagonal to 0, missing edges to infinity, and direct edges to their weights.')+table()+tab(['From','To','Distance','Shortest route'],routes)+para('Compare the intermediate matrices in the stepper. Time Θ(V³), space Θ(V²). A negative diagonal after the final pass signals a negative cycle.'),steps};
}
export function activities(starts,ends,ids=starts.map((_,i)=>i+1)){
  const all=starts.map((s,i)=>[ids[i],s,ends[i]]).sort((a,b)=>a[2]-b[2]||a[0]-b[0]);
  const picked=[],rows=[],steps=[];let end=-Infinity;
  for(const [i,s,f] of all){
    const ok=s>=end;if(ok){picked.push('a'+i);end=f;}
    rows.push(['a'+i,s,f,ok?'Accept':'Overlaps',end]);
    steps.push(part('Consider activity a'+i,tab(['Activity','Start','Finish','Decision','Last finish'],rows)));
  }
  return {html:answer(picked.length+' activities · '+picked.join(', '),'Sort by earliest finish. Add a compatible activity if its start is at least the last selected finish. Replacing the first activity in an optimum by the earliest finisher leaves at least as much room for the rest.')+tab(['Activity','Start','Finish','Decision','Last finish'],rows)+para('O(n log n) to sort, Θ(n) to scan. The scan uses half-open intervals, so a new activity may start when another ends.'),steps};
}
export function traverse(edges,start,{dfs=false,directed=false}={}){
  const v=vertices(edges), adj=new Map(v.map(k=>[k,[]]));
  for(const [a,b] of edges){adj.get(a).push(b);if(!directed)adj.get(b).push(a);}
  for(const list of adj.values())list.sort();
  const tree=[], rows=[], steps=[], visited=new Set(),clock=new Map();let tick=0;
  const hdr=dfs?['Event','Vertex','Stack','Time']:['Expanded','New discoveries','Queue'];
  const show=(label)=>steps.push(part(label,graphDrawing(edges,{directed,active:tree,caption:dfs?'DFS tree':'BFS tree'})+tab(hdr,rows)));
  const idx=(a,b)=>edges.findIndex(([x,y])=>x===a&&y===b||!directed&&x===b&&y===a);
  if(dfs){
    const stack=[];
    function walk(k){
      visited.add(k);stack.push(k);const entry=++tick;rows.push(['Push',k,stack.join(' → '),entry]);show('Discover '+k);
      for(const a of adj.get(k))if(!visited.has(a)){tree.push(idx(k,a));walk(a);}
      stack.pop();clock.set(k,[entry,++tick]);rows.push(['Pop',k,stack.join(' → ')||'∅',tick]);show('Finish '+k);
    }
    walk(start);for(const k of v)if(!visited.has(k))walk(k);
  }else{
    visited.add(start);
    const queue=[start];
    while(queue.length){
      const k=queue.shift(), newItems=[];
      for(const a of adj.get(k))if(!visited.has(a)){visited.add(a);queue.push(a);tree.push(idx(k,a));newItems.push(a);}
      rows.push([k,newItems.join(', ')||'—',queue.join(' → ')||'∅']);show('Expand '+k);
    }
  }
  const diagram=graphDrawing(edges,{directed,active:tree,caption:dfs?'DFS discovery tree':'BFS discovery tree'});
  const types=dfs?tab(['Edge','Classification'],edges.map(([a,b],i)=>{const [ad,af]=clock.get(a),[bd,bf]=clock.get(b);return [a+' → '+b,tree.includes(i)?'Tree':bd<ad&&af<bf?'Back':ad<bd&&bf<af?'Forward':'Cross'];})):'';
  return {html:answer((dfs?'Discovery order ':'BFS order ')+[...visited].join(' → '),dfs?'Use recursion with an explicit trace of the call stack. Scan neighbors alphabetically. Discovery and finish times determine edge classes.':'Use a FIFO queue and mark neighbors on enqueue, in alphabetical order. This prevents a vertex from being discovered twice.')+diagram+tab(hdr,rows)+types+para('With adjacency lists, time and space are O(V+E) and O(V) extra respectively.'),steps,diagram};
}
