/** Create a consistent SQLite snapshot and copy user photos within DATA_DIR. */
import {DatabaseSync} from 'node:sqlite';
import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const data=resolve(process.env.DATA_DIR||join(root,'..','data'));
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const destination=join(data,'backups',stamp);
await mkdir(destination,{recursive:true});
const source=new DatabaseSync(join(data,'forma.sqlite'));
try{source.prepare('VACUUM INTO ?').run(join(destination,'forma.sqlite'));}finally{source.close();}
try{await cp(join(data,'private-photos'),join(destination,'private-photos'),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
await writeFile(join(destination,'README.txt'),'FORMA backup: SQLite snapshot + progress photos. This folder contains private health-related data.\n');
console.log('Резервная копия создана:',destination);
