import {calculationDetails} from '../calculation-markup.mjs';

const formulas={
 'P/F':i=>'(1 + '+i+')^(-{n})',
 'F/P':i=>'(1 + '+i+')^{n}',
 'P/A':i=>i===0?'{n}':'(1 - (1 + '+i+')^(-{n})) / '+i,
 'F/A':i=>i===0?'{n}':'((1 + '+i+')^{n} - 1) / '+i,
 'A/P':i=>i===0?'1 / {n}':i+' / (1 - (1 + '+i+')^(-{n}))',
 'A/F':i=>i===0?'1 / {n}':i+' / ((1 + '+i+')^{n} - 1)',
 'A/G':i=>i===0?'({n} - 1) / 2':'1 / '+i+' - {n} / ((1 + '+i+')^{n} - 1)'
};
export const factorEntry=(name,rate,years)=>formulas[name](rate).replaceAll('{n}',String(years));
export function expandFactors(factors,entries=[]){
 return calculationDetails([
  ...factors.flatMap(([name,rate,years,result])=>[[name+' · '+years+' periods · calculator entry',factorEntry(name,rate,years)],[name+' · '+years+' periods · result','≈ '+Number(result.toPrecision(9))]]),
  ...entries
 ]);
}
