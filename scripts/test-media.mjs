import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
let reduced=false,cards=[],videos=[];
const document={querySelectorAll:selector=>selector==='[data-exercise-media-card]'?cards:selector==='video[data-exercise-media]'?videos:[]};
const c={document,matchMedia:()=>({matches:reduced})};c.window=c;vm.createContext(c);
for(const file of ['exercises.js','videos.js','exercise-visuals.js'])vm.runInContext(fs.readFileSync(path.join(root,'public',file),'utf8'),c,{filename:file});
const assets=c.FORMA_MEDIA_MAP,V=c.FORMA_VISUALS;
const keys=[...new Set(Object.values(c.FORMA_PLANS).flatMap(p=>p.exercises))].filter(key=>c.FORMA_EXERCISES[key].type!=='cardio');
assert.equal(keys.length,15);assert.deepEqual(Object.keys(assets).sort(),keys.sort());
assert.equal(Object.values(assets).filter(a=>a.type==='gif').length,14);
for(const key of keys){
 const a=assets[key],html=V.render(key);
 assert(html.includes(`data-exercise-media-card="${key}"`));assert(html.includes(a.type==='gif'?'<img data-exercise-media':'<video data-exercise-media'));
 assert(html.includes(a.src.replace(/&/g,'&amp;')));assert(html.includes('data-media-fallback hidden'));
 for(const route of [a.src,a.poster])assert(fs.statSync(path.join(root,'public',new URL(route,'https://forma.local').pathname)).size>0);
}
assert(!V.render('treadmill').includes('data-exercise-media-card'));
assert(V.render('reverseCurl').includes('controls muted loop playsinline'));
assert(!V.render('reverseCurl').includes('autoplay'));
class Node {
 constructor(props={}){Object.assign(this,{hidden:false,textContent:'',events:{},attrs:{},...props});}
 addEventListener(type,fn){this.events[type]=fn;}
 setAttribute(name,value){this.attrs[name]=value;}
}
function gifCard(key){
 const media=new Node({tagName:'IMG',complete:false,naturalWidth:350,src:assets[key].src});
 const nodes={'[data-exercise-media]':media,'[data-media-content]':new Node(),'[data-media-controls]':new Node(),'[data-media-error]':new Node({hidden:true}),'[data-media-fallback]':new Node({hidden:true}),'[data-toggle-gif]':new Node(),'[data-media-status]':new Node()};
 return {dataset:{exerciseMediaCard:key},querySelector:s=>nodes[s]||null,nodes};
}
cards=[gifCard('floorPress')];V.mount();
const card=cards[0],toggle=card.nodes['[data-toggle-gif]'],img=card.nodes['[data-exercise-media]'];
toggle.events.click();assert.equal(img.src,assets.floorPress.poster);assert.equal(toggle.attrs['aria-pressed'],'false');assert(V.render('floorPress').includes('src="'+assets.floorPress.poster+'"'));
toggle.events.click();assert.equal(img.src,assets.floorPress.src);assert.equal(toggle.attrs['aria-pressed'],'true');
img.events.error();assert.equal(card.nodes['[data-media-content]'].hidden,true);assert.equal(card.nodes['[data-media-fallback]'].hidden,false);assert.equal(card.nodes['[data-media-error]'].hidden,false);
reduced=true;assert(V.render('curl').includes('src="'+assets.curl.poster+'"'));assert(V.render('curl').includes('Воспроизвести GIF'));
let pauses=0;videos=[{pause(){pauses++}}];V.stop();assert.equal(pauses,1);
const index=fs.readFileSync(path.join(root,'public/index.html'),'utf8');assert(index.includes('/videos.js?v=2.6.0-media'));
const preview=fs.readFileSync(path.join(root,'FORMA_preview.html'),'utf8');
assert(!/<script\s+src=/.test(preview));assert(!/<link\s+rel="stylesheet"/.test(preview));
const mediaScript=[...preview.matchAll(/<script>\s*([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.startsWith('window.FORMA_MEDIA_MAP ='));
assert(mediaScript);const pc={window:{}};vm.runInNewContext(mediaScript,pc,{timeout:2000});
for(const key of keys){for(const field of ['src','poster']){
 const encoded=pc.window.FORMA_MEDIA_MAP[key][field];assert(encoded.startsWith('data:'));
 const original=fs.readFileSync(path.join(root,'public',new URL(assets[key][field],'https://forma.local').pathname));
 assert.deepEqual(Buffer.from(encoded.slice(encoded.indexOf(',')+1),'base64'),original);
}}
console.log('PASS media: 15 exercise mappings, GIF/MP4 tags, stop/replay, reduced motion, load-error fallback, video cleanup, and exact offline embedding of 30 files. No real-browser playback verification.');
