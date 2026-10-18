import assert from 'node:assert/strict';
import {createHmac, randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdtemp, rm, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
const root=fileURLToPath(new URL('../',import.meta.url));
const token='123456789:TEST_BOT_TOKEN_PLACEHOLDER_DO_NOT_USE';
const owner='1122334455',secret='test_webhook_secret_1234567890';
const toSign=(id=owner, extra={})=>{
  const values=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),query_id:'TEST',user:JSON.stringify({id:Number(id),first_name:'Глеб'}),...extra});
  const check=Array.from(values.entries()).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>`${k}=${v}`).join('\n');
  const key=createHmac('sha256','WebAppData').update(token).digest();
  values.set('hash',createHmac('sha256',key).update(check).digest('hex'));
  return values.toString();
};
for(const legacy of [false,true]){
 const dir=await mkdtemp(join(tmpdir(),'forma-training-test-'));
 const port=30000+Math.floor(Math.random()*15000),origin=`http://127.0.0.1:${port}`;
 const auth=toSign();let child,output='';
 const api=async(route,{method='GET',body,id=auth,headers={}}={})=>{
  const response=await fetch(origin+route,{method,headers:{'X-Telegram-Init-Data':id,...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  return {status:response.status,body:await response.json().catch(()=>({}))};
 };
 const ok=result=>{assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.body.ok,true);};
 const initialCount=legacy?1:0;
 async function boot(){
  child=spawn(process.execPath,['app.js'],{cwd:root,env:{...process.env,PORT:String(port),DATA_DIR:dir,BOT_TOKEN:token,OWNER_TELEGRAM_ID:owner,WEBHOOK_SECRET:secret,PUBLIC_BASE_URL:''},stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>output+=data);
  for(let i=0;i<80;i++){
   if(child.exitCode!==null)throw Error('App quit: '+output);
   try{const r=await fetch(origin+'/api/health');if(r.ok)return;}catch{}
   await new Promise(r=>setTimeout(r,80));
  }
  throw Error('Startup timeout: '+output);
 }
 async function shutdown(){if(!child)return;const running=child;child=null;running.kill('SIGTERM');await Promise.race([new Promise(r=>running.once('exit',r)),new Promise(r=>setTimeout(r,3000))]);if(running.exitCode===null)running.kill('SIGKILL');}
 try{
  if(legacy){
   const db=new DatabaseSync(join(dir,'forma.sqlite'));
   db.exec(await readFile(join(root,'scripts/fixtures/legacy-schema.sql'),'utf8'));
   db.prepare('INSERT INTO users(user_id,first_name,calorie_goal) VALUES(?,?,?)').run(owner,'Глеб',2700);
   db.prepare('INSERT INTO workouts(id,user_id,date,day_id,duration_sec,exercises_json,completed_at) VALUES(?,?,?,?,?,?,?)').run('legacy-workout',owner,'2026-10-14','wed',1200,'[{"key":"curl","sets":[{"reps":10,"weight":6,"done":true}]}]','2026-10-14T18:00:00Z');
   db.prepare('INSERT INTO weights(user_id,date,kg) VALUES(?,?,?)').run(owner,'2026-10-14',83.1);
   db.prepare('INSERT INTO waists(user_id,date,cm) VALUES(?,?,?)').run(owner,'2026-10-14',90);
   db.prepare('INSERT INTO meals(id,user_id,date,meal_type,title,calories,protein,fat,carbs,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run('legacy-meal',owner,'2026-10-14','lunch','Legacy record',300,20,10,30,'2026-10-14T12:00:00Z');
   db.close();
  }
  await boot();
  const health=await api('/api/health');assert.equal(health.body.version,'2.6.0-media');assert(!('aiProvider' in health.body));
  const home=await fetch(origin+'/');assert.equal(home.status,200);const markup=await home.text();assert(!markup.includes('food-screen'));assert(!markup.includes('meal-plan.js'));assert.equal((markup.match(/class="tab(?: active)?"/g)||[]).length,3);
  assert.equal((await fetch(origin+'/styles.css')).status,200);
  if(!legacy){
   const manifestSource=await readFile(join(root,'public/videos.js'),'utf8');
   const mediaKeys=[...manifestSource.matchAll(/"src": "([^"]+)"/g)].map(m=>m[1]);
   assert.equal(mediaKeys.length,15);
   for(const route of mediaKeys){
    const response=await fetch(origin+route);assert.equal(response.status,200,route);
    assert.equal(response.headers.get('content-type'),route.includes('.gif')?'image/gif':'video/mp4');
    const local=await readFile(join(root,'public',route.split('?')[0]));
    assert.deepEqual(Buffer.from(await response.arrayBuffer()),local,route);
   }
   const video=await readFile(join(root,'public/media/reverseCurl.mp4'));
   const head=await fetch(origin+'/media/reverseCurl.mp4',{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),String(video.length));assert.equal(head.headers.get('accept-ranges'),'bytes');
   for(const [range,start,end] of [['bytes=0-31',0,31],['bytes=-64',video.length-64,video.length-1],[`bytes=${video.length-32}-`,video.length-32,video.length-1]]){
    const part=await fetch(origin+'/media/reverseCurl.mp4',{headers:{Range:range}});assert.equal(part.status,206);assert.equal(part.headers.get('content-range'),`bytes ${start}-${end}/${video.length}`);assert.deepEqual(Buffer.from(await part.arrayBuffer()),video.subarray(start,end+1));
   }
   for(const range of [`bytes=${video.length}-`,'bytes=50-10','bytes=-0'])assert.equal((await fetch(origin+'/media/reverseCurl.mp4',{headers:{Range:range}})).status,416);
  }

  assert.equal((await fetch(origin+'/meal-plan.js')).status,404);
  assert.equal((await fetch(origin+'/src/worker.js')).status,404);
  assert.equal((await fetch(origin+'/.env')).status,404);
  assert.equal((await fetch(origin+'/api/bootstrap')).status,401);
  assert.equal((await api('/api/bootstrap',{id:toSign('9999')})).status,403);
  assert.equal((await api('/api/bootstrap',{id:toSign(owner,{signature:'signed-value'})})).status,200);
  const forged=toSign(owner,{signature:'signed-value'}).replace('signature=signed-value','signature=modified-value');
  assert.equal((await api('/api/bootstrap',{id:forged})).status,401);
  const start=await api('/api/bootstrap');assert.equal(start.body.workouts.length,initialCount);assert(!('meals' in start.body));assert(!('calorie_goal' in start.body.user));
  ok(await api('/api/settings',{method:'POST',body:{reminder_enabled:true,reminder_time:'18:30',timezone:'Europe/Moscow'}}));
  ok(await api('/api/measurements',{method:'POST',body:{date:'2026-10-17',kg:82.8,cm:89}}));
  for(const [day,date] of [['mon','2026-10-12'],['tue','2026-10-13'],['thu','2026-10-15'],['fri','2026-10-16']]){
   ok(await api('/api/workouts',{method:'POST',body:{id:randomUUID(),date,day_id:day,duration_sec:1800,exercises:[{key:'floorPress',sets:[{reps:12,weight:6,done:true}]}]}}));
  }
  assert.equal((await api('/api/workouts',{method:'POST',body:{id:randomUUID(),date:'2026-10-17',day_id:'sat',exercises:[]}})).status,400);
  const pid=randomUUID(),sample=Buffer.from('photo persistence fixture');
  ok(await api('/api/progress-photos',{method:'POST',body:{id:pid,date:'2026-10-17',image:'data:image/jpeg;base64,'+sample.toString('base64')}}));
  const photo=await api('/api/progress-photos/'+pid);assert.equal(photo.body.image,'data:image/jpeg;base64,'+sample.toString('base64'));
  const extra=await api('/api/v2/bootstrap');assert.equal(extra.body.waists[0].cm,89);assert.equal(extra.body.photos[0].id,pid);assert(!('favorites' in extra.body));
  assert.equal((await api('/api/progress-photos/'+pid,{id:toSign('222222')})).status,403);
  for(const route of ['/api/meals','/api/favorites','/api/analyze'])assert.equal((await api(route,{method:'POST',body:{}})).status,404);
  assert.equal((await api('/api/barcode/12345678')).status,404);
  assert.equal((await api('/telegram/webhook',{method:'POST',body:{}})).status,403);
  ok(await api('/telegram/webhook',{method:'POST',body:{update_id:7},headers:{'X-Telegram-Bot-Api-Secret-Token':secret}}));
  await shutdown();await boot();
  const after=await api('/api/bootstrap');assert.equal(after.body.workouts.length,initialCount+4);assert.equal(after.body.weights[0].kg,82.8);assert.equal(after.body.user.reminder_time,'18:30');assert.equal(after.body.user.reminder_enabled,1);
  if(legacy)assert(after.body.workouts.some(w=>w.id==='legacy-workout'&&w.day_id==='wed'));
  for(const day of ['mon','tue','thu','fri'])assert(after.body.workouts.some(w=>w.day_id===day));
  const afterExtra=await api('/api/v2/bootstrap');assert.equal(afterExtra.body.waists.length,initialCount+1);assert.equal(afterExtra.body.photos[0].id,pid);
  ok(await api('/api/progress-photos/'+pid,{method:'DELETE'}));assert.equal((await api('/api/progress-photos/'+pid)).status,404);
  await shutdown();
  const db=new DatabaseSync(join(dir,'forma.sqlite'));
  if(legacy){assert.equal(db.prepare('SELECT title FROM meals WHERE id=?').get('legacy-meal').title,'Legacy record');assert.equal(db.prepare('SELECT calorie_goal FROM users WHERE user_id=?').get(owner).calorie_goal,2700);}
  else{assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name IN ('meals','favorites')").get().n,0);}
  db.close();assert(!output.includes('reminder scheduler:'));
  console.log(`PASS ${legacy?'legacy database upgrade':'fresh database'}: authentication, workout history, settings, measurements, private photos, restart persistence, removed nutrition routes.`);
 }finally{await shutdown();await rm(dir,{recursive:true,force:true});}
}
