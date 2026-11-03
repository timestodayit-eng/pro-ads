import {existsSync,readFileSync} from 'node:fs';
if(existsSync('.env'))process.loadEnvFile('.env');
const {db,closeDB}=await import('../server/db.js');
try {
 for(const statement of readFileSync(new URL('../sql/001-initial.sql',import.meta.url),'utf8').split(';').map(x=>x.trim()).filter(Boolean))await db().query(statement);
 console.log('Initial schema created. Open /setup.');
}finally{await closeDB();}
