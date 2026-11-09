export const subjects=['daa','cn','ee','se'];
export const studyKeys={
 daa:'daa-atlas-progress-v1',
 cn:'cn-atlas-2025-v1',
 ee:'ee-atlas-progress-v1',
 se:'se-atlas-progress-v1'
};
export const routeEvent='atlas-route';
export const progressEvent='atlas-progress';
export function readRoute(hash=location.hash){
 const [path,query='']=hash.replace(/^#\/?/,'').split('?');
 const [subject,view='overview']=path.split('/');
 if(!subjects.includes(subject))return {subject:'home',view:'overview'};
 const params=new URLSearchParams(query);
 const marks=params.get('marks')??'all';
 return {subject,view,marks:/^(all|long|[1-9]\d*)$/.test(marks)?marks:'all',question:params.get('q'),note:params.get('note'),resume:params.get('resume')==='1',scope:params.get('scope')==='saved'?'saved':'all'};
}
export function linkTo(subject,view='overview',options={}){
 if(subject==='home')return '#/';
 const query=new URLSearchParams();
 if(options.question)query.set('q',options.question);
 if(options.note)query.set('note',options.note);
 if(options.resume)query.set('resume','1');
 if(options.marks&&options.marks!=='all')query.set('marks',options.marks);
 if(options.scope&&options.scope!=='all')query.set('scope',options.scope);
 return '#/'+subject+(view==='overview'?'':'/'+view)+(query.size?'?'+query:'');
}
export function navigate(subject,view,options){
 const hash=linkTo(subject,view,options);
 if(location.hash===hash&&!options?.resume)return;
 if(location.hash!==hash)history.pushState(null,'',hash);
 window.dispatchEvent(new Event(routeEvent));
}
export function observeRoute(callback){
 window.addEventListener(routeEvent,callback);
 window.addEventListener('hashchange',callback);
 window.addEventListener('popstate',callback);
 return ()=>{window.removeEventListener(routeEvent,callback);window.removeEventListener('hashchange',callback);window.removeEventListener('popstate',callback);};
}
export function getStudyProgress(){
 return Object.fromEntries(subjects.map(subject=>{
  try{
   const state=JSON.parse(localStorage.getItem(studyKeys[subject]));
   return [subject,{done:new Set(Array.isArray(state?.done)?state.done:[]),saved:new Set(Array.isArray(state?.saved)?state.saved:[])}];
  }catch{
   return [subject,{done:new Set(),saved:new Set()}];
  }
 }));
}
