function fail(message){throw Object.assign(new Error(message),{status:400,code:'INVALID_DRAFT'});}
export function buildPlan(draft){
 if(!draft||typeof draft!=='object')fail('Missing draft.');
 const name=String(draft.name||'').trim();if(!name||name.length>150)fail('Campaign name must be 1-150 characters.');
 const contents=draft.contents,targets=draft.targets;
 if(!Array.isArray(contents)||contents.length<1||contents.length>20)fail('Add 1-20 creative items.');
 if(!Array.isArray(targets)||targets.length<1||targets.length>12)fail('Choose 1-12 accounts.');
 if(!['USD','BDT'].includes(draft.currency))fail('This draft builder supports USD or BDT only.');
 const cents=v=>{const n=Number(v);if(!Number.isFinite(n)||Math.abs(n*100-Math.round(n*100))>1e-6)fail('Budgets must have at most two decimal places.');return Math.round(n*100);};
 const base=cents(draft.baseBudget),increment=cents(draft.increment);
 if(base<=0||base>10000000||Math.abs(increment)>10000000)fail('Budget is outside the supported range.');
 const seen=new Set();for(const t of targets){if(!/^act_[0-9]+$/.test(t.accountId||'')||seen.has(t.accountId))fail('Select unique, connected Meta accounts.');seen.add(t.accountId);}
 const creatives=contents.map((c,i)=>{
  if(!String(c.caption||'').trim()||String(c.caption).length>5000)fail(`Creative ${i+1}: add a caption (maximum 5000 characters).`);
  if(!String(c.headline||'').trim()||String(c.headline).length>255)fail(`Creative ${i+1}: add a headline (maximum 255 characters).`);
  if(c.mediaUrl){try{const u=new URL(c.mediaUrl);if(u.protocol!=='https:')fail('Media references must use HTTPS.');}catch{fail('Use a valid HTTPS media reference.');}}
  return {id:String(c.id||`creative-${i+1}`).slice(0,80),title:String(c.title||`Content ${i+1}`).slice(0,150),mediaUrl:String(c.mediaUrl||'').slice(0,2000),caption:c.caption,headline:c.headline,description:String(c.description||'').slice(0,1000),cta:['CALL_NOW','LEARN_MORE','SEND_MESSAGE'].includes(c.cta)?c.cta:'LEARN_MORE'};
 });
 const allocations=targets.map((t,i)=>{
  const amount=t.budgetOverride!==null&&t.budgetOverride!==undefined&&t.budgetOverride!==''?cents(t.budgetOverride):base+increment*i;
  if(amount<=0||amount>10000000)fail(`Account ${i+1}: daily ad-set budget must be positive and within limits.`);
  const ageMin=Number(t.ageMin??18),ageMax=Number(t.ageMax??65);
  if(!Number.isInteger(ageMin)||!Number.isInteger(ageMax)||ageMin<18||ageMax>65||ageMin>ageMax)fail('Audience age range must be 18-65 (65 represents 65+).');
  for(const k of ['startAt','endAt'])if(t[k]&&!Number.isFinite(Date.parse(t[k])))fail('Invalid schedule date.');
  if(t.startAt&&t.endAt&&Date.parse(t.endAt)<=Date.parse(t.startAt))fail('End time must be after start time.');
  if(t.phone&&!/^\+?[0-9 ()-]{6,25}$/.test(t.phone))fail('Invalid phone destination.');
  return {accountId:t.accountId,label:String(t.label||t.accountId).slice(0,100),order:i+1,perAdsetMinor:amount,totalDailyMinor:amount*creatives.length,ageMin,ageMax,phone:String(t.phone||''),location:String(t.location||'Bangladesh').slice(0,150),startAt:t.startAt||null,endAt:t.endAt||null,budgetOverride:t.budgetOverride??null};
 });
 return {name,currency:draft.currency,category:draft.category==='employment'?'employment':'none',budgetMode:'AD_SET',contents:creatives,allocations,totals:{campaigns:targets.length,adsets:targets.length*creatives.length,ads:targets.length*creatives.length,dailyMinor:allocations.reduce((s,x)=>s+x.totalDailyMinor,0)},warnings:['Draft only: this release does not publish or modify ads.','Meta category, destination, targeting and minimum budget validation is required before publishing.','Daily budgets are planning values, not guaranteed exact daily charges.']};
}
