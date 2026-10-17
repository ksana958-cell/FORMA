/** FORMA BotHost entry point. Dependency-free Node 22.13+/24 server. */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, unlink, stat } from 'node:fs/promises';
import { readFileSync, mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve, join, extname, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from './src/worker.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, 'public');
const DATA_DIR = resolve(process.env.DATA_DIR || join(ROOT, 'data'));
const PORT = Number(process.env.PORT || 3000);
const envToken = process.env.BOT_TOKEN?.trim() || '';
const APP_URL = (process.env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
const WEBHOOK_SECRET = (process.env.WEBHOOK_SECRET || '').trim();

mkdirSync(DATA_DIR, { recursive: true });
const database = new DatabaseSync(join(DATA_DIR, 'forma.sqlite'), { timeout: 5000 });
database.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
database.exec(readFileSync(join(ROOT,'schema.sql'), 'utf8'));

// D1-style adapter to keep all existing API endpoints and validation intact.
const DB = { prepare(sql) { return {
  bind(...values) {
    const stmt = database.prepare(sql);
    return {
      async first() { return stmt.get(...values) || null; },
      async all() { return { results: stmt.all(...values) }; },
      async run() { return stmt.run(...values); }
    };
  }
}; }};
const MEDIA_ROOT = join(DATA_DIR, 'private-photos');
const mediaPath = key => {
  if (!/^\d{1,20}\/[-a-zA-Z0-9]{8,64}\.jpg$/.test(key)) throw Error('Bad media key');
  const candidate = resolve(MEDIA_ROOT, key);
  if (!candidate.startsWith(resolve(MEDIA_ROOT) + sep)) throw Error('Unsafe path');
  return candidate;
};
const MEDIA = {
  async put(key, bytes) { const p=mediaPath(key); await mkdir(dirname(p),{recursive:true}); await writeFile(p,bytes,{flag:'wx'}); },
  async get(key) { try { const data=await readFile(mediaPath(key)); return { async arrayBuffer() { return Uint8Array.from(data).buffer; } }; } catch (e) { if (e.code==='ENOENT') return null; throw e; } },
  async delete(key) { try { await unlink(mediaPath(key)); } catch (e) { if (e.code!=='ENOENT') throw e; } }
};
const MIME = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif','.webp':'image/webp','.ico':'image/x-icon','.mp4':'video/mp4','.woff2':'font/woff2' };
const ASSETS = {async fetch(request) {
  const url=new URL(request.url);
  const location=url.pathname==='/'?'/index.html':url.pathname;
  let decoded;
  try { decoded=decodeURIComponent(location); } catch { return new Response('Bad URL',{status:400}); }
  const segments=decoded.split('/');
  if (segments.some(s=>s==='..'||s==='.'||s.startsWith('.')) || decoded.includes('\\') || decoded.includes('\0')) return new Response('Not found',{status:404});
  const full=resolve(PUBLIC,'.'+decoded);
  if (!full.startsWith(resolve(PUBLIC)+sep)) return new Response('Not found',{status:404});
  const ext=extname(full).toLowerCase();
  if (!MIME[ext]) return new Response('Not found',{status:404});
  try {
    const meta=await stat(full);
    if (!meta.isFile() || meta.size>8*1024*1024) return new Response('Not found',{status:404});
    const data=await readFile(full);
    return new Response(data,{status:200,headers:{'Content-Type':MIME[ext],'Cache-Control':ext==='.html'?'no-store':'public, max-age=3600','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
  } catch (e) { if (e.code==='ENOENT'||e.code==='EISDIR') return new Response('Not found',{status:404}); throw e; }
}};
const env = {
  BOT_TOKEN: envToken,
  OWNER_TELEGRAM_ID: process.env.OWNER_TELEGRAM_ID?.trim(),
  APP_URL,
  WEBHOOK_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim(),
  GEMINI_MODEL: process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash',
  OFF_CONTACT: process.env.OFF_CONTACT?.trim(),
  DB, MEDIA, ASSETS
};

async function registerTelegram() {
  if (!envToken || !APP_URL || !WEBHOOK_SECRET) {
    console.log('[FORMA] Telegram webhook not configured yet. Set BOT_TOKEN, PUBLIC_BASE_URL, WEBHOOK_SECRET.');
    return;
  }
  if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(APP_URL) || !/^[a-zA-Z0-9_-]{16,256}$/.test(WEBHOOK_SECRET)) {
    console.error('[FORMA] Invalid PUBLIC_BASE_URL (HTTPS) or WEBHOOK_SECRET (16–256 chars A-Z 0-9 _ -).');
    return;
  }
  const call=async(method,payload)=>{
    const r=await fetch(`https://api.telegram.org/bot${envToken}/${method}`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});
    const data=await r.json();if(!r.ok||!data.ok)throw Error(`${method}: ${data.description||r.status}`);return data.result;
  };
  try {
    await call('setWebhook',{url:`${APP_URL}/telegram/webhook`,secret_token:WEBHOOK_SECRET,allowed_updates:['message'],drop_pending_updates:false});
    await call('setChatMenuButton',{menu_button:{type:'web_app',text:'Открыть FORMA',web_app:{url:APP_URL}}});
    console.log('[FORMA] Telegram webhook and menu button configured.');
    // Bot username is public. Display it for troubleshooting when initData comes from a different bot.
    try {const bot=await call('getMe',{}); console.log(`[FORMA] Connected Telegram bot: @${bot.username} (id ${bot.id})`);}
    catch (e) {console.warn('[FORMA] Bot identity check failed:', String(e.message).slice(0,160));}
  } catch (error) { console.warn('[FORMA] Telegram setup failed:',String(error.message).slice(0,250)); }
}

let reminderBusy=false;
async function checkReminders() {
  if (reminderBusy || !envToken) return;
  reminderBusy=true;
  try { await worker.scheduled(null,env,{waitUntil(p){ return Promise.resolve(p).catch(e=>console.error('[FORMA] reminder:',e.message)); }}); }
  catch (e) { console.error('[FORMA] reminder scheduler:',e.message); }
  finally { reminderBusy=false; }
}

const server=createServer(async(req,res)=>{
  try {
    const pathname=new URL(req.url||'/', 'http://localhost').pathname;
    const method=req.method||'GET';
    if (!['GET','POST','DELETE','HEAD'].includes(method)) {res.writeHead(405);res.end('Method not allowed');return;}
    const max=4_500_000;
    if (Number(req.headers['content-length'])>max) {res.writeHead(413);res.end('Payload too large');return;}
    const body=[];let bytes=0;
    if (method==='POST'||method==='DELETE') {
      for await (const chunk of req) {bytes+=chunk.length;if(bytes>max){res.writeHead(413);res.end('Payload too large');return;}body.push(chunk);}
    }
    const url=`http://127.0.0.1:${PORT}${req.url||'/'}`;
    const request=new Request(url,{method,headers:req.headers,...(body.length?{body:Buffer.concat(body)}:{})});
    const response=await worker.fetch(request,env);
    res.statusCode=response.status;
    for (const [key,value] of response.headers) res.setHeader(key,value);
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Frame-Options','SAMEORIGIN');
    res.setHeader('Permissions-Policy','camera=(self)');
    if (pathname.startsWith('/api/')||pathname==='/telegram/webhook') res.setHeader('Cache-Control','no-store');
    if (method==='HEAD') {res.end();return;}
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch(error) {console.error('[FORMA] request:',error.message);if(!res.headersSent){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Ошибка сервера'}));}else res.end();}
});
server.listen(PORT,'0.0.0.0',()=>{
  console.log(`[FORMA] Listening on 0.0.0.0:${PORT}; SQLite and photos in ${DATA_DIR}`);
  void registerTelegram();
  void checkReminders();
});
const ticker=setInterval(()=>void checkReminders(),60_000);
ticker.unref();
process.on('SIGTERM',()=>{clearInterval(ticker);server.close(()=>{database.close();process.exit(0)});setTimeout(()=>process.exit(1),4000).unref();});
