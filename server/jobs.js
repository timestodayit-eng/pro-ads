import {randomUUID} from 'node:crypto';
import {query,transaction,parseJSON} from './db.js';
import {config} from './config.js';
import {syncAccount} from './metrics.js';
import {generateReport} from './ai.js';
export async function enqueue(kind,payload,key){
 const id=randomUUID();await query('INSERT IGNORE INTO jobs (id,kind,dedupe_key,payload_json) VALUES (?,?,?,?)',[id,kind,key,JSON.stringify(payload)]);
 const [job]=await query('SELECT id,status FROM jobs WHERE dedupe_key=?',[key]);return job;
}
async function scheduleDue(){
 if(!config.monitor)return;
 const bucket=Math.floor(Date.now()/(15*60*1000));
 const accounts=await query('SELECT account_id FROM ad_accounts WHERE slot IS NOT NULL AND (last_sync IS NULL OR last_sync<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 15 MINUTE))');
 for(const a of accounts)await enqueue('sync_account',{accountId:a.account_id},`sync:${a.account_id}:${bucket}`);
 const [recent]=await query('SELECT created_at FROM ai_reports ORDER BY created_at DESC LIMIT 1');
 const due=!recent||Date.now()-Date.parse(String(recent.created_at).replace(' ','T')+'Z')>config.reportIntervalHours*3600000;
 if(config.ai.key&&due)await enqueue('ai_report',{days:7,userId:null},`report:auto:${Math.floor(Date.now()/(config.reportIntervalHours*3600000))}`);
}
export async function runOne(){
 await scheduleDue();
 // A killed report request could have incurred a charge. Never retry it automatically.
 await query("UPDATE jobs SET status='failed',error_code='UNKNOWN_AI_OUTCOME',finished_at=UTC_TIMESTAMP() WHERE status='running' AND kind='ai_report' AND lease_until<UTC_TIMESTAMP()");
 await query("UPDATE ai_reports SET status='failed',error_code='INTERRUPTED' WHERE status='running' AND created_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 10 MINUTE)");
 await query("UPDATE jobs SET status=IF(attempts<3,'queued','failed'),error_code='LEASE_EXPIRED' WHERE status='running' AND kind='sync_account' AND lease_until<UTC_TIMESTAMP()");
 const job=await transaction(async c=>{
  const [[item]]=await c.execute("SELECT * FROM jobs WHERE status='queued' AND run_after<=UTC_TIMESTAMP() ORDER BY created_at,id LIMIT 1 FOR UPDATE");
  if(!item)return null;
  await c.execute("UPDATE jobs SET status='running',attempts=attempts+1,lease_until=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 100 SECOND) WHERE id=?",[item.id]);
  return item;
 });
 if(!job)return {processed:false};
 const payload=parseJSON(job.payload_json,{});
 try{
  const result=job.kind==='sync_account'?await syncAccount(payload.accountId):await generateReport(payload.userId||null,Number(payload.days)||7);
  await query("UPDATE jobs SET status='completed',finished_at=UTC_TIMESTAMP(),lease_until=NULL,error_code=NULL WHERE id=?",[job.id]);
  return {processed:true,jobId:job.id,kind:job.kind,status:'completed',reportId:result.id||null};
 }catch(e){
  const retry=job.kind==='sync_account'&&job.attempts<2;
  await query("UPDATE jobs SET status=?,error_code=?,run_after=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 2 MINUTE),lease_until=NULL,finished_at=IF(?='failed',UTC_TIMESTAMP(),NULL) WHERE id=?",[retry?'queued':'failed',String(e.code||'JOB_FAILED').slice(0,100),retry?'queued':'failed',job.id]);
  if(job.kind==='sync_account')await query('UPDATE ad_accounts SET last_error=? WHERE account_id=?',[String(e.code||'SYNC_FAILED').slice(0,100),payload.accountId]);
  return {processed:true,jobId:job.id,kind:job.kind,status:retry?'retry_scheduled':'failed',code:e.code||'JOB_FAILED'};
 }
}
