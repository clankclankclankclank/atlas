import {build,transform} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {access,cp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import * as daa from './src/daa/course.mjs';
import * as dos from './src/dos/course.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const dist=path.join(root,'dist'),target=path.join(dist,'app');
const subjectNames={daa:'AtlasDAA',cn:'AtlasCN',ee:'AtlasEE',se:'AtlasSE',dos:'AtlasDOS'};
const assetRoot=await access(path.join(root,'assets')).then(()=>root,()=>path.dirname(root));
await rm(dist,{recursive:true,force:true});
await mkdir(target,{recursive:true});
await Promise.all(['assets','media'].map(name=>cp(path.join(assetRoot,name),path.join(dist,name),{recursive:true})));

const list=[],totals={};
for(const id of Object.keys(subjectNames)){
 const content={daa,dos}[id]??JSON.parse(await readFile(path.join(root,'src',id,'study-data.json'),'utf8'));
 totals[id]={questions:content.QS.length,papers:Object.keys(content.SCANS).length};
 for(const q of content.QS){
  const year=content.PAPERS?.[q.paper]?.label??'20'+q.paper.slice(1);
  const topic=content.TOPICS[q.topic]?.[0]??q.topic;
  list.push({subject:id,id:q.id,ref:q.ref,marks:q.marks,title:q.question,year,name:q.question.toLowerCase(),search:[q.question,topic,year,id,'Q'+q.ref].join(' ').toLowerCase()});
 }
}
const recordingDir=path.join(assetRoot,'media','se-listening');
const seRecordings=await access(recordingDir).then(()=>readdir(recordingDir,{withFileTypes:true}),()=>[]);
const audioStems=seRecordings.filter(entry=>entry.isFile()&&/^[a-z0-9-]+\.mp3$/.test(entry.name)).map(entry=>entry.name.slice(0,-4)).sort();
await writeFile(path.join(root,'src/generated-index.mjs'),'export const index='+JSON.stringify(list)+';\nexport const totals='+JSON.stringify(totals)+';\nexport const seRecordings='+JSON.stringify(audioStems)+';\n');
const shared={absWorkingDir:root,bundle:true,minify:true,format:'iife',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}};
await Promise.all([
 build({...shared,entryPoints:['src/hub.jsx'],outfile:path.join(target,'hub.js')}),
 ...Object.entries(subjectNames).map(([id,globalName])=>build({...shared,globalName,entryPoints:['src/'+id+'/main.jsx'],outfile:path.join(target,id+'.js')}))
]);
const cli=path.join(root,'node_modules/@tailwindcss/cli/dist/index.mjs');
for(const id of Object.keys(subjectNames))execFileSync(process.execPath,[cli,'-i','src/'+id+'/styles.css','-o','dist/app/'+id+'.css','--minify'],{cwd:root,stdio:'inherit'});
const bitsDir=path.join(root,'src/react-bits');
await cp(path.join(bitsDir,'LICENSE.md'),path.join(dist,'react-bits-license.txt'));
const bitsStyles=await Promise.all((await readdir(bitsDir)).filter(name=>name.endsWith('.css')).sort().map(name=>readFile(path.join(bitsDir,name),'utf8')));
const css=await transform([...bitsStyles,await readFile(path.join(root,'src/hub.css'),'utf8')].join('\n'),{loader:'css',minify:true,target:'es2022'});
await writeFile(path.join(target,'hub.css'),css.code);
const page=await readFile(path.join(root,'index.html'),'utf8');
const hash=createHash('sha256');
for(const id of ['hub',...Object.keys(subjectNames)])for(const ext of ['js','css'])hash.update(await readFile(path.join(target,id+'.'+ext)));
const revision=hash.digest('hex').slice(0,12);
await writeFile(path.join(dist,'index.html'),page.replace(/app\/hub\.(?:js|css)/g,name=>name+'?v='+revision).replace('<html lang="en">','<html lang="en" data-atlas-revision="'+revision+'">'));
