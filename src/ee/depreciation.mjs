import {calculationCell,calculationDetails} from '../calculation-markup.mjs';

const fmt=(value,precision=8)=>Number(value).toLocaleString('en-IN',{maximumFractionDigits:precision});
const plain=value=>String(Number(value.toPrecision(13)));
const shown=value=>fmt(value,2);

export function depreciationSchedule(P,S,n,method,i,unit=''){
 const amount=P-S;
 const factor=i===0?n:Math.expm1(n*Math.log1p(i))/i;
 const uniform=method==='SF'?amount/factor:amount/n;
 const denom=n*(n+1)/2;
 const headers=['Year','Opening BV'+(unit?' ('+unit+')':''),...(method==='SF'?['Interest on fund']:[]),'Year depreciation','Accumulated','Closing BV'];
 const chargeCol=method==='SF'?3:2;
 const accumulatedCol=chargeCol+1, closingCol=chargeCol+2;
 let balance=P,accumulated=0;
 const rows=Array.from({length:n},(_,row)=>{
  const t=row+1,open=balance,prior=accumulated;
  const interest=method==='SF'?prior*i:0;
  const charge=method==='SL'?uniform:method==='SF'?uniform+interest:method==='SYD'?amount*(n-t+1)/denom:Math.min(open*i,Math.max(0,open-S));
  accumulated=Math.min(amount,prior+charge);
  balance=P-accumulated;
  const setup=method==='SL'?['D = (P − S)/n','('+fmt(P)+' − '+fmt(S)+') / '+n+' = '+fmt(charge)]:
   method==='SF'?['Dₜ = fixed deposit + interest on the prior fund',fmt(uniform)+' + '+fmt(interest)+' ≈ '+fmt(charge)]:
   method==='SYD'?['Dₜ = (P − S) × remaining life ÷ sum of years’ digits','('+fmt(P)+' − '+fmt(S)+') × '+(n-t+1)+' / '+denom+' ≈ '+fmt(charge)]:
   ['Dₜ = min(rate × opening book value, opening book value − salvage)','min('+plain(i)+' × '+fmt(open)+', '+fmt(open)+' − '+fmt(S)+') ≈ '+fmt(charge)];
  const cells=[
   [open,'Opening book value',row?[[row-1,closingCol]]:[],[row?'Carry forward year '+row+'’s closing book value of '+fmt(open)+'.':'Start at the original purchase cost of '+fmt(P)+'.']],
   ...(method==='SF'?[[interest,'Interest on the fund',row?[[row-1,accumulatedCol]]:[],['Interest = previous accumulated depreciation × interest rate.',fmt(prior)+' × '+plain(i)+' ≈ '+fmt(interest)]]]:[]),
   [charge,'Depreciation',method==='SF'?[[row,2]]:method==='DB'?[[row,1]]:[],setup],
   [accumulated,'Accumulated depreciation',row?[[row-1,accumulatedCol],[row,chargeCol]]:[[row,chargeCol]],['Add this year’s charge to all previous depreciation.',fmt(prior)+' + '+fmt(charge)+' ≈ '+fmt(accumulated)]],
   [balance,'Closing book value',[[row,1],[row,chargeCol]],['Subtract the year’s depreciation from its opening book value.',fmt(open)+' − '+fmt(charge)+' ≈ '+fmt(balance)]]
  ];
  return '<tr><th scope="row">'+t+'</th>'+cells.map(([value,label,inputs,lines])=>'<td data-num>'+calculationCell(shown(value),{title:'Year '+t+' · '+label,inputs,lines})+'</td>').join('')+'</tr>';
 });
 const basis='('+plain(P)+' - '+plain(S)+')';
 const details=method==='SF'?
  [['Formula','A = (P − S) / (F/A, i, n)'],['Expand the factor',i===0?'F/A = n at zero interest':'F/A = ((1 + i)^n − 1) / i'],['Substitute',i===0?'F/A = '+n:'F/A = ((1 + '+plain(i)+')^'+n+' − 1) / '+plain(i)+' ≈ '+fmt(factor)],['Calculator entry',basis+' / '+(i===0?n:'(((1 + '+plain(i)+')^'+n+' - 1) / '+plain(i)+')')],['Result',unit+shown(uniform)+' per year']]:
  method==='SL'?[['Formula','D = (P − S) / n'],['Calculator entry',basis+' / '+n],['Result',unit+shown(uniform)+' per year']]:
  method==='SYD'?[['Formula','Dₜ = (P − S) × (n − t + 1) / [n(n + 1)/2]'],['Calculator entry for year 1',basis+' * '+n+' / ('+n+' * '+(n+1)+' / 2)'],['Year 1',unit+shown(amount*n/denom)]]:
  [['Formula','Dₜ = min(i × opening BV, opening BV − S)'],['Calculator entry for year 1',plain(i)+' * '+plain(P)],['Salvage cap',plain(P)+' - '+plain(S)],['Year 1 (smaller value)',unit+shown(Math.min(P*i,amount))]];
 const schedule='<div class="ee-table" role="region" tabindex="0" aria-label="Depreciation schedule"><table><thead><tr>'+headers.map(header=>'<th scope="col">'+header+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
 return {schedule,expansion:calculationDetails(details),balance,uniform};
}
