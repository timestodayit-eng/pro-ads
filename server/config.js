const env = process.env;
export const config = {
 production: env.NODE_ENV === 'production', origin: (env.APP_ORIGIN || '').replace(/\/$/, ''),
 db: { host:env.DB_HOST, port:Number(env.DB_PORT || 3306), database:env.DB_NAME,user:env.DB_USER,password:env.DB_PASSWORD,
  ...(env.DB_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{}), connectionLimit:5,connectTimeout:8000,charset:'utf8mb4',timezone:'Z',dateStrings:true,decimalNumbers:true,multipleStatements:false },
 sessionSecret:env.SESSION_SECRET || '', setupSecret:env.FIRST_ADMIN_SETUP_SECRET || '', tokenKey:env.TOKEN_ENCRYPTION_KEY || '',
 meta:{ appId:env.META_APP_ID || '',appSecret:env.META_APP_SECRET || '',configId:env.META_CONFIG_ID || '', version:env.META_API_VERSION || '',redirect:env.META_REDIRECT_URI || '' },
 ai:{key:env.OPENAI_API_KEY || '',model:env.OPENAI_MODEL || 'gpt-5-mini',dailyMax:Math.min(100,Math.max(1,Number(env.AI_DAILY_MAX_REPORTS)||4)),maxTokens:Math.min(8000,Math.max(1000,Number(env.AI_MAX_OUTPUT_TOKENS)||4000)),language:env.AI_REPORT_LANGUAGE==='en'?'en':'bn'},
 monitor:env.MONITOR_ENABLED==='true',reportIntervalHours:Math.max(6,Number(env.AI_REPORT_INTERVAL_HOURS)||24),jobSecret:env.JOB_RUNNER_SECRET || '',
};
export function strongSecret(s){return typeof s==='string' && s.length>=32 && !/REPLACE|YOUR_|CHANGE_ME/i.test(s);}
export function configuration() {
 let originOK=false;try{const u=new URL(config.origin);originOK=u.origin===config.origin&&(config.production?u.protocol==='https:':['http:','https:'].includes(u.protocol));}catch{}
 return {origin:originOK,database:!!(config.db.host&&config.db.database&&config.db.user&&config.db.password),session:strongSecret(config.sessionSecret),setup:strongSecret(config.setupSecret),encryption:/^[a-fA-F0-9]{64}$/.test(config.tokenKey),meta:!!(config.meta.appId&&config.meta.appSecret&&config.meta.configId&&/^v\d+\.\d+$/.test(config.meta.version)&&config.meta.redirect===config.origin+'/api/meta/callback'),openai:!!config.ai.key,scheduler:config.monitor&&strongSecret(config.jobSecret)};
}
