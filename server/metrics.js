import {DateTime} from 'luxon';
import {query,transaction,parseJSON} from './db.js';
import {connectionToken,graph} from './meta.js';
import {aggregate} from '../shared/reporting.js';
import {httpError} from './security.js';
export async function syncAccount(accountId){
 const [a]=await query('SELECT * FROM ad_accounts WHERE account_id=? AND slot IS NOT NULL',[accountId]);if(!a)throw httpError(404,'Select the account in Account Mapping first.');
 const token=await connectionToken(a.connection_id);
 const now=DateTime.now().setZone(a.timezone_name);if(!now.isValid)throw httpError(422,'Invalid account reporting timezone.');
 const until=now.minus({days:1}).toISODate(),since=now.minus({days:7}).toISODate();
 const signal=AbortSignal.timeout(50000);let after;const rows=[];
 do{
  const response=await graph(`${a.account_id}/insights`,token,{fields:'account_id,ad_id,ad_name,campaign_id,adset_id,date_start,spend,impressions,clicks,actions',level:'ad',time_range:{since,until},time_increment:1,limit:100,...(after?{after}:{})},{signal});
  rows.push(...(response.data||[]));after=response.paging?.next?response.paging?.cursors?.after:null;
  if(rows.length>1500)throw httpError(422,'This account requires paginated/asynchronous large-report sync. Previous data was kept.','INSIGHTS_SIZE_LIMIT');
 }while(after);
 await transaction(async c=>{
  await c.execute('DELETE FROM insight_daily WHERE account_id=? AND day BETWEEN ? AND ?',[accountId,since,until]);
  for(const v of rows){
   if(!v.ad_id||!/^\d{4}-\d{2}-\d{2}$/.test(v.date_start||'')||v.date_start<since||v.date_start>until)continue;
   await c.execute(`INSERT INTO insight_daily (account_id,ad_id,day,campaign_id,adset_id,ad_name,spend,impressions,clicks,actions_json) VALUES (?,?,?,?,?,?,?,?,?,?)`,[accountId,String(v.ad_id),v.date_start,String(v.campaign_id||''),String(v.adset_id||''),String(v.ad_name||v.ad_id).slice(0,255),Number(v.spend)||0,Number(v.impressions)||0,Number(v.clicks)||0,JSON.stringify(v.actions||[])]);
  }
  await c.execute('UPDATE ad_accounts SET last_sync=UTC_TIMESTAMP(),last_error=NULL WHERE account_id=?',[accountId]);
 });
 return {accountId,rows:rows.length,since,until,timezone:a.timezone_name};
}
export async function snapshot(days=7){
 if(![1,3,7].includes(Number(days)))throw httpError(400,'Choose 1, 3 or 7 completed reporting days.');
 const accounts=await query('SELECT account_id,name,currency,timezone_name,slot,last_sync,last_error FROM ad_accounts WHERE slot IS NOT NULL ORDER BY slot');
 const windows=[],rows=[];const map={};
 for(const a of accounts){
  map[a.account_id]=a;const now=DateTime.now().setZone(a.timezone_name),until=now.minus({days:1}).toISODate(),since=now.minus({days:Number(days)}).toISODate();
  windows.push({account_ref:`account:${a.account_id}`,slot:a.slot,timezone:a.timezone_name,since,until,last_sync:a.last_sync?String(a.last_sync).replace(' ','T')+'Z':null,last_error:a.last_error});
  rows.push(...await query('SELECT account_id,ad_id,spend,impressions,clicks,actions_json FROM insight_daily WHERE account_id=? AND day BETWEEN ? AND ?',[a.account_id,since,until]));
 }
 const result=aggregate(rows,map);
 return {generated_at:new Date().toISOString(),period_days:Number(days),period_kind:'completed_account_local_calendar_days',windows,...result,limitations:['Not a live feed. Metrics reflect the last successful Meta sync.','Date ranges use each ad account reporting timezone; they are not an exact rolling 12/24-hour window.','Clicks are Meta all-clicks, not link clicks or completed phone calls.','Reported leads use only action_type=lead; zero reported leads does not prove there were no real leads.','Do not compare or add different currencies. No exchange rate conversion is applied.','Attribution and reporting delays can revise earlier dates.']};
}
export async function overview(days=7){
 const data=await snapshot(days);const [draft]=await query('SELECT COUNT(*) AS n FROM campaign_drafts');const [report]=await query("SELECT COUNT(*) AS n FROM ai_reports WHERE status='completed'");
 const jobs=await query('SELECT id,kind,status,error_code,created_at,finished_at FROM jobs ORDER BY created_at DESC LIMIT 20');
 return {snapshot:data,draftCount:Number(draft.n),reportCount:Number(report.n),jobs};
}
