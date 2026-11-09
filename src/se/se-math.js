
export const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const fmt=(x,d=2)=>Number(x).toLocaleString('en-IN',{maximumFractionDigits:d});
export const para=s=>'<p>'+s+'</p>';
export const table=(heads,rows)=>'<div class="se-table"><table><thead><tr>'+heads.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
export const list=items=>'<ul>'+items.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
export const modes={organic:[2.4,1.05,2.5,.38],semi:[3,1.12,2.5,.35],embedded:[3.6,1.2,2.5,.32]};
export function cocomo(kloc,mode,rate=0){const [a,b,c,d]=modes[mode];const effort=a*kloc**b,time=c*effort**d;return {effort,time,staff:effort/time,cost:effort*rate};}
export const weights={EI:[3,4,6],EO:[4,5,7],EQ:[3,4,6],ILF:[7,10,15],EIF:[5,7,10]};
export function points(counts,di){const subtotals=Object.entries(weights).map(([key,ws])=>[key,counts[key].reduce((sum,n,j)=>sum+n*ws[j],0)]);const ufp=subtotals.reduce((s,[,n])=>s+n,0),factor=.65+.01*di;return {subtotals,ufp,factor,fp:ufp*factor};}
export const pert=(o,m,p)=>({t:(o+4*m+p)/6,v:((p-o)/6)**2});
export function schedule(rows){
 const byId=new Map();
 for(const [id,d,prev] of rows){const es=Math.max(0,...prev.map(p=>byId.get(p).ef));byId.set(id,{id,d,prev,es,ef:es+d});}
 const items=[...byId.values()],total=Math.max(...items.map(x=>x.ef));
 for(const x of [...items].reverse()){const next=items.filter(s=>s.prev.includes(x.id));x.lf=next.length?Math.min(...next.map(s=>s.ls)):total;x.ls=x.lf-x.d;x.slack=x.ls-x.es;}
 return {items,total};
}
