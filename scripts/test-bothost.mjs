import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=await mkdtemp(join(tmpdir(),'forma-bothost-test-'));
const port=30000+Math.floor(Math.random()*15000);
const token='123456789:TEST_BOT_TOKEN_PLACEHOLDER_DO_NOT_USE';
const owner='1122334455';
const origin=`http://127.0.0.1:${port}`;
const secret='test_webhook_secret_1234567890';
const toSign=(id=owner)=>{
  const values=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),query_id:'TEST',user:JSON.stringify({id:Number(id),first_name:'Глеб'})});
  const check=Array.from(values.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
  const k=createHmac('sha256','WebAppData').update(token).digest();
  values.set('hash',createHmac('sha256',k).update(check).digest('hex'));
  return values.toString();
};
const auth=toSign();
const api=async(route,{method='GET',body,id=auth,headers={}}={})=>{
  const response=await fetch(origin+route,{method,headers:{'X-Telegram-Init-Data':id,...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const value=await response.json().catch(()=>({}));
  return {status:response.status,body:value,headers:response.headers};
};
let child,output='';
async function boot(){
  child=spawn(process.execPath,['app.js'],{cwd:root,env:{...process.env,PORT:String(port),DATA_DIR:dir,BOT_TOKEN:token,OWNER_TELEGRAM_ID:owner,WEBHOOK_SECRET:secret},stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',data=>output+=data.toString());child.stderr.on('data',data=>output+=data.toString());
  for(let i=0;i<80;i++){
    if(child.exitCode!==null)throw Error('app quit: '+output);
    try{const r=await fetch(origin+'/api/health');if(r.ok)return;}catch{}
    await new Promise(r=>setTimeout(r,80));
  }
  throw Error('Startup timeout: '+output);
}
async function shutdown(){if(!child)return;const c=child;child=null;c.kill('SIGTERM');await Promise.race([new Promise(r=>c.once('exit',r)),new Promise(r=>setTimeout(r,3000))]);if(c.exitCode===null)c.kill('SIGKILL');}
const ok=(x)=>{assert.equal(x.status,200,JSON.stringify(x));assert.equal(x.body.ok,true);};
try {
  await boot();
  const home=await fetch(origin+'/');assert.equal(home.status,200);assert.match(await home.text(),/FORMA/);
  assert.equal((await fetch(origin+'/styles.css')).status,200);
  assert.equal((await fetch(origin+'/src/worker.js')).status,404);
  assert.equal((await fetch(origin+'/.env')).status,404);
  assert.equal((await fetch(origin+'/api/bootstrap')).status,401);
  assert.equal((await api('/api/bootstrap',{id:toSign('9999')})).status,403);
  const start=await api('/api/bootstrap');assert.equal(start.status,200);assert.equal(start.body.user.user_id,owner);
  ok(await api('/api/settings',{method:'POST',body:{calorie_goal:2700,protein_goal:160,fat_goal:80,carb_goal:335,reminder_enabled:true,reminder_time:'18:30',timezone:'Europe/Tallinn'}}));
  ok(await api('/api/measurements',{method:'POST',body:{date:'2026-10-17',kg:83.1,cm:89}}));
  const mid=randomUUID();
  ok(await api('/api/meals',{method:'POST',body:{id:mid,date:'2026-10-17',meal_type:'breakfast',title:'Каша',calories:460,protein:20,fat:10,carbs:72,items:[]}}));
  const fid=randomUUID();
  ok(await api('/api/favorites',{method:'POST',body:{id:fid,title:'Каша',meal_type:'breakfast',calories:460,protein:20,fat:10,carbs:72,items:[]}}));
  const wid=randomUUID();
  ok(await api('/api/workouts',{method:'POST',body:{id:wid,date:'2026-10-17',day_id:'mon',duration_sec:1800,exercises:[{key:'pushup',sets:[{reps:12,weight:0,done:true}]}]}}));
  const pid=randomUUID();const sample=Buffer.from('fake jpeg test data');
  ok(await api('/api/progress-photos',{method:'POST',body:{id:pid,date:'2026-10-17',image:'data:image/jpeg;base64,'+sample.toString('base64')}}));
  const photo=await api('/api/progress-photos/'+pid);assert.equal(photo.status,200);assert.equal(photo.body.image,'data:image/jpeg;base64,'+sample.toString('base64'));
  const extra=await api('/api/v2/bootstrap');assert.equal(extra.status,200);assert.equal(extra.body.waists[0].cm,89);assert.equal(extra.body.favorites[0].title,'Каша');assert.equal(extra.body.photos[0].id,pid);
  const boot1=await api('/api/bootstrap');assert.equal(boot1.body.meals[0].title,'Каша');assert.equal(boot1.body.workouts[0].exercises[0].key,'pushup');
  assert.equal((await api('/api/progress-photos/'+pid,{id:toSign('222222')})).status,403);
  assert.equal((await api('/telegram/webhook',{method:'POST',body:{}})).status,403);
  ok(await api('/telegram/webhook',{method:'POST',body:{update_id:7},headers:{'X-Telegram-Bot-Api-Secret-Token':secret}}));
  assert.equal((await api('/api/analyze',{method:'POST',body:{}})).status,503);
  assert.equal((await api('/api/barcode/12345678')).status,503);
  ok(await api('/api/progress-photos/'+pid,{method:'DELETE'}));
  assert.equal((await api('/api/progress-photos/'+pid)).status,404);
  await shutdown();
  await boot();
  const after=await api('/api/bootstrap');assert.equal(after.status,200);assert.equal(after.body.user.calorie_goal,2700);assert.equal(after.body.user.reminder_time,'18:30');assert.equal(after.body.meals.length,1);assert.equal(after.body.workouts.length,1);
  const after2=await api('/api/v2/bootstrap');assert.equal(after2.body.favorites.length,1);assert.equal(after2.body.waists.length,1);
  assert.match(output,/Listening on 0\.0\.0\.0/);
  console.log('PASS: static, Telegram auth/owner protection, CRUD, settings, photos, persistence, webhook guard, error paths');
} finally {await shutdown();await rm(dir,{recursive:true,force:true});}
