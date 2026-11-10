// Curated by past-paper question ID. Numeric labels in a prompt do not imply a calculation.
const tagged={
 daa:{
  numerical:new Set("E1-1(a) E1-1(c) E1-1(f) E1-1(g) E1-1(i) E1-2(a) E1-2(b) E1-3(a) E1-3(b) E1-4(a) E1-4(b) E1-5(a) E1-5(b) E1-6(a) E1-6(b) E1-7(a) E1-7(b) E1-8(a) E1-8(b) E2-1(b) E2-1(d) E2-1(f) E2-2(a) E2-2(b) E2-3(a) E2-3(b) E2-4(b) E2-5(a) E2-5(b) E2-6(a) E3-1(e) E3-1(i) E3-1(j) E3-2(a) E3-2(b) E3-3(b) E3-4(a) E3-5(b) E3-6(b) E3-7(b) E4-1(h) E4-2(a) E4-2(b) E4-4(a) E4-5(a) E4-5(b) E4-6(a) E5-2(b) E5-3(a) E5-3(b) E5-4(b) E5-5(a) E5-6(a) E6-1(a) E6-2(b) E6-3(a) E6-4(a) E6-4(b) E6-6(a) E6-6(b) E6-8(a) E7-1(d) E7-1(e) E7-1(g) E7-1(h) E7-2(a) E7-2(b) E7-3(a) E7-4(b) E7-5(a) E7-6(a) E7-6(b) E7-7(a)".split(' ')),
  pseudocode:new Set("E2-7(a) E3-1(c) E3-2(b) E3-6(a) E3-7(a) E4-1(j) E4-3(a) E5-2(a) E5-4(a) E5-5(b) E5-6(b) E6-1(d) E6-1(e) E6-1(h) E7-1(i) E7-2(a) E7-3(a) E7-5(b) E7-6(b)".split(' ')),
  code:new Set("E2-4(a) E3-3(a) E4-3(b) E4-4(b) E6-2(a) E6-3(b) E6-5(a) E6-7(a) E6-7(b) E7-4(a) E7-8(b)".split(' '))
 },
 cn:{
  numerical:new Set("A25-1(c) A25-1(f) A25-1(i) A25-2(a) A25-3(a) A25-3(b) A25-4(a) A25-4(b) A25-5(a) A25-6(b) A24-1(b) A24-1(i) A24-1(j) A24-2(b) A24-3(b) A24-4(b) A24-5(b) A24-6(a) A24-6(b) A24-7(b) A23-1(b) A23-1(d) A23-1(i) A23-2(b) A23-3(b) A23-5(b) A23-6(a) A23-6(b) A23-7(a) A23-7(b) A23-8(a)(ii) A22-1(c) A22-1(d) A22-1(e) A22-1(f) A22-1(g) A22-2(b) A22-3(b) A22-4(b) A22-5(b) A22-6(b) A22-8(a)".split(' '))
 },
 ee:{
  numerical:new Set("E1-1(c) E1-1(e) E1-1(f) E1-1(g) E1-2(b) E1-3(b) E1-4(a) E1-4(b) E1-5(a) E1-5(b) E2-1(a) E2-1(b) E2-1(d) E2-1(j) E2-2(a) E2-2(b) E2-3(b) E2-4(a) E2-4(b) E2-5(a) E2-6(a) E2-6(b) E2-7(b) E3-1(c) E3-1(d) E3-1(e) E3-1(f) E3-1(g) E3-1(h) E3-2(a) E3-2(b) E3-3(a) E3-3(b) E3-4(a) E3-4(b) E3-5(a) E3-6(b) E4-1(b) E4-1(c) E4-2(b) E4-3(a) E4-4(a) E4-4(b) E4-5(a) E4-5(b) E4-6(a) E5-1(b) E5-1(f) E5-1(g) E5-1(h) E5-2(a) E5-2(b) E5-3(a) E5-3(b) E5-4(a) E5-4(b) E5-5(a) E5-5(b) E5-6(a) E5-6(b) E5-7(a) E6-1(a) E6-1(b) E6-1(d) E6-1(i) E6-2(a) E6-2(b) E6-3(a) E6-3(b) E6-4(a) E6-4(b) E6-5(a) E6-5(b)".split(' '))
 },
 se:{
  numerical:new Set("S1-5(a) S1-5(b) S1-7(b) S2-4(b) S2-6(a)(i) S2-6(b) S3-5(a) S3-6(a) S4-7(b) S4-8(b) S5-5(a) S5-6(b) S5-8(b)".split(' '))
 }
};

export const questionTypeLabels={all:'All types',numerical:'Numericals',coding:'All coding',pseudocode:'Pseudocode',code:'Code writing'};
export function normalizeQuestionType(subject,type){
 return type==='numerical'||(subject==='daa'&&['coding','pseudocode','code'].includes(type))?type:'all';
}
export function matchesQuestionType(subject,id,type){
 if(type==='all')return true;
 const types=tagged[subject];
 if(type==='coding')return types.pseudocode.has(id)||types.code.has(id);
 return types?.[type]?.has(id)??false;
}
