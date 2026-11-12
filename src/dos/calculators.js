import {p,table} from './answers.mjs';

const field=(id,label,value,min=0)=>({id,label,value,min,type:'number'});
export const labs=[
  {method:'omega',title:'Omega network size',description:'Count switching stages and 2×2 switches.',fields:[field('ports','Ports per side',8,2)]},
  {method:'rpc',title:'RPC transfer time',description:'Compare one batch with several sequential calls.',fields:[field('data','Total data (KB)',32),field('calls','Number of calls',32,1),field('fixed','Fixed cost per call (ms)',1),field('rate','Transfer cost per KB (ms)',1.5)]},
  {method:'berkeley',title:'Berkeley clock offsets',description:'Use readings taken at the same real-time instant.',fields:[{id:'clocks',label:'Clock readings in ms (separate with spaces)',value:'300 270 290 310'}]},
  {method:'skew',title:'Clock skew',description:'Find the maximum skew before the next synchronization.',fields:[field('fast','Clock A (ticks/ms)',1000),field('slow','Clock B (ticks/ms)',990),field('nominal','Nominal rate (ticks/ms)',1000,1),field('seconds','Time between updates (s)',60)]}
];
const format=value=>Number(value.toFixed(4)).toLocaleString('en-US',{maximumFractionDigits:4});

export function calculate(lab,values) {
  const number = id => Number(values[id]);
  if (lab.fields.some(({id,min,type})=>type==='number'&&
      (!String(values[id]).trim()||!Number.isFinite(number(id))||number(id)<min))) {
    return {error:'Enter a valid number for each field.'};
  }
  switch(lab.method) {
    case 'omega': {
      const ports=number('ports'),stages=Math.log2(ports);
      if(!Number.isSafeInteger(ports)||!Number.isInteger(stages))return {error:'Enter a power of two greater than or equal to 2.'};
      return {html:table(['Stages','Switches per stage','Total switches'],[[stages,ports/2,format(stages*ports/2)]])};
    }
    case 'rpc': {
      const calls=number('calls'),fixed=number('fixed'),transfer=number('data')*number('rate');
      if(!Number.isSafeInteger(calls))return {error:'Enter a whole number of calls.'};
      return {html:table(['Batch','Sequential','Time saved'],[[format(fixed+transfer)+' ms',format(calls*fixed+transfer)+' ms',format((calls-1)*fixed)+' ms']])};
    }
    case 'berkeley': {
      const readings=values.clocks.trim().split(/[\s,]+/).map(Number);
      if(readings.length<2||readings.length>64||readings.some(x=>!Number.isFinite(x)))return {error:'Enter 2 to 64 clock readings.'};
      const target=readings.reduce((sum,x)=>sum+x,0)/readings.length;
      return {html:p('Average = <strong>'+format(target)+' ms</strong>')+table(['Clock','Reading (ms)','Adjustment (ms)'],readings.map((x,i)=>[i+1,format(x),(target>x?'+':'')+format(target-x)]))};
    }
    case 'skew': {
      const ticks=Math.abs(number('fast')-number('slow'))*number('seconds')*1000;
      return {html:p('The clocks differ by '+format(ticks)+' ticks, equivalent to <strong>'+format(ticks/number('nominal'))+' ms</strong>.')};
    }
  }
}
