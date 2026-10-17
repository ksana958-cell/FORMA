/** FORMA API: Telegram auth, SQLite journal, photo estimation, Telegram reminders. Compatible with BotHost. */
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
 const params=new URLSearchParams(raw);const given=params.get('hash');params.delete('hash');params.delete('signature');const check=Array.from(params.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');const key=await hmac(new TextEncoder().encode('WebAppData'),env.BOT_TOKEN);const expected=await hmac(key,check);
 if(!sameHex(expected,given))throw Object.assign(Error('Подпись Telegram не прошла проверку'),{status:401});
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
   await telegram(env,'sendMessage',{chat_id:msg.chat.id,text:'FORMA 🩷\n\nТвой дневник тренировок и питания готов. Открывай приложение, отмечай подходы и сохраняй еду.\n\nНапоминания включаются в настройках приложения.',...(keyboard?{reply_markup:keyboard}:{})});
 }
 return json({ok:true});
}
async function analyzeMeal(body,env){
 if(!env.OPENAI_API_KEY) return fail('Распознавание пока не подключено: добавь секрет OPENAI_API_KEY в настройках BotHost. Еду можно вносить вручную.',503);
 const photo=body?.image;if(typeof photo!=='string'||photo.length>3600000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo))return fail('Нужна сжатая фотография JPG, PNG или WEBP (до ~2,5 МБ)');
 const schema={type:'object',additionalProperties:false,properties:{title:{type:'string'},portion_grams:{type:'number'},calories:{type:'number'},protein:{type:'number'},fat:{type:'number'},carbs:{type:'number'},notes:{type:'string'},items:{type:'array',items:{type:'object',additionalProperties:false,properties:{name:{type:'string'},grams:{type:'number'}},required:['name','grams']}}},required:['title','portion_grams','calories','protein','fat','carbs','notes','items']};
 const bodyOpenAI={model:env.OPENAI_MODEL||'gpt-4.1-mini',store:false,temperature:0.2,max_output_tokens:850,input:[{role:'system',content:[{type:'input_text',text:'Ты помощник по оценке питательности еды на русском языке. По одной фотографии точные калории определить НЕЛЬЗЯ. Дай осторожную приблизительную оценку видимых пищевых компонентов. Если продукты/порции не распознаются, укажи неопределённость в notes, не выдумывай точные граммы. В notes напомни пользователю уточнить порцию, масла, соусы и скрытые ингредиенты. Все цифры на одну изображённую порцию. Не делай медицинских выводов. Возвращай только JSON по схеме.'}]},{role:'user',content:[{type:'input_text',text:'Определи видимую еду и примерно оцени калории, белки, жиры, углеводы и ингредиенты. Если фото неоднозначное, объясни сомнения в notes.'},{type:'input_image',image_url:photo,detail:'low'}]}],text:{format:{type:'json_schema',name:'meal_estimate',strict:true,schema}}};
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),35000);
 let result;
 try{const res=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(bodyOpenAI),signal:controller.signal});result=await res.json();if(!res.ok){console.warn('OpenAI status:',res.status);return fail('Сервис распознавания недоступен: проверь ключ и баланс OpenAI API.',502);}}
 catch(e){return fail(e.name==='AbortError'?'ИИ отвечает слишком долго, попробуй ещё раз.':'Не удалось связаться с сервисом распознавания.',502)}finally{clearTimeout(timeout)}
 const output=result.output?.flatMap(o=>o.content||[]).find(c=>c.type==='output_text')?.text;let parsed;
 try{parsed=JSON.parse(output||'');}catch{return fail('ИИ не смог выдать корректный ответ. Попробуй другое фото.',502)}
 const clean={title:String(parsed.title||'Блюдо').slice(0,120),portion_grams:bounded(parsed.portion_grams,0,3000),calories:bounded(parsed.calories,0,10000),protein:bounded(parsed.protein,0,1000),fat:bounded(parsed.fat,0,1000),carbs:bounded(parsed.carbs,0,1000),notes:String(parsed.notes||'Оценка приблизительная. Уточни вес порции и ингредиенты.').slice(0,450),items:Array.isArray(parsed.items)?parsed.items.slice(0,15).map(i=>({name:String(i.name||'Ингредиент').slice(0,80),grams:bounded(i.grams,0,3000)})):[]};
 return json(clean);
}
async function handleApi(request,env){
 const path=new URL(request.url).pathname,method=request.method.toUpperCase();
 if(path==='/api/health')return json({ok:true,telegramConfigured:!!env.BOT_TOKEN,databaseConfigured:!!env.DB,aiConfigured:!!env.OPENAI_API_KEY});
 const user=await authUser(request,env);if(!env.DB)return fail('База данных SQLite не подключена',503);
 await ensureUser(env,user);const uid=user.id;
 if(path==='/api/bootstrap'&&method==='GET'){
  const [settings,workouts,meals,weights]=await Promise.all([
   env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(uid).first(),
   env.DB.prepare('SELECT * FROM workouts WHERE user_id=? ORDER BY date DESC, completed_at DESC LIMIT 200').bind(uid).all(),
   env.DB.prepare('SELECT * FROM meals WHERE user_id=? ORDER BY date DESC, created_at DESC LIMIT 1000').bind(uid).all(),
   env.DB.prepare('SELECT date,kg FROM weights WHERE user_id=? ORDER BY date DESC LIMIT 120').bind(uid).all()
  ]);
  return json({user:settings,workouts:(workouts.results||[]).map(x=>({...x,exercises:JSON.parse(x.exercises_json)})),meals:(meals.results||[]).map(x=>({...x,items:JSON.parse(x.items_json)})),weights:weights.results||[]});
 }
 if(path==='/api/v2/bootstrap'&&method==='GET'){
  const [waists,favorites,photos]=await Promise.all([
   env.DB.prepare('SELECT date,cm FROM waists WHERE user_id=? ORDER BY date DESC LIMIT 150').bind(uid).all(),
   env.DB.prepare('SELECT id,title,meal_type,calories,protein,fat,carbs,items_json FROM favorites WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(uid).all(),
   env.DB.prepare('SELECT id,date FROM progress_photos WHERE user_id=? ORDER BY date DESC LIMIT 20').bind(uid).all()
  ]);
  return json({waists:waists.results||[],favorites:(favorites.results||[]).map(f=>({...f,items:JSON.parse(f.items_json||'[]')})),photos:photos.results||[]});
 }
 if(path==='/api/measurements'&&method==='POST'){
  const b=await readBody(request,2000);if(!validDay(b.date))return fail('Некорректная дата');
  const hasK=b.kg!==undefined,hasC=b.cm!==undefined;if(!hasK&&!hasC)return fail('Укажи вес или талию');
  if(hasK){if(!Number.isFinite(Number(b.kg))||Number(b.kg)<30||Number(b.kg)>300)return fail('Проверь вес');await env.DB.prepare('INSERT INTO weights(user_id,date,kg) VALUES(?,?,?) ON CONFLICT(user_id,date) DO UPDATE SET kg=excluded.kg').bind(uid,b.date,Number(b.kg)).run();}
  if(hasC){if(!Number.isFinite(Number(b.cm))||Number(b.cm)<40||Number(b.cm)>200)return fail('Проверь окружность талии');await env.DB.prepare('INSERT INTO waists(user_id,date,cm) VALUES(?,?,?) ON CONFLICT(user_id,date) DO UPDATE SET cm=excluded.cm').bind(uid,b.date,Number(b.cm)).run();}
  return json({ok:true});
 }
 if(path==='/api/favorites'&&method==='POST'){
  const b=await readBody(request,12000);if(!validId(b.id)||typeof b.title!=='string'||!b.title.trim()||b.title.length>120||!['breakfast','lunch','dinner','snack'].includes(b.meal_type))return fail('Некорректное блюдо');
  const items=Array.isArray(b.items)?b.items.slice(0,20):[];
  await env.DB.prepare('INSERT OR IGNORE INTO favorites(id,user_id,title,meal_type,calories,protein,fat,carbs,items_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(b.id,uid,b.title.trim(),b.meal_type,bounded(b.calories,0,10000),bounded(b.protein,0,1000),bounded(b.fat,0,1000),bounded(b.carbs,0,1000),JSON.stringify(items),new Date().toISOString()).run();return json({ok:true});
 }
 if(path.startsWith('/api/favorites/')&&method==='DELETE'){
  const id=decodeURIComponent(path.slice('/api/favorites/'.length));if(!validId(id))return fail('Некорректный ID');await env.DB.prepare('DELETE FROM favorites WHERE id=? AND user_id=?').bind(id,uid).run();return json({ok:true});
 }
 if(path.startsWith('/api/barcode/')&&method==='GET'){
  const code=path.slice('/api/barcode/'.length);if(!/^\d{8,14}$/.test(code))return fail('Неверный штрихкод');
  if(!env.OFF_CONTACT)return fail('Для каталога штрихкодов настрой OFF_CONTACT: контактный email приложения на сервере.',503);
  try{const url=`https://world.openfoodfacts.org/api/v2/product/${code}?fields=product_name,product_name_ru,nutriments,quantity`;
   const res=await fetch(url,{headers:{'User-Agent':`FORMA/2.0 (contact: ${String(env.OFF_CONTACT).slice(0,120)})`},signal:AbortSignal.timeout(12000)});
   if(!res.ok)return fail('Сервис штрихкодов временно недоступен',502);
   const data=await res.json();if(!data?.product)return fail('Продукт не найден. Добавь его вручную.',404);
   const p=data.product,n=p.nutriments||{};
   const val=k=>Number.isFinite(Number(n[k]))?Number(n[k]):null;
   const energy=val('energy-kcal_100g')??(val('energy-kj_100g')!==null?val('energy-kj_100g')/4.184:null);
   if(energy===null)return fail('У этого продукта нет данных по калориям — проверь этикетку.',422);
   return json({title:String(p.product_name_ru||p.product_name||'Продукт').slice(0,120),calories:Math.round(energy),protein:bounded(val('proteins_100g'),0,100),fat:bounded(val('fat_100g'),0,100),carbs:bounded(val('carbohydrates_100g'),0,100),portion_grams:100,items:[],notes:'Средние значения из Open Food Facts на 100 г. Пожалуйста, проверь упаковку.'});
  }catch{return fail('Не удалось обратиться к каталогу продуктов',502)}
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
  const b=await readBody(request,35000);if(!validId(b.id)||!validDay(b.date)||!['mon','wed','fri'].includes(b.day_id)||!Array.isArray(b.exercises)||b.exercises.length>15)return fail('Некорректная тренировка');
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
  await env.DB.prepare('UPDATE users SET calorie_goal=?,protein_goal=?,fat_goal=?,carb_goal=?,reminder_enabled=?,reminder_time=?,timezone=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?').bind(Math.round(bounded(b.calorie_goal,1000,6000)),Math.round(bounded(b.protein_goal,40,400)),Math.round(bounded(b.fat_goal,20,200)),Math.round(bounded(b.carb_goal,40,800)),b.reminder_enabled?1:0,time,tz,uid).run();return json({ok:true});
 }
 if(path==='/api/weight'&&method==='POST'){
  const b=await readBody(request);if(!validDay(b.date)||bounded(b.kg,0,500)<30||bounded(b.kg,0,500)>300)return fail('Неверный вес или дата');await env.DB.prepare('INSERT INTO weights(user_id,date,kg) VALUES(?,?,?) ON CONFLICT(user_id,date) DO UPDATE SET kg=excluded.kg').bind(uid,b.date,bounded(b.kg,30,300)).run();return json({ok:true});
 }
 if(path==='/api/meals'&&method==='POST'){
  const b=await readBody(request,14000);if(!validId(b.id)||!validDay(b.date)||!['breakfast','lunch','dinner','snack'].includes(b.meal_type)||typeof b.title!=='string'||!b.title.trim()||b.title.length>120)return fail('Проверь название блюда и дату');const items=Array.isArray(b.items)?b.items.slice(0,15):[];
  await env.DB.prepare('INSERT OR IGNORE INTO meals(id,user_id,date,meal_type,title,calories,protein,fat,carbs,items_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(b.id,uid,b.date,b.meal_type,b.title.trim(),Math.round(bounded(b.calories,0,10000)),bounded(b.protein,0,1000),bounded(b.fat,0,1000),bounded(b.carbs,0,1000),JSON.stringify(items),new Date().toISOString()).run();return json({ok:true});
 }
 if(path.startsWith('/api/meals/')&&method==='DELETE'){
  const id=decodeURIComponent(path.slice('/api/meals/'.length));if(!validId(id))return fail('Некорректный идентификатор');await env.DB.prepare('DELETE FROM meals WHERE id=? AND user_id=?').bind(id,uid).run();return json({ok:true});
 }
 if(path==='/api/analyze'&&method==='POST'){const b=await readBody(request,4000000);return await analyzeMeal(b,env);}
 return fail('Маршрут не найден',404);
}
async function runReminders(env){if(!env.DB||!env.BOT_TOKEN)return;const now=new Date();const rows=await env.DB.prepare('SELECT user_id,chat_id,timezone,reminder_time,last_reminder_day FROM users WHERE reminder_enabled=1 AND chat_id IS NOT NULL').all();for(const u of rows.results||[]){try{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:u.timezone||'Europe/Moscow',weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,hourCycle:'h23'}).formatToParts(now);
  const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));if(!['Mon','Wed','Fri'].includes(p.weekday))continue;
  const date=`${p.year}-${p.month}-${p.day}`;if(u.last_reminder_day===date)continue;const time=`${p.hour.padStart(2,'0')}:${p.minute}`;const [hour,minute]=time.split(':').map(Number);const [targetHour,targetMinute]=u.reminder_time.split(':').map(Number);const delta=(hour*60+minute)-(targetHour*60+targetMinute);if(delta<0||delta>=60)continue;
  const completed=await env.DB.prepare('SELECT id FROM workouts WHERE user_id=? AND date=? LIMIT 1').bind(u.user_id,date).first();if(completed)continue;
  const type={Mon:'грудь, ноги и руки',Wed:'спина, плечи и ноги',Fri:'грудь, руки и предплечья'}[p.weekday];
  await telegram(env,'sendMessage',{chat_id:u.chat_id,text:`FORMA · день тренировки 💪\n\nСегодня в плане: ${type}.\nОткрой приложение, чтобы начать и отметить подходы.`,...(env.APP_URL?{reply_markup:{inline_keyboard:[[{text:'Начать тренировку ↗',web_app:{url:env.APP_URL}}]]}}:{})});
  await env.DB.prepare('UPDATE users SET last_reminder_day=? WHERE user_id=?').bind(date,u.user_id).run();
 }catch(error){console.error('Reminder error:',String(error).slice(0,120));}}}
export default {
 async fetch(request,env){const path=new URL(request.url).pathname;try{if(path==='/telegram/webhook'){if(request.method!=='POST')return fail('Method not allowed',405);return await onTelegram(request,env);}if(path.startsWith('/api/'))return await handleApi(request,env);return env.ASSETS.fetch(request);}catch(error){console.error('Worker error:',error?.message||'error');return fail(error?.status?error.message:'Произошла ошибка сервера, попробуй снова.',error?.status||500);}},
 async scheduled(event,env,ctx){ctx.waitUntil(runReminders(env));}
};
