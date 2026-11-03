# API surface and reference sources

## Local API

GET /api/health - liveness, does not prove database connectivity
GET /api/ready - schema/basic configuration/readiness
GET /api/bootstrap - first-admin/setup readiness (no secret values)
POST /api/auth/setup - first admin only, setup secret and origin required
POST /api/auth/login
GET /api/auth/me
POST /api/auth/logout
POST /api/auth/password
GET/POST /api/users - super admin only
POST /api/meta/connect - begins official authorization
GET /api/meta/callback - session-bound state validation and token exchange
GET /api/meta/connections
POST /api/meta/discover
GET /api/meta/accounts
POST /api/meta/mapping
DELETE /api/meta/connections/:id - local disconnect only
POST /api/accounts/:accountId/sync - enqueue read-sync
GET /api/overview?days=7
GET/POST /api/drafts
POST /api/publish - deliberately returns 501
GET/POST /api/reports
GET /api/reports/:id
POST /api/jobs/process - authenticated operator processes one queued job
POST /api/jobs/tick - secret Authorization header; scheduler endpoint
GET /api/settings - safe booleans, not credentials
GET /api/audit - super admin only

Authenticated state-changing browser requests need both the expected Origin and X-CSRF-Token. The scheduler uses an Authorization bearer secret and does not put secrets in query strings.

## Official references consulted for this release

- OpenAI Responses API: https://developers.openai.com/api/reference/resources/responses/methods/create
- OpenAI structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses
- OpenAI API key security: https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
- OpenAI model documentation: https://developers.openai.com/api/docs/models/gpt-5-mini
- Separate API billing: https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
- Hostinger Node.js deployment: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- Hostinger process/request/worker limitations: https://www.hostinger.com/support/hostinger-node-js-limits-for-web-and-cloud-plans/
- Hostinger Node.js cron: https://www.hostinger.com/support/how-to-run-cron-jobs-for-node-js-websites-at-hostinger/
- GitHub scheduled workflow caveats: https://docs.github.com/en/actions/how-tos/troubleshoot-workflows

## Meta references to validate against your actual app

https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/
https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/
https://developers.facebook.com/docs/marketing-api/insights/

Meta documentation requests returned HTTP 429 in the authoring environment. Do not treat this archive as live verification of your app's current configuration UI, permission grants or supported API version. The code exposes those requirements explicitly instead of supplying a guessed account/token.
