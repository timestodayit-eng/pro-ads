// Run with Node --env-file=... from Hostinger Advanced > Cron Jobs.
// Finite job runner; do not run an endless worker or server-side setInterval.
const {config}=await import('../server/config.js');
const {runOne}=await import('../server/jobs.js');
const {closeDB}=await import('../server/db.js');
try{
 if(!config.monitor){console.log('MONITOR_ENABLED is false; nothing scheduled.');}
 else{for(let i=0;i<4;i++){const result=await runOne();console.log(JSON.stringify(result));if(!result.processed)break;}}
}catch(e){console.error(JSON.stringify({event:'cron_failed',code:e.code||'CRON_FAILED'}));process.exitCode=1;}
finally{await closeDB();}
