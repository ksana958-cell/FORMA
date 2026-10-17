/** Optional manual setup if BotHost's automatic setup didn't complete. */
const token=process.env.BOT_TOKEN;
const base=(process.env.PUBLIC_BASE_URL||'').trim().replace(/\/+$/,'');
const secret=process.env.WEBHOOK_SECRET;
if(!token||!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(base)||!secret||!/^[A-Za-z0-9_-]{16,256}$/.test(secret)){
  console.error('Укажите BOT_TOKEN, PUBLIC_BASE_URL=https://домен и WEBHOOK_SECRET (16–256 символов A-Z,0-9,_, -) в переменных окружения.');process.exit(1);
}
const call=async(method,body)=>{
  const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const ans=await r.json();if(!ans.ok)throw Error(ans.description||'Telegram API error');
  console.log(method+': OK');
};
try{
  await call('setWebhook',{url:base+'/telegram/webhook',secret_token:secret,allowed_updates:['message']});
  await call('setChatMenuButton',{menu_button:{type:'web_app',text:'Открыть FORMA',web_app:{url:base}}});
}catch(e){console.error('Ошибка настройки Telegram:',e.message);process.exitCode=1;}
