import {lcs,matrixChain,knapsack,partition,recurrence} from './algorithms.mjs';
const field=(id,label,value,type='text',min,max)=>({id,label,value,type,min,max});
export const labs=[
 {method:'lcs',title:'Longest common subsequence',description:'Change both sequences and trace each DP row and the final backtracking path.',fields:[field('x','First sequence','skullandbones'),field('y','Second sequence','lullabybabies')]},
 {method:'matrix',title:'Matrix-chain ordering',description:'Enter the shared dimension vector and inspect the cost of every split.',fields:[field('dimensions','Dimensions separated by commas','10, 5, 20, 10, 5')]},
 {method:'knapsack',title:'0/1 knapsack',description:'Compare include and exclude states and recover one optimal set.',fields:[field('weights','Weights','4, 6, 5, 7, 3, 1, 6'),field('values','Values','12, 10, 8, 11, 14, 7, 9'),field('capacity','Capacity',18,'number',0,35)]},
 {method:'partition',title:'Lomuto partition',description:'Run a single partition around the last element.',fields:[field('array','Integers separated by commas','98, 87, 76, 65, 54, 43, 32, 21, 10')]},
 {method:'master',title:'Master theorem',description:'Explore T(n)=aT(n/b)+nᵏ with a polynomial toll and unit base cost.',fields:[field('a','Number of calls',2,'number',1,7),field('b','Size divisor',4,'number',2,16),field('k','Toll exponent',0.51,'number',0,5)]}
];
function ints(input){
 const parts=String(input).trim().split(/[\s,]+/);
 if(!parts.every(x=>/^-?\d+$/.test(x)))throw new Error('Use integers separated by commas or spaces.');
 const values=parts.map(Number);
 if(values.some(x=>!Number.isSafeInteger(x)||Math.abs(x)>10000))throw new Error('Keep each integer between −10,000 and 10,000.');
 return values;
}
export function calculate(lab,v){
 try{
  if(lab.method==='lcs'){
   if(!v.x.trim()||!v.y.trim()||v.x.length>20||v.y.length>20)throw new Error('Enter two sequences of 1–20 characters each.');
   return lcs(v.x,v.y);
  }
  if(lab.method==='matrix'){
   const p=ints(v.dimensions);
   if(p.length<2||p.length>9||p.some(x=>x<=0))throw new Error('Enter 2–9 positive dimensions.');
   return matrixChain(p);
  }
  if(lab.method==='knapsack'){
   const w=ints(v.weights),z=ints(v.values),W=Number(v.capacity);
   if(w.length!==z.length||w.length>10||w.some(x=>x<1)||z.some(x=>x<0)||!Number.isInteger(W)||W<0||W>35)throw new Error('Use matching lists of 1–10 items, positive weights, nonnegative values, and an integer capacity of 0–35.');
   return knapsack(w,z,W);
  }
  if(lab.method==='partition'){
   const a=ints(v.array);
   if(a.length<2||a.length>20)throw new Error('Enter 2–20 integers.');
   return partition(a);
  }
  const a=Number(v.a),b=Number(v.b),k=Number(v.k);
  if(!Number.isInteger(a)||a<1||a>7||!Number.isInteger(b)||b<2||b>16||!Number.isFinite(k)||k<0||k>5)throw new Error('Use integer a=1–7, integer b=2–16 and 0≤k≤5.');
  const p=Math.log(a)/Math.log(b),ratio=a/b**k,close=Math.abs(k-p)<1e-10;
  const result=close?'Θ(n^'+k+' log n) · Case 2':k<p?'Θ(n^(log_'+b+' '+a+')) · Case 1':'Θ(n^'+k+') · Case 3';
  return recurrence({a,b,toll:k===0?'1':'n^'+k,depth:a>4?1:2,caption:'Master theorem explorer',result,reason:'The threshold exponent is '+p.toFixed(6)+'. Each complete level has '+ratio.toFixed(6)+' times the work of the previous one.',levels:[[0,1,'n^'+k],[1,a,'n^'+k+' × '+ratio.toFixed(6)],['d','aᵈ','n^'+k+' × ('+ratio.toFixed(6)+')ᵈ']]});
 }catch(error){return {error:error.message};}
}
