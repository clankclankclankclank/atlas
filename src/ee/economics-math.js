const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export const fmt=(n,d=2)=>Number(n).toLocaleString('en-IN',{maximumFractionDigits:d});
export const A=(i,n)=>i===0?n:(-Math.expm1(-n*Math.log1p(i)))/i;
export const F=(i,n)=>i===0?n:Math.expm1(n*Math.log1p(i))/i;
export const G=(i,n)=>i===0?(n-1)/2:1/i-n/Math.expm1(n*Math.log1p(i));
export const pv=(p,a,s,i,n)=>-p+a*A(i,n)+s/(1+i)**n;
export const npv=(cash,i)=>cash.reduce((v,c,t)=>v+c/(1+i)**t,0);
export const irr=cash=>{let a=-.999999,b=1;while(npv(cash,b)>0)b=b*2+1;for(let j=0;j<100;j++){let m=(a+b)/2;if(npv(cash,m)>0)a=m;else b=m;}return (a+b)/2;};
export const flows=(p,a,s,n)=>[-p,...Array.from({length:n},(_,i)=>a+(i===n-1?s:0))];
const money=(n,c='₹')=>c+fmt(n);
export const table=(head,rows)=>'<table><thead><tr>'+head.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
export function dep(p,s,n,kind,i=0){
 const rows=[];let b=p;
 for(let t=1;t<=n;t++){
  let d=kind==='SL'?(p-s)/n:kind==='SF'?(p-s)/F(i,n)*(1+i)**(t-1):kind==='SYD'?(p-s)*(n-t+1)/(n*(n+1)/2):Math.min(b-s,b*i);
  b-=d;rows.push([t,d,p-b,b]);
 }
 return rows;
}
