/* Нарисованные нами схематичные анимации; показывают направление движения,
   НЕ являются биомеханически точным видеоинструктажем. Используются как резерв, если демонстрация недоступна. */
(() => {
'use strict';
const category={pushUp:'push',calfRaise:'calf',gluteBridge:'bridge',pushElevated:'pushElev',pushPause:'push',splitSquat:'split',reverseLunge:'lunge',goblet:'squat',oneRow:'row',bentRow:'row',rdl:'hinge',floorPress:'floor',squeezePress:'floor',skullCrusher:'triFloor',curl:'curl',hammer:'curl',concentration:'curlSeated',reverseCurl:'curl',tricepsOH:'tri',shoulderPress:'up',deadBug:'bug',treadmill:'walk'};
const line=(a,b,c,d)=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`;
const head=(x,y)=>`<circle cx="${x}" cy="${y}" r="13"/>`;
const motion={
 calf:`<path d="M225 36v135M105 171h138" stroke="#b7778f" stroke-width="3"/>${head(153,43)}${line(153,58,153,115)}${line(153,80,223,94)}${line(153,115,153,153)}${line(153,153,176,169)}<path d="M153 169h23" stroke-dasharray="4 5" opacity=".5"/><path d="M117 157v-22m-6 7 6-7 6 7" stroke="#F95E95" stroke-width="3"/>`,
 bridge:`${line(45,172,283,172)}${head(65,155)}${line(80,158,160,113)}${line(160,113,220,113)}${line(220,113,240,168)}${line(240,168,259,168)}${line(92,151,127,166)}<path d="M80 158h80l60-45" stroke-dasharray="5 6" opacity=".4"/><path d="M160 153v-25m-6 7 6-7 6 7" stroke="#F95E95" stroke-width="3"/>`,
 pushElev:`<path d="M248 147h33v20h-33z" stroke="#b7778f" fill="#583546"/><g class="mv-push">${head(96,119)}${line(110,120,207,111)}${line(207,111,262,139)}${line(131,117,135,161)}${line(167,113,180,161)}</g>${line(55,168,283,168)}`,
 split:`<rect x="216" y="132" width="43" height="10" rx="3" stroke="#b7778f" fill="#583546"/><g class="mv-squat">${head(139,48)}${line(139,61,142,112)}${line(142,112,113,145)}${line(113,145,100,169)}${line(142,112,200,134)}${line(200,134,228,133)}${line(142,81,112,105)}${line(142,81,177,100)}</g>${line(62,170,283,170)}`,
 lunge:`<g class="mv-squat">${head(146,49)}${line(146,63,146,115)}${line(146,115,117,146)}${line(117,146,108,170)}${line(146,115,194,145)}${line(194,145,219,169)}${line(146,85,122,115)}${line(146,85,176,111)}</g>${line(63,171,275,171)}`,
 tri:`<g class="mv-stand">${head(154,48)}${line(154,62,154,123)}${line(154,123,132,169)}${line(154,123,178,169)}${line(154,74,127,108)}${line(154,74,188,59)}<g class="mv-tri-arm">${line(188,59,206,94)}<rect x="196" y="90" width="22" height="12" rx="3"/></g></g>${line(77,170,255,170)}`,
 triFloor:`${line(48,166,277,166)}<g>${head(73,148)}${line(87,149,210,149)}${line(210,149,241,130)}${line(241,130,264,166)}${line(142,149,148,87)}<g class="mv-tri-arm">${line(148,87,179,104)}<rect x="173" y="99" width="23" height="12" rx="3"/></g></g>`,
 bug:`${line(42,168,283,168)}<g>${head(68,152)}${line(80,152,178,152)}${line(105,150,116,101)}<g class="mv-bug-leg">${line(180,152,217,119)}${line(217,119,247,133)}</g><g class="mv-bug-arm">${line(122,151,145,99)}${line(145,99,162,68)}</g></g>`,
 curlSeated:`<path d="M148 128h63v10h-63v31" stroke="#b7778f" stroke-width="6"/><g>${head(135,58)}${line(135,72,156,131)}${line(156,131,198,146)}${line(198,146,215,166)}${line(136,89,120,125)}<g class="mv-curl-arm">${line(120,125,146,157)}<rect x="142" y="151" width="22" height="12" rx="3"/></g></g>${line(71,172,276,172)}`,
 push:`<g class="mv-push"><circle cx="100" cy="104" r="13"/>${line(115,106,208,116)}${line(208,116,270,140)}${line(208,116,269,111)}${line(137,108,142,160)}${line(178,113,190,160)}</g>${line(70,166,289,166)}`,
 squat:`<g class="mv-squat">${head(157,52)}${line(157,67,157,122)}${line(157,88,127,116)}${line(157,88,185,114)}${line(157,122,133,158)}${line(133,158,101,165)}${line(157,122,188,150)}${line(188,150,214,165)}</g>${line(69,169,267,169)}`,
 row:`<g class="mv-hinge">${head(109,80)}${line(118,91,188,116)}${line(188,116,197,167)}${line(188,116,245,166)}${line(145,102,151,150)}<g class="mv-row-arm">${line(157,106,168,144)}<rect x="156" y="142" width="25" height="13" rx="4"/></g></g>${line(60,168,274,168)}`,
 hinge:`<g class="mv-hinge">${head(111,74)}${line(123,84,184,110)}${line(184,110,176,168)}${line(184,110,221,167)}${line(137,92,128,141)}${line(154,100,157,147)}<rect x="116" y="139" width="18" height="12" rx="3"/><rect x="147" y="145" width="18" height="12" rx="3"/></g>${line(58,170,277,170)}`,
 floor:`${line(50,167,275,167)}<g class="mv-floor">${head(73,148)}${line(87,149,210,149)}${line(210,149,240,127)}${line(240,127,266,166)}${line(127,149,127,94)}${line(162,149,162,94)}<rect x="112" y="83" width="31" height="12" rx="4"/><rect x="148" y="83" width="28" height="12" rx="4"/></g>`,
 curl:`<g class="mv-stand">${head(157,37)}${line(157,52,157,121)}${line(157,121,134,167)}${line(157,121,178,167)}${line(157,72,123,106)}<g class="mv-curl-arm">${line(157,73,190,110)}${line(190,110,198,149)}<rect x="186" y="142" width="28" height="12" rx="4"/></g></g>${line(82,169,245,169)}`,
 up:`<g class="mv-stand">${head(157,47)}${line(157,61,157,124)}${line(157,124,135,171)}${line(157,124,180,171)}${line(157,77,127,108)}<g class="mv-overhead">${line(157,77,191,94)}${line(191,94,205,52)}<rect x="194" y="43" width="24" height="13" rx="3"/></g></g>${line(78,173,247,173)}`,
 walk:`${line(52,162,279,162)}<rect x="68" y="148" width="202" height="14" rx="5" class="tread-belt"/><g class="mv-stand">${head(157,48)}${line(157,62,157,118)}${line(157,76,122,105)}${line(157,76,188,105)}<g class="mv-walk-leg">${line(157,118,125,150)}${line(125,150,105,150)}</g><g class="mv-walk-leg alt">${line(157,118,184,153)}${line(184,153,205,153)}</g></g>`
};
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=value=>typeof value==='string'&&(/^(?:\/media\/|https:\/\/)/.test(value)||/^data:(?:image\/(?:gif|png|jpeg|webp)|video\/(?:mp4|webm));base64,/.test(value))?value:'';
const pausedGIFs=new Map();
const reducedMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isPaused=key=>pausedGIFs.has(key)?pausedGIFs.get(key):reducedMotion();
function assetFor(key){
 const legacy=window.FORMA_VIDEO_MAP?.[key];
 const asset=legacy?{src:legacy,type:'video'}:window.FORMA_MEDIA_MAP?.[key];
 if(!asset||!safeUrl(asset.src))return null;
 return {...asset,src:safeUrl(asset.src),poster:safeUrl(asset.poster)};
}
function graphicFor(key){const mode=category[key]||'curl';return `<div class="motion-card"><div class="motion-label"><span class="motion-pulse"></span> ${['calf','bridge'].includes(mode)?'Схема положения и движения':'Схематичная анимация движения'}</div><svg aria-label="Схема направления движения" role="img" viewBox="0 0 325 205" class="motion-svg ${mode}" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#f1a7bd" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${motion[mode]}</g></svg><small>Показывает принцип движения, не точную технику. Читай подсказки ниже.</small></div>`;}
function render(key){
 const asset=assetFor(key);if(!asset)return graphicFor(key);
 const name=window.FORMA_EXERCISES?.[key]?.name||'Упражнение',gif=asset.type==='gif',paused=gif&&asset.poster&&isPaused(key);
 const dimensions=asset.width>0&&asset.height>0?` width="${Number(asset.width)}" height="${Number(asset.height)}"`:'';
 const visual=gif?`<img data-exercise-media src="${escape(paused?asset.poster:asset.src)}" alt="Демонстрация: ${escape(name)}"${dimensions} decoding="async">`:`<video data-exercise-media controls muted loop playsinline preload="metadata" src="${escape(asset.src)}"${asset.poster?` poster="${escape(asset.poster)}"`:''}${dimensions} aria-label="Демонстрация: ${escape(name)}"></video>`;
 const credit=asset.credit&&safeUrl(asset.creditUrl)?`<a class="media-credit" href="${escape(asset.creditUrl)}" target="_blank" rel="noopener noreferrer">${escape(asset.credit)} ↗</a>`:'';
 return `<div class="exercise-media-card" data-exercise-media-card="${escape(key)}"><div class="media-heading"><span>ДЕМОНСТРАЦИЯ УПРАЖНЕНИЯ</span><span class="media-format">${gif?'GIF':'ВИДЕО'}</span></div><div class="exercise-media-stage" data-media-content>${visual}</div>${gif&&asset.poster?`<div class="media-controls" data-media-controls><button type="button" class="small-outline" data-toggle-gif aria-pressed="${!paused}">${paused?'Воспроизвести GIF':'Остановить GIF'}</button><span data-media-status aria-live="polite">${paused?'Первый кадр':'Повторяется по кругу'}</span></div>`:''}${asset.note?`<p class="media-note">${escape(asset.note)}</p>`:''}<div class="media-caption"><small>Смотри движение, затем выполняй в своём темпе.</small>${credit}</div><p class="media-error" data-media-error hidden role="status">Демонстрация не загрузилась. Можно пользоваться схемой и подсказками ниже.</p><div data-media-fallback hidden>${graphicFor(key)}</div></div>`;
}
function mount(root=document){
 root.querySelectorAll('[data-exercise-media-card]').forEach(card=>{
  const key=card.dataset.exerciseMediaCard,asset=assetFor(key),media=card.querySelector('[data-exercise-media]');
  if(!asset||!media||card.dataset.mediaMounted)return;card.dataset.mediaMounted='1';
  const content=card.querySelector('[data-media-content]'),controls=card.querySelector('[data-media-controls]'),error=card.querySelector('[data-media-error]'),fallback=card.querySelector('[data-media-fallback]');
  const fail=()=>{media.pause?.();content.hidden=true;if(controls)controls.hidden=true;error.hidden=false;fallback.hidden=false;};
  media.addEventListener('error',fail,{once:true});
  if((media.tagName==='IMG'&&media.complete&&media.naturalWidth===0)||media.error)fail();
  const toggle=card.querySelector('[data-toggle-gif]');
  toggle?.addEventListener('click',()=>{
   const paused=!isPaused(key);pausedGIFs.set(key,paused);media.src=paused?asset.poster:asset.src;
   toggle.textContent=paused?'Воспроизвести GIF':'Остановить GIF';toggle.setAttribute('aria-pressed',String(!paused));
   card.querySelector('[data-media-status]').textContent=paused?'Первый кадр':'Повторяется по кругу';
  });
 });
}
function stop(root=document){root.querySelectorAll('video[data-exercise-media]').forEach(video=>video.pause());}
window.FORMA_VISUALS={category,render,mount,stop};
})();
