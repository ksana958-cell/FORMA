/** FORMA API: Telegram auth, SQLite journal, private progress photos, Telegram reminders. Compatible with BotHost. */
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=400)=>json({error:message},status);
const bounded=(x,min,max)=>Number.isFinite(Number(x))?Math.max(min,Math.min(max,Number(x))):min;
const dayPattern=/^\d{4}-\d{2}-\d{2}$/;
const validDay=v=>typeof v==='string'&&dayPattern.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'));
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9-]{8,64}$/.test(id);
const readBody=async(request,max=90000)=>{const length=Number(request.headers.get('content-length')||0);if(length>max)throw Error('Слишком большой запрос');const text=await request.text();if(text.length>max)throw Error('Слишком большой запрос');return JSON.parse(text);};
async function hmac(key,input){const k=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(input)));}
function sameHex(bytes,hash){if(!/^[a-f0-9]{64}$/i.test(hash||''))return false;const target=Uint8Array.from(hash.match(/../g).map(x=>parseInt(x,16)));let diff=0;for(let i=0;i<bytes.length;i++)diff|=bytes[i]^target[i];return diff===0;}
async function authUser(request,env){
 if(!env.BOT_TOKEN)throw Object.assign(Error('Не задан BOT_TOKEN'),{status:503});
 if(!env.OWNER_TELEGRAM_ID)throw Object.assign(Error('Задайте OWNER_TELEGRAM_ID в переменных BotHost'),{status:503});
 const raw=request.headers.get('X-Telegram-Init-Data')||'';if(!raw||raw.length>7000)throw Object.assign(Error('Открой приложение внутри Telegram'),{status:401});
 // HMAC validation: remove only `hash`. Telegram's additional `signature` field
 // is itself covered by the bot-token hash (unlike third-party Ed25519 validation).
 const params=new URLSearchParams(raw);
 const given=params.get('hash');
 params.delete('hash');
 const check=Array.from(params.entries())
   .sort(([a],[b])=>a<b?-1:a>b?1:0)
   .map(([k,v])=>`${k}=${v}`).join('\n');
 const key=await hmac(new TextEncoder().encode('WebAppData'),env.BOT_TOKEN);
 const expected=await hmac(key,check);
 if(!sameHex(expected,given)){
   console.warn('[FORMA] Telegram initData HMAC mismatch. Received fields:',
     Array.from(params.keys()).sort().join(','),
     '| hasHash:',Boolean(given), '| botId:',String(env.BOT_TOKEN).split(':')[0]);
   throw Object.assign(Error('Подпись Telegram не прошла проверку'),{status:401});
 }
 const t=Number(params.get('auth_date'));const now=Math.floor(Date.now()/1000);if(!t||t>now+60||now-t>86400)throw Object.assign(Error('Сессия истекла — открой Mini App снова'),{status:401});
 let user;try{user=JSON.parse(params.get('user')||'null')}catch{};if(!user?.id)throw Object.assign(Error('В Telegram не найден пользователь'),{status:401});
 if(String(user.id)!==String(env.OWNER_TELEGRAM_ID))throw Object.assign(Error('Приложение доступно только владельцу'),{status:403});
 return {id:String(user.id),first_name:String(user.first_name||'Глеб').slice(0,64)};
}
async function ensureUser(env,user){await env.DB.prepare('INSERT INTO users(user_id, first_name) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET first_name = excluded.first_name').bind(user.id,user.first_name).run();}
async function telegram(env,method,payload){const res=await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await res.json().catch(()=>({ok:false}));if(!res.ok||!data.ok)throw Error('Ошибка Telegram: '+(data.description||res.status));return data;}
async function onTelegram(request,env){
 if(!env.BOT_TOKEN||!env.WEBHOOK_SECRET)return fail('Bot не настроен',503);
 if(request.headers.get('X-Telegram-Bot-Api-Secret-Token')!==env.WEBHOOK_SECRET)return fail('Forbidden',403);
 let update;try{update=await readBody(request,150000)}catch{return fail('Invalid update')};
 const msg=update.message;if(msg?.chat?.type==='private'&&typeof msg.text==='string'&&msg.text.startsWith('/start')){
   const id=String(msg.from?.id||'');const allowed=env.OWNER_TELEGRAM_ID&&id===String(env.OWNER_TELEGRAM_ID);
   if(!allowed){await telegram(env,'sendMessage',{chat_id:msg.chat.id,text:env.OWNER_TELEGRAM_ID?'Этот бот персональный и не принимает других пользователей.':`Привет! Твой Telegram ID: ${id}\nУкажи его как секрет OWNER_TELEGRAM_ID в переменных BotHost, затем перезапусти /start.`});return json({ok:true});}
   await ensureUser(env,{id,first_name:msg.from?.first_name||'Глеб'});
   await env.DB.prepare('UPDATE users SET chat_id = ? WHERE user_id = ?').bind(String(msg.chat.id),id).run();
   const keyboard=env.APP_URL?{inline_keyboard:[[{text:'Открыть FORMA ↗',web_app:{url:env.APP_URL}}]]}:undefined;
   await telegram(env,'sendMessage',{chat_id:msg.chat.id,text:'FORMA 🩷\n\nТвой дневник тренировок готов. Открывай приложение, отмечай подходы и следи за прогрессом.\n\nНапоминания включаются в настройках приложения.',...(keyboard?{reply_markup:keyboard}:{})});
 }
 return json({ok:true});
}
async function handleApi(request,env){
 const path=new URL(request.url).pathname,method=request.method.toUpperCase();
 if(path==='/api/health')return json({ok:true,version:'2.6.0-media',telegramConfigured:!!env.BOT_TOKEN,databaseConfigured:!!env.DB});
 const user=await authUser(request,env);if(!env.DB)return fail('База данных SQLite не подключена',503);
 await ensureUser(env,user);const uid=user.id;
 if(path==='/api/bootstrap'&&method==='GET'){
  const [settings,workouts,weights]=await Promise.all([
   env.DB.prepare('SELECT user_id,first_name,timezone,reminder_enabled,reminder_time FROM users WHERE user_id = ?').bind(uid).first(),
   env.DB.prepare('SELECT * FROM workouts WHERE user_id=? ORDER BY date DESC, completed_at DESC LIMIT 200').bind(uid).all(),
   env.DB.prepare('SELECT date,kg FROM weights WHERE user_id=? ORDER BY date DESC LIMIT 120').bind(uid).all()
  ]);
  return json({user:settings,workouts:(workouts.results||[]).map(x=>({...x,exercises:JSON.parse(x.exercises_json)})),weights:weights.results||[]});
 }
 if(path==='/api/v2/bootstrap'&&method==='GET'){
  const [waists,photos]=await Promise.all([
   env.DB.prepare('SELECT date,cm FROM waists WHERE user_id=? ORDER BY date DESC LIMIT 150').bind(uid).all(),
   env.DB.prepare('SELECT id,date FROM progress_photos WHERE user_id=? ORDER BY date DESC LIMIT 20').bind(uid).all()
  ]);
  return json({waists:waists.results||[],photos:photos.results||[]});
 }
 if(path==='/api/measurements'&&method==='POST'){
  const b=await readBody(request,2000);if(!validDay(b.date))return fail('Некорректная дата');
  const hasK=b.kg!==undefined,hasC=b.cm!==undefined;if(!hasK&&!hasC)return fail('Укажи вес или талию');
  if(hasK){if(!Number.isFinite(Number(b.kg))||Number(b.kg)<30||Number(b.kg)>300)return fail('Проверь вес');await env.DB.prepare('INSERT INTO weights(user_id,date,kg) VALUES(?,?,?) ON CONFLICT(user_id,date) DO UPDATE SET kg=excluded.kg').bind(uid,b.date,Number(b.kg)).run();}
  if(hasC){if(!Number.isFinite(Number(b.cm))||Number(b.cm)<40||Number(b.cm)>200)return fail('Проверь окружность талии');await env.DB.prepare('INSERT INTO waists(user_id,date,cm) VALUES(?,?,?) ON CONFLICT(user_id,date) DO UPDATE SET cm=excluded.cm').bind(uid,b.date,Number(b.cm)).run();}
  return json({ok:true});
 }
 if(path==='/api/progress-photos'&&method==='POST'){
  if(!env.MEDIA)return fail('Хранилище фотографий не настроено. Проверь DATA_DIR на BotHost.',503);
  const b=await readBody(request,450000);if(!validId(b.id)||!validDay(b.date)||typeof b.image!=='string'||b.image.length>400000||!/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(b.image))return fail('Неверный формат фото');
  const bytes=Uint8Array.from(atob(b.image.split(',')[1]),c=>c.charCodeAt(0));if(bytes.length>300000)return fail('Фото слишком большое');
  const count=await env.DB.prepare('SELECT COUNT(*) AS cnt FROM progress_photos WHERE user_id=?').bind(uid).first();if((count?.cnt||0)>=16)return fail('Максимум 16 фотографий');
  const objKey=`${uid}/${b.id}.jpg`;await env.MEDIA.put(objKey,bytes,{httpMetadata:{contentType:'image/jpeg'}});
  await env.DB.prepare('INSERT OR IGNORE INTO progress_photos(id,user_id,date,object_key,created_at) VALUES(?,?,?,?,?)').bind(b.id,uid,b.date,objKey,new Date().toISOString()).run();return json({ok:true});
 }
 if(path.startsWith('/api/progress-photos/')&&method==='DELETE'){
  const id=path.slice('/api/progress-photos/'.length);if(!validId(id))return fail('Неверный ID');
  const rec=await env.DB.prepare('SELECT object_key FROM progress_photos WHERE id=? AND user_id=?').bind(id,uid).first();if(!rec)return fail('Фото не найдено',404);
  await env.DB.prepare('DELETE FROM progress_photos WHERE id=? AND user_id=?').bind(id,uid).run();
  if(env.MEDIA)await env.MEDIA.delete(rec.object_key);return json({ok:true});
 }
 if(path.startsWith('/api/progress-photos/')&&method==='GET'){
  if(!env.MEDIA)return fail('Фотохранилище не подключено',503);
  const id=path.slice('/api/progress-photos/'.length);if(!validId(id))return fail('Неверный ID');
  const rec=await env.DB.prepare('SELECT object_key FROM progress_photos WHERE id=? AND user_id=?').bind(id,uid).first();if(!rec)return fail('Фото не найдено',404);
  const obj=await env.MEDIA.get(rec.object_key);if(!obj)return fail('Фото отсутствует в хранилище',404);
  const array=new Uint8Array(await obj.arrayBuffer());let result='';for(let i=0;i<array.length;i+=8192)result+=String.fromCharCode(...array.slice(i,i+8192));return json({image:'data:image/jpeg;base64,'+btoa(result)});
 }
 if(path==='/api/workouts'&&method==='POST'){
  const b=await readBody(request,35000);if(!validId(b.id)||!validDay(b.date)||!['mon','tue','wed','thu','fri'].includes(b.day_id)||!Array.isArray(b.exercises)||b.exercises.length>15)return fail('Некорректная тренировка');
  const exercises=b.exercises.map(x=>({key:String(x.key||'').slice(0,50),sets:Array.isArray(x.sets)?x.sets.slice(0,12).map(s=>({reps:bounded(s.reps,0,300),weight:bounded(s.weight,0,100),done:!!s.done})):[]}));
  await env.DB.prepare('INSERT OR IGNORE INTO workouts (id,user_id,date,day_id,duration_sec,exercises_json,completed_at) VALUES (?,?,?,?,?,?,?)').bind(b.id,uid,b.date,b.day_id,Math.round(bounded(b.duration_sec,0,20000)),JSON.stringify(exercises),new Date().toISOString()).run();return json({ok:true});
 }
 if(path.startsWith('/api/workouts/')&&method==='DELETE'){
  const id=decodeURIComponent(path.slice('/api/workouts/'.length));if(!validId(id))return fail('Некорректный идентификатор');
  const row=await env.DB.prepare('SELECT exercises_json FROM workouts WHERE id=? AND user_id=?').bind(id,uid).first();
  if(!row)return fail('Запись не найдена',404);
  if(JSON.parse(row.exercises_json||'[]').length)return fail('Можно удалить только ручную отметку',403);
  await env.DB.prepare('DELETE FROM workouts WHERE id=? AND user_id=?').bind(id,uid).run();return json({ok:true});
 }
 if(path==='/api/settings'&&method==='POST'){
  const b=await readBody(request);const time=String(b.reminder_time||'18:00');if(!/^(?:0[8-9]|1[0-9]|20):(?:00|15|30|45)$/.test(time))return fail('Время напоминания должно быть с 08:00 до 20:45');
  let tz=String(b.timezone||'Europe/Moscow').slice(0,90);try{new Intl.DateTimeFormat('en',{timeZone:tz})}catch{tz='Europe/Moscow'}
  await env.DB.prepare('UPDATE users SET reminder_enabled=?,reminder_time=?,timezone=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?').bind(b.reminder_enabled?1:0,time,tz,uid).run();return json({ok:true});
 }
 if(path==='/api/weight'&&method==='POST'){
  const b=await readBody(request);if(!validDay(b.date)||bounded(b.kg,0,500)<30||bounded(b.kg,0,500)>300)return fail('Неверный вес или дата');await env.DB.prepare('INSERT INTO weights(user_id,date,kg) VALUES(?,?,?) ON CONFLICT(user_id,date) DO UPDATE SET kg=excluded.kg').bind(uid,b.date,bounded(b.kg,30,300)).run();return json({ok:true});
 }
 return fail('Маршрут не найден',404);
}
export async function runReminders(env,now=new Date()){if(!env.DB||!env.BOT_TOKEN)return;const rows=await env.DB.prepare('SELECT user_id,chat_id,timezone,reminder_time,last_reminder_day FROM users WHERE reminder_enabled=1 AND chat_id IS NOT NULL').bind().all();for(const u of rows.results||[]){try{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:u.timezone||'Europe/Moscow',weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,hourCycle:'h23'}).formatToParts(now);
  const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));if(!['Mon','Tue','Thu','Fri'].includes(p.weekday))continue;
  const date=`${p.year}-${p.month}-${p.day}`;if(u.last_reminder_day===date)continue;const time=`${p.hour.padStart(2,'0')}:${p.minute}`;const [hour,minute]=time.split(':').map(Number);const [targetHour,targetMinute]=u.reminder_time.split(':').map(Number);const delta=(hour*60+minute)-(targetHour*60+targetMinute);if(delta<0||delta>=60)continue;
  const completed=await env.DB.prepare('SELECT id FROM workouts WHERE user_id=? AND date=? LIMIT 1').bind(u.user_id,date).first();if(completed)continue;
  const type={Mon:'верх A: грудь, спина и руки + 10 минут дорожки',Tue:'низ A: ноги и корпус + 12 минут дорожки',Thu:'верх B: грудь, спина, плечи и руки + 10 минут дорожки',Fri:'низ B: ноги и корпус + 12 минут дорожки'}[p.weekday];
  await telegram(env,'sendMessage',{chat_id:u.chat_id,text:`FORMA · день тренировки 💪\n\nСегодня в плане: ${type}.\nОткрой приложение, чтобы начать и отметить подходы.`,...(env.APP_URL?{reply_markup:{inline_keyboard:[[{text:'Начать тренировку ↗',web_app:{url:env.APP_URL}}]]}}:{})});
  await env.DB.prepare('UPDATE users SET last_reminder_day=? WHERE user_id=?').bind(date,u.user_id).run();
 }catch(error){console.error('Reminder error:',String(error).slice(0,120));}}}
export default {
 async fetch(request,env){const path=new URL(request.url).pathname;try{if(path==='/telegram/webhook'){if(request.method!=='POST')return fail('Method not allowed',405);return await onTelegram(request,env);}if(path.startsWith('/api/'))return await handleApi(request,env);return env.ASSETS.fetch(request);}catch(error){console.error('Worker error:',error?.message||'error');return fail(error?.status?error.message:'Произошла ошибка сервера, попробуй снова.',error?.status||500);}},
 async scheduled(event,env,ctx){ctx.waitUntil(runReminders(env));}
};
