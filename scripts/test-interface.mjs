import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
const root=new URL('../',import.meta.url).pathname;
const files=['exercises.js','videos.js','exercise-visuals.js','app.js','v2.js'];
const memory=new Map();
const snapshots={};
class FixedDate extends Date {
  constructor(...args){super(...(args.length?args:['2026-10-18T10:59:08+03:00']));}
  static now(){return new Date('2026-10-18T10:59:08+03:00').getTime();}
}
class Element {
  constructor(id='',dataset={}){this.id=id;this.dataset=dataset;this.innerHTML='';this.textContent='';this.value='';this.attrs={};const classes=new Set();this.classList={toggle:(x,on)=>on?classes.add(x):classes.delete(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)};}
  setAttribute(k,v){this.attrs[k]=v;}
  removeAttribute(k){delete this.attrs[k];}
  hasAttribute(k){return k.startsWith('data-')?this.dataKey(k.slice(5)) in this.dataset:k in this.attrs;}
  dataKey(k){return k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());}
  closest(selectors){for(const s of selectors.split(',')){const t=s.trim();if(t==='#'+this.id)return this;const m=t.match(/^\[data-([a-z0-9-]+)\]$/);if(m&&this.dataKey(m[1]) in this.dataset)return this;}return null;}
  addEventListener(){}
}
function load(){
  const handlers={};const winHandlers={};const nodes=new Map();
  const html=fs.readFileSync(root+'/public/index.html','utf8');
  for(const [,id] of html.matchAll(/id="([^"]+)"/g))nodes.set('#'+id,new Element(id));
  const tabs=[new Element('',{tab:'workouts'}),new Element('',{openCalendar:''}),new Element('',{v2Progress:''})];
  const screens=[nodes.get('#workouts-screen')];
  nodes.set('.overlay',new Element());nodes.set('#rest-placeholder',new Element('rest-placeholder'));
  const document={querySelector:s=>nodes.get(s)||null,querySelectorAll:s=>s==='.tab'?tabs:s==='.screen'?screens:[],addEventListener:(type,fn)=>{(handlers[type]??=[]).push(fn)},hidden:false};
  const context={document,Date:FixedDate,Intl,URL,Event,console,crypto:webcrypto,navigator:{},FormData:class {constructor(form){this.values=form.values||{}}get(key){return this.values[key]??null}},localStorage:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},scrollTo(){},confirm:()=>true,fetch:()=>{throw Error('Unexpected remote request in demo')},addEventListener:(type,fn)=>{(winHandlers[type]??=[]).push(fn)},dispatchEvent:e=>{for(const fn of winHandlers[e.type]||[])fn(e)}};
  context.window=context;context.globalThis=context;
  vm.createContext(context);
  for(const file of files)vm.runInContext(fs.readFileSync(root+'/public/'+file,'utf8'),context,{filename:file});
  const click=async (dataset,id='')=>{const target=new Element(id,dataset);for(const fn of handlers.click||[])await fn({target});};
  const submit=async (id,values)=>{for(const fn of handlers.submit||[])await fn({target:{id,values},preventDefault(){}});};const input=async(dataset,value)=>{const target=new Element('',dataset);target.value=String(value);for(const fn of handlers.input||[])await fn({target});};return {context,nodes,tabs,click,submit,input};
}
const legacy={id:'legacy-wed',date:'2026-10-14',day_id:'wed',exercises:[{key:'curl',sets:[{reps:10,weight:6,done:true}]}]};
memory.set('forma-demo-v1',JSON.stringify({user:{calorie_goal:2700},meals:[{id:'legacy-meal'}],workouts:[legacy]}));
memory.set('forma-demo-v2',JSON.stringify({favorites:[{id:'legacy-favorite'}]}));
const {context:c,nodes,tabs,click,submit,input}=load();
const B=c.FORMA_BRIDGE,plans=c.FORMA_PLANS,EX=c.FORMA_EXERCISES;
assert(c.FORMA_APP_READY);assert.equal(tabs.length,3);
assert.deepEqual(Object.keys(plans),['mon','tue','thu','fri']);
assert.deepEqual(Array.from(Object.values(plans),p=>p.weekday),[1,2,4,5]);
assert(nodes.get('#hero-card').innerHTML.includes('ЗАВТРА'));
const week=nodes.get('#week-card').innerHTML.split('</button>');
assert.deepEqual(week.filter(x=>x.includes(' scheduled')).map(x=>x.match(/data-open-calendar="([^"]+)"/)[1]),['2026-10-12','2026-10-13','2026-10-15','2026-10-16']);
assert.equal((nodes.get('#plan-list').innerHTML.match(/data-start=/g)||[]).length,4);
assert(!('calorie_goal' in B.state.user));assert(!('meals' in B.state));
snapshots.home=nodes.get('#hero-card').innerHTML+nodes.get('#week-card').innerHTML+nodes.get('#plan-list').innerHTML;
await click({},'settings-btn');assert(nodes.get('#overlay-root').innerHTML.includes('вторникам, четвергам'));assert(!nodes.get('#overlay-root').innerHTML.includes('Калории'));
await submit('settings-form',{reminder_enabled:'on',reminder_time:'18:30'});assert.equal(B.state.user.reminder_time,'18:30');
assert.equal(JSON.parse(memory.get('forma-demo-v1')).meals[0].id,'legacy-meal');
await click({openCalendar:'2026-10-14'});
const calendar=nodes.get('#overlay-root').innerHTML;
for(const [,date,classes] of calendar.matchAll(/data-calendar-day="([^"]+)" class="([^"]+)"/g))assert.equal(classes.includes('scheduled'),[1,2,4,5].includes(new Date(date+'T12:00:00Z').getUTCDay()),date);
assert(calendar.includes('1 тренировка(и)'));
await click({openCalendar:'2026-10-13'});await click({manualComplete:''});assert.equal(B.state.workouts.length,2);assert.equal(B.state.workouts[0].day_id,'tue');
snapshots.calendar=nodes.get('#overlay-root').innerHTML;
B.state.calendarDate='2027-01-31';await click({calShift:'1'});assert.equal(B.state.calendarDate,'2027-02-01');
await click({programGuide:''});assert(nodes.get('#overlay-root').innerHTML.includes('Пн / Вт / Чт / Пт'));snapshots.guide=nodes.get('#overlay-root').innerHTML;
for(const [id,plan] of Object.entries(plans)){
 await click({start:id});
 assert.equal(B.state.session.day_id,id);assert.equal(B.state.session.mode,'easy');assert.equal(B.state.session.warmup_done,false);
 assert(nodes.get('#overlay-root').innerHTML.includes('Разминка · 5–7 минут'));
 for(const row of B.state.session.exercises)assert.equal(row.sets.length,EX[row.key].type==='cardio'?1:Math.min(2,plan.prescriptions?.[row.key]?.sets??EX[row.key].sets));
 assert.equal(B.state.session.exercises.at(-1).sets[0].reps,8);
 await click({sessionMode:'standard'});
 assert.equal(B.state.session.exercises.at(-1).sets[0].reps,plan.cardio);
 for(const row of B.state.session.exercises)assert.equal(row.sets.length,plan.prescriptions?.[row.key]?.sets??EX[row.key].sets);
 snapshots['briefing-'+id]=nodes.get('#overlay-root').innerHTML;
 await click({warmupDone:''});assert(B.state.session.warmup_done);
 assert(nodes.get('#overlay-root').innerHTML.includes('Помощник по технике'));
 if(id==='mon'){
  assert.equal(B.state.session.exercises[0].sets[0].weight,'');
  await click({markSet:'0'});assert.equal(B.state.session.exercises[0].sets[0].done,false);
  await input({setValue:'0',key:'weight'},6);await click({markSet:'0'});assert(B.state.session.exercises[0].sets[0].done);
  await click({close:''});B.renderWorkouts();assert(nodes.get('#resume-session').innerHTML.includes('Продолжить'));
  await click({start:'tue'});assert(nodes.get('#overlay-root').innerHTML.includes('Есть незавершённая'));
  await click({resumeSession:''});assert.equal(B.state.session.day_id,'mon');assert(B.state.session.exercises[0].sets[0].done);
 }
 if(id==='thu')assert.equal(B.state.session.exercises[0].sets[0].weight,6,'last recorded press load is reused');
 const rows=B.state.session.exercises;
 for(let i=0;i<rows.length;i++){
  const row=rows[i];
  if(row.key==='oneRow')assert(nodes.get('#overlay-root').innerHTML.includes('после обеих сторон'));
  snapshots['exercise-'+row.key]=nodes.get('#overlay-root').innerHTML;
  for(let j=0;j<row.sets.length;j++){
   if(EX[row.key].type==='dumbbell'&&row.sets[j].weight==='')await input({setValue:String(j),key:'weight'},6);
   if(!row.sets[j].done)await click({markSet:String(j)});
   assert(row.sets[j].done);
  }
  await click({nextEx:''});
 }
 assert.equal(B.state.session,null);assert(nodes.get('#overlay-root').innerHTML.includes('Тренировка выполнена!'));assert(!memory.has('forma-active-session'));
}
assert.equal(B.state.workouts.length,6);assert.equal(JSON.parse(memory.get('forma-demo-v1')).workouts.length,6);
await click({v2Progress:''});assert(nodes.get('#overlay-root').innerHTML.includes('Мой прогресс'));
const reloaded=load();assert.equal(reloaded.context.FORMA_BRIDGE.state.workouts.length,6);
assert(reloaded.nodes.get('#hero-card').innerHTML.includes('СЕГОДНЯ · ВЫПОЛНЕНО'));
// A pre-update Wednesday session remains resumable with its original rows.
memory.set('forma-active-session',JSON.stringify({id:'cached-wed',date:'2026-10-14',day_id:'wed',started_at:FixedDate.now()-1000,exercises:[{key:'curl',sets:[{reps:10,weight:6,done:true}]},{key:'rdl',sets:[{reps:10,weight:8,done:false}]}]}));
await click({resumeSession:''});assert.equal(B.state.session.day_id,'wed');assert.equal(B.state.sessionIndex,1);assert(nodes.get('#overlay-root').innerHTML.includes('ПРЕЖНЯЯ ПРОГРАММА'));
await click({markSet:'0'});await click({nextEx:''});assert.equal(B.state.workouts[0].id,'cached-wed');assert.equal(B.state.session,null);
// Complete volume at the same load is necessary for a progression suggestion.
const saved=B.state.workouts;
const rec=(date,done=true,weight=6)=>({date,exercises:[{key:'curl',sets:Array.from({length:3},(_,i)=>({reps:12,weight,done:done||i<2}))}]});
B.state.workouts=[rec('2026-10-15'),rec('2026-10-12')];
assert(c.FORMA_V2.coachHint('curl',[{},{},{}],'8–12').includes('добавь минимальный шаг'));
B.state.workouts=[rec('2026-10-15',false),rec('2026-10-12',false)];
assert(!c.FORMA_V2.coachHint('curl',[{},{},{}],'8–12').includes('добавь минимальный шаг'));
B.state.workouts=[rec('2026-10-15',true,7),rec('2026-10-12',true,6)];
assert(!c.FORMA_V2.coachHint('curl',[{},{},{}],'8–12').includes('добавь минимальный шаг'));
// Four distinct strength days unlock the standard default, while easy remains available.
B.state.workouts=['2026-10-05','2026-10-06','2026-10-08','2026-10-09'].map(date=>rec(date));
await click({start:'mon'});assert.equal(B.state.session.mode,'standard');
await click({sessionMode:'easy'});assert.equal(B.state.session.exercises.at(-1).sets[0].reps,8);
B.state.workouts=saved;
if(process.env.FORMA_TEST_SNAPSHOT)fs.writeFileSync(process.env.FORMA_TEST_SNAPSHOT,JSON.stringify(snapshots));
console.log('PASS interface: four days, calendar, warmup, easy/standard volume, weight entry and reuse, all four completed sessions, resume, legacy Wednesday, persistence and progression. No browser/layout verification.');
