import assert from 'node:assert/strict';
import {runReminders} from '../src/worker.js';
const realFetch=globalThis.fetch;
const sent=[];
let completed=false;
const user={user_id:'test-user',chat_id:'test-chat',timezone:'Europe/Moscow',reminder_time:'18:30',last_reminder_day:null};
const env={BOT_TOKEN:'123:LOCAL_TEST_ONLY',APP_URL:'https://example.invalid',DB:{prepare(sql){return {bind(...args){return {
 async all(){assert(sql.startsWith('SELECT user_id'));return {results:[user]};},
 async first(){assert(sql.startsWith('SELECT id FROM workouts'));return completed?{id:'done'}:null;},
 async run(){assert(sql.startsWith('UPDATE users SET last_reminder_day'));user.last_reminder_day=args[0];return {success:true};}
};}};}}};
globalThis.fetch=async(url,options)=>{assert(String(url).startsWith('https://api.telegram.org/bot123:LOCAL_TEST_ONLY/sendMessage'));sent.push(JSON.parse(options.body));return new Response(JSON.stringify({ok:true,result:{message_id:sent.length}}),{status:200,headers:{'Content-Type':'application/json'}});};
try{
 const expected=new Map([[19,'верх A'],[20,'низ A'],[22,'верх B'],[23,'низ B']]);
 for(let day=19;day<=25;day++){
  user.last_reminder_day=null;const before=sent.length,now=new Date(`2026-10-${day}T15:30:00Z`);
  await runReminders(env,now);assert.equal(sent.length-before,expected.has(day)?1:0,`weekday ${day}`);
  if(expected.has(day)){assert(sent.at(-1).text.includes(expected.get(day)));assert(sent.at(-1).text.includes(day===19||day===22?'10 минут':'12 минут'));await runReminders(env,now);assert.equal(sent.length-before,1,'no duplicate');}
 }
 assert.equal(sent.length,4);
 user.last_reminder_day=null;completed=true;await runReminders(env,new Date('2026-10-20T15:30:00Z'));assert.equal(sent.length,4,'completed day is skipped');completed=false;
 for(const time of ['15:29:00','16:30:00']){user.last_reminder_day=null;await runReminders(env,new Date(`2026-10-20T${time}Z`));assert.equal(sent.length,4,'outside the reminder window');}
 user.timezone='America/Los_Angeles';user.last_reminder_day=null;
 await runReminders(env,new Date('2026-10-21T01:30:00Z')); // local Tuesday at 18:30, UTC Wednesday
 assert.equal(sent.length,5);assert(sent.at(-1).text.includes('низ A'));assert.equal(user.last_reminder_day,'2026-10-20');
 console.log('PASS reminders: Mon/Tue/Thu/Fri, focus and cardio, rest days, deduplication, completed-day suppression, time window, and local timezone. Telegram requests were mocked; no messages sent.');
}finally{globalThis.fetch=realFetch;}
