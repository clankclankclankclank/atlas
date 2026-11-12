const binary = n => n.toString(2).padStart(3, '0');
const shuffle = n => ((n << 1) & 7) | (n >> 2);
const ports = Array.from({length:8}, (_, i) => i);
const row = n => 57 + 28 * n;
const wire = (x1,y1,x2,y2,selected) => '<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" fill="none" stroke="'+(selected?'currentColor':'#7c8090')+'" stroke-width="'+(selected?'3':'1')+'" opacity="'+(selected?'1':'.5')+'"/>';

export function omegaDiagram() {
  let output = 5;
  const route = [2, 1, 0].map(bit => {
    const input = shuffle(output);
    output = (input & 6) | ((3 >> bit) & 1);
    return {input, output};
  });
  const stages = [175,350,525];
  const lines = stages.flatMap((x, stage) => ports.map(n =>
    wire(stage === 0 ? 59 : stages[stage-1]+38, row(n), x, row(shuffle(n)), shuffle(n) === route[stage].input)));
  lines.push(...ports.map(n => wire(563,row(n),646,row(n),n===3)));
  const switches = stages.flatMap((x,stage) => Array.from({length:4},(_,i)=>{
    const y=row(2*i);
    const current=route[stage];
    return '<rect x="'+x+'" y="'+(y-11)+'" width="38" height="50" rx="5" fill="var(--panel)" stroke="currentColor" stroke-opacity=".5"/>'+
      (current.input>>1===i ? wire(x,row(current.input),x+38,row(current.output),true) : '')+
      '<text x="'+(x+19)+'" y="'+(y+18)+'" text-anchor="middle">S'+i+'</text>';
  }));
  const labels = ports.flatMap(n => [
    '<text x="14" y="'+(row(n)+4)+'">'+binary(n)+'</text>',
    '<text x="655" y="'+(row(n)+4)+'">'+binary(n)+'</text>'
  ]);
  return '<figure><svg viewBox="0 0 700 270" role="img" aria-label="Eight by eight omega network with three perfect shuffle stages and a highlighted route from computer 101 to memory 011" style="width:100%;max-width:760px;color:var(--accent);font:12px monospace">'+
    '<g fill="currentColor"><text x="9" y="23">CPU</text><text x="162" y="23">Stage 1</text><text x="337" y="23">Stage 2</text><text x="512" y="23">Stage 3</text><text x="647" y="23">Memory</text>'+lines.join('')+switches.join('')+labels.join('')+
    '</g></svg><figcaption>Highlighted route from CPU 101 to memory 011. The destination bits select the output port at each stage.</figcaption></figure>';
}

export function messageDiagram(label, participants, messages) {
  const columns = participants.map((_,i)=>90+i*150);
  const width = columns.at(-1)+90;
  const height = 65+messages.length*42;
  const lifelines = participants.map((name,i)=>'<text x="'+columns[i]+'" y="23" text-anchor="middle">'+name+'</text><path d="M'+columns[i]+' 32V'+(height-10)+'" stroke="currentColor" stroke-dasharray="4 5" opacity=".55"/>');
  const arrows = messages.map(([from,to,text],i)=>{
    const a=columns[from], b=columns[to], y=58+i*42, direction=Math.sign(b-a);
    return '<text x="'+((a+b)/2)+'" y="'+(y-7)+'" text-anchor="middle">'+text+'</text><path d="M'+a+' '+y+'H'+b+'m'+(-direction*7)+' -4 '+(direction*7)+' 4 '+(-direction*7)+' 4" fill="none" stroke="currentColor"/>';
  });
  return '<figure><svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+label+'" style="width:100%;max-width:720px;color:var(--accent);font:12px system-ui"><g fill="currentColor">'+lifelines.join('')+arrows.join('')+'</g></svg></figure>';
}

export const rpcDiagram=messageDiagram('RPC request and reply between two stubs', ['Caller','Client stub','Server stub','Procedure'], [[0,1,'Call'],[1,2,'Marshaled request'],[2,3,'Local call'],[3,2,'Return'],[2,1,'Marshaled reply'],[1,0,'Result']]);
export const probeDiagram=messageDiagram('Chandy Misra Haas probe returns to its initiator', ['P1','P2','P3'], [[0,1,'probe(1,1,2)'],[1,2,'probe(1,2,3)'],[2,0,'probe(1,3,1)']]);
export const electionDiagram=messageDiagram('Bully election with process 3 as the highest live process', ['P1','P2','P3'], [[0,1,'ELECTION'],[0,2,'ELECTION'],[1,0,'OK'],[2,0,'OK'],[1,2,'ELECTION'],[2,1,'OK'],[2,1,'COORDINATOR'],[2,0,'COORDINATOR']]);
export const berkeleyDiagram=messageDiagram('Berkeley coordinator polling and correction', ['Worker A','Coordinator','Worker B'], [[1,0,'Poll'],[1,2,'Poll'],[0,1,'Adjusted reading'],[2,1,'Adjusted reading'],[1,0,'Offset'],[1,2,'Offset']]);

export const ringDiagram=messageDiagram('Ring election and announcement follow the same successor order', ['P1','P2','P3'], [[0,1,'Candidate: 1'],[1,2,'Candidate: 2'],[2,0,'Candidate: 3'],[0,1,'Coordinator: 3'],[1,2,'Coordinator: 3'],[2,0,'Coordinator: 3']]);
