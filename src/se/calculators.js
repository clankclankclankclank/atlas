
import labs from './lab-config.json';
import {fmt,table,modes,cocomo,points,pert,schedule} from './se-math.js';
export {labs};
const metric=s=>'<div class="metric">'+s+'</div>';
const error=s=>({error:s});
const numbers=s=>s.trim().split(/[\s,]+/).map(Number);
export function calculate(lab,values){
 const v=k=>Number(values[k]);
 const bad=(...fields)=>fields.some(k=>!String(values[k]).trim()||!Number.isFinite(v(k))||v(k)<0);
 const whole=(...fields)=>fields.every(k=>Number.isInteger(v(k)));
 switch(lab.method){
 case 'cocomo': {
  if(bad('k','rate')||v('k')<=0||!modes[values.mode])return error('Enter positive KLOC and a nonnegative monthly rate.');
  const r=cocomo(v('k'),values.mode,v('rate'));
  return {html:metric(fmt(r.effort)+' person-months')+table(['Measure','Value'],[['Development time',fmt(r.time)+' months'],['Average staffing',fmt(r.staff)],['Labour cost',fmt(r.cost)]])};
 }
 case 'fp': {
  const types=['EI','EO','EQ','ILF','EIF'];const counts=Object.fromEntries(types.map(k=>[k,numbers(values[k])]));
  if(Object.values(counts).some(ns=>ns.length!==3||ns.some(x=>!Number.isInteger(x)||x<0))||bad('di')||v('di')>70||!whole('di'))return error('Give three nonnegative whole counts per type and an integer DI from 0 to 70.');
  const r=points(counts,v('di'));return {html:metric(fmt(r.fp)+' adjusted FP')+'<p>UFP '+r.ufp+' · CAF '+fmt(r.factor)+'</p>'+table(['Type','Weighted subtotal'],r.subtotals)};
 }
 case 'cfg':
  if(bad('edges','nodes','parts')||!whole('edges','nodes','parts')||v('parts')<1||v('parts')>v('nodes')||v('edges')<v('nodes')-v('parts'))return error('Enter feasible whole counts for edges, nodes and components.');
  return {html:metric('V(G) = '+(v('edges')-v('nodes')+2*v('parts')))+'<p>E − N + 2P. For a connected flow graph, P = 1.</p>'};
 case 'coverage':
  if(bad('done','total')||!whole('done','total')||!v('total')||v('done')>v('total'))return error('Use whole counts and a total larger than zero.');
  return {html:metric(fmt(100*v('done')/v('total'))+'% coverage')+'<p>Remaining targets: '+fmt(v('total')-v('done'))+'.</p>'};
 case 'pert': {
  if(bad('o','m','p')||v('o')>v('m')||v('m')>v('p'))return error('Use ordered times O ≤ M ≤ P.');
  const r=pert(v('o'),v('m'),v('p'));return {html:metric(fmt(r.t,3)+' expected time units')+'<p>Variance '+fmt(r.v,3)+' time units² · standard deviation '+fmt(Math.sqrt(r.v),3)+'.</p>'};
 }
 case 'cpm': {
  const raw=values.network.split(';').map(s=>s.trim()).filter(Boolean);if(!raw.length||raw.length>40)return error('Enter 1–40 activities.');
  const rows=[],seen=new Set();
  for(const line of raw){const parts=line.split(':');const [id,time,pre='']=parts.map(s=>s.trim());const d=Number(time);const pred=pre?pre.split(',').map(x=>x.trim()):[];
   if(parts.length<2||parts.length>3||!id||!/^[A-Za-z0-9_-]+$/.test(id)||seen.has(id)||!time||!Number.isFinite(d)||d<0||pred.some(x=>!seen.has(x)))return error('Use ID:duration:pred1,pred2; place predecessors before their successors.');
   seen.add(id);rows.push([id,d,pred]);
  }
  const r=schedule(rows);return {html:metric(fmt(r.total)+' time units to finish')+table(['Task','ES','EF','LS','LF','Float'],r.items.map(x=>[x.id,...['es','ef','ls','lf','slack'].map(k=>fmt(x[k],4))]))+'<p>Critical tasks: '+r.items.filter(x=>Math.abs(x.slack)<1e-9).map(x=>x.id).join(', ')+'.</p>'};
 }
 case 'risk':
  if(bad('before','after','loss','cost')||v('before')>100||v('after')>100)return error('Use probabilities from 0% to 100% and nonnegative losses/costs.');
  return {html:metric(fmt((v('before')-v('after'))/100*v('loss')-v('cost'))+' expected net benefit')+table(['Exposure','Value'],[['Before',fmt(v('before')*v('loss')/100)],['After',fmt(v('after')*v('loss')/100)]])};
 case 'reliability': {
  if(bad('uptime','down','fail','mission')||!v('uptime')||!v('fail')||!whole('fail'))return error('Enter positive uptime, at least one failure, and nonnegative repair and mission times.');
  const mttf=v('uptime')/v('fail'),mttr=v('down')/v('fail'),lambda=1/mttf;
  return {html:metric(fmt(100*v('uptime')/(v('uptime')+v('down')),4)+'% availability')+table(['Measure','Value'],[['MTTF',fmt(mttf)],['MTTR',fmt(mttr)],['MTBF',fmt(mttf+mttr)],['Failure rate',fmt(lambda,6)],['Mission reliability',fmt(100*Math.exp(-lambda*v('mission')),4)+'%']])};
 }
 }
}
