
import labs from './lab-config.json';
import {A,F,G,fmt,pv,irr,npv,flows,table,dep} from './economics-math.js';
export {labs};
const metric=s=>'<div class="metric">'+s+'</div>';
export function calculate(lab,values){
 const v=Object.fromEntries(Object.entries(values).map(([k,x])=>[k, k==='kind'?x:Number(x)]));
 const {p,s,n,m,i,a,g,om,price,variable,fixed,q,kind}=v;
 const rate=i/100;
 if(Object.entries(values).some(([k,x])=>k!=='kind'&&(String(x).trim()===''||!Number.isFinite(v[k]))))return {error:'Enter valid numbers in all fields.'};
 if(n!==undefined&&(!Number.isInteger(n)||n<1||n>100))return {error:'Enter a whole number of years from 1 to 100.'};
 if(i!==undefined&&i<0)return {error:'Use a nonnegative rate for this exercise.'};
 let html;
 switch(lab.method){
 case 'effective':
  if(!Number.isInteger(m)||m<1||m>365)return {error:'Enter 1–365 compounding periods per year.'};
  html=metric(fmt(100*Math.expm1(m*Math.log1p(rate/m)),4)+'% effective annually')+'<p>Periodic rate = '+fmt(i/m,4)+'%. Apply (1 + nominal rate / m)ᵐ − 1.</p>';break;
 case 'single':
  html=metric('Future value '+fmt(p*(1+rate)**n))+'<p>Multiply '+fmt(p)+' by (1 + '+fmt(i)+'%)ⁿ with n = '+n+'.</p>';break;
 case 'annuity':
  html=metric('Future worth '+fmt(a*F(rate,n)))+'<p>Present worth '+fmt(a*A(rate,n))+' · F/A = '+fmt(F(rate,n),5)+' · P/A = '+fmt(A(rate,n),5)+'. Payments occur at year end.</p>';break;
 case 'gradient':
  html=metric('Future worth '+fmt((a+g*G(rate,n))*F(rate,n)))+'<p>Annual equivalent '+fmt(a+g*G(rate,n))+' · A/G = '+fmt(G(rate,n),5)+'. The first payment is '+fmt(a)+' and the final payment is '+fmt(a+(n-1)*g)+'.</p>';break;
 case 'worth': {
  if(p<=0||om<0||a<0||s<0)return {error:'Use a positive initial cost and nonnegative benefits, salvage and O&M.'};
  const present=pv(p,a-om,s,rate,n);
  html=metric('Net present worth '+fmt(present))+table(['Measure','Result'],[['PW benefits',fmt(a*A(rate,n)+s/(1+rate)**n)],['PW costs',fmt(p+om*A(rate,n))],['Future worth',fmt(present*(1+rate)**n)],['Annual worth',fmt(present/A(rate,n))],['Benefit–cost ratio',fmt((a*A(rate,n)+s/(1+rate)**n)/(p+om*A(rate,n)),4)]]);
  break;
 }
 case 'return': {
  if(p<=0||a<=0||s<0)return {error:'Use positive first cost and annual net inflow, and nonnegative salvage.'};
  const cash=flows(p,a,s,n), returnRate=irr(cash), year=Math.ceil(p/a);
  const payback=p<=a*n?fmt(p/a)+' years':p<=a*n+s?n+' years (salvage at year end)':'Beyond the study period';
  html=metric('IRR '+fmt(returnRate*100,4)+'%')+'<p>NPV at '+fmt(i)+'% = '+fmt(npv(cash,rate))+'. Simple payback: '+payback+'.</p>'+table(['Year','Cash flow','Cumulative'],cash.map((x,t)=>[t,fmt(x),fmt(cash.slice(0,t+1).reduce((z,y)=>z+y,0))]));
  break;
 }
 case 'depreciation': {
  if(p<0||s<0||s>p||i>100)return {error:'Require 0 ≤ salvage ≤ first cost and a rate between 0% and 100%.'};
  const rows=dep(p,s,n,kind,rate);
  html=metric('Final book value '+fmt(rows.at(-1)[3]))+'<p>'+({SL:'Equal annual charges.',SF:'Annual charge includes interest on the prior fund balance.',DB:'Apply the rate to opening book value with a salvage floor.',SYD:'Apply remaining life divided by the sum of year digits.'}[kind])+'</p>'+table(['Year','Depreciation','Accumulated','Book value'],rows.map(([t,d,c,b])=>[t,fmt(d),fmt(c),fmt(b)]));
  break;
 }
 case 'break': {
  if(price<=variable||variable<0||fixed<0||q<0)return {error:'Use a selling price above variable cost and nonnegative costs and sales.'};
  const contribution=price-variable,be=fixed/contribution;
  html=metric(fmt(be)+' break-even units')+table(['Measure','Result'],[['Whole units required',Math.ceil(be)],['Break-even revenue',fmt(be*price)],['P/V ratio',fmt(100*contribution/price)+'%'],['Profit at actual sales',fmt(q*contribution-fixed)],['Margin of safety (units)',fmt(q-be)],['Margin of safety (%)',q?fmt(100*(q-be)/q)+'%':'Undefined at zero actual sales']]);
  break;
 }
 }
 return {html};
}
