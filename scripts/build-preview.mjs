import {readFile, writeFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {resolve, sep, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const escaped = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const publicRoot=fileURLToPath(new URL('public/',root));
const embedded=new Map();
async function embedMedia(src){
  if(!src)return src;
  if(embedded.has(src))return embedded.get(src);
  if(!src.startsWith('/media/'))throw Error('Preview requires local /media/ files: '+src);
  const pathname=decodeURIComponent(new URL(src,'https://forma.local').pathname);
  const full=resolve(publicRoot,'.'+pathname),mediaRoot=resolve(publicRoot,'media')+sep;
  if(!full.startsWith(mediaRoot))throw Error('Invalid media path');
  const mime={'.gif':'image/gif','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm'}[extname(full).toLowerCase()];
  if(!mime)throw Error('Unsupported preview media: '+pathname);
  const data='data:'+mime+';base64,'+(await readFile(full)).toString('base64');
  embedded.set(src,data);return data;
}
let html = await read('public/index.html');
// The portable preview uses browser-local data, without Telegram or remote fonts.
html = html.replace(/\s*<script src="https:\/\/telegram\.org\/js\/telegram-web-app\.js(?:\?[^"]*)?"><\/script>/, '');
for (const file of ['styles.css', 'v2.css', 'dark-theme.css']) {
  const css = (await read('public/' + file)).replace(/@import\s+url\([^)]*\)\s*;/g, '');
  const tag = new RegExp('<link rel="stylesheet" href="/' + escaped(file) + '(?:\\?[^\"]*)?">');
  if (!tag.test(html)) throw new Error('Missing stylesheet: ' + file);
  html = html.replace(tag, () => `<style>\n${css}\n</style>`);
}
for (const file of ['exercises.js', 'videos.js', 'exercise-visuals.js', 'app.js', 'v2.js']) {
  let js = await read('public/' + file);
  if(file==='videos.js'){
    const context={window:{}};runInNewContext(js,context,{timeout:1000});
    const media=context.window.FORMA_MEDIA_MAP||{},legacy=context.window.FORMA_VIDEO_MAP||{};
    for(const asset of Object.values(media)){
      asset.src=await embedMedia(asset.src);
      if(asset.poster)asset.poster=await embedMedia(asset.poster);
    }
    for(const key of Object.keys(legacy))legacy[key]=await embedMedia(legacy[key]);
    js='window.FORMA_MEDIA_MAP = '+JSON.stringify(media)+';\nwindow.FORMA_VIDEO_MAP = '+JSON.stringify(legacy)+';';
  }
  const tag = new RegExp('<script src="/' + escaped(file) + '(?:\\?[^\"]*)?"></script>');
  if (!tag.test(html)) throw new Error('Missing script: ' + file);
  html = html.replace(tag, () => `<script>\n${js.replaceAll('</script>', '<\\/script>')}\n</script>`);
}
await writeFile(new URL('FORMA_preview.html', root), html);
console.log('Built portable FORMA_preview.html with '+embedded.size+' embedded media files.');
