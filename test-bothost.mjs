import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url), read=x=>readFile(new URL(x,root),'utf8');
let html=await read('public/index.html');
html=html.replace(/\s*<script src="https:\/\/telegram\.org\/js\/telegram-web-app\.js\?64"><\/script>/,'');
for(const file of ['styles.css','v2.css','dark-theme.css']){let css=await read('public/'+file);html=html.replace(`<link rel="stylesheet" href="/${file}">`,`<style>\n${css}\n</style>`);}
for(const file of ['exercises.js','meal-plan.js','videos.js','exercise-visuals.js','app.js','v2.js']){let js=await read('public/'+file);html=html.replace(`<script src="/${file}"></script>`,`<script>\n${js.replaceAll('</script>','<\\/script>')}\n</script>`);}
await writeFile(new URL('FORMA_preview.html',root),html);
console.log('Built FORMA_preview.html ('+Math.round(html.length/1024)+' KiB)');
