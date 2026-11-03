# Start here - GitHub to Hostinger, without a local terminal

## 1. Create the new repository

Create a **private** GitHub repository named `coastal-ads-command-center`.
Extract this ZIP on your computer. Upload the files INSIDE the extracted folder, not the ZIP and not an extra parent folder. `package.json` and `server.js` must appear at the repository root.

Include `.github`, `.env.example` and `.gitignore`. On a Mac, Command+Shift+Period shows hidden files in Finder. Never upload a real `.env` or credentials.

Open GitHub **Actions -> Build and verify**. Let the installation, unit tests, frontend build, MySQL tests and dependency audit complete. The workflow is provided but has not been run on your account. Resolve any failing gate before connecting production credentials. It also publishes a `coastal-tested-build` artifact with compiled frontend files and a generated `package-lock.json`.

The source bundle itself has no installed dependencies, no compiled `dist` and no verified npm audit. Do not confuse the offline component tests with this full build.

## 2. Create a NEW MySQL database

In Hostinger, create a database and a dedicated database user. Open phpMyAdmin, select the NEW database, then import:

`sql/001-initial.sql`

This schema uses `users`, not the older application's `staff` table. Do not import the earlier first-admin SQL/password files. There is no default admin password in this project.

Use the actual database host shown by your hosting configuration. `127.0.0.1` is correct only if the app runtime really reaches MySQL there. Confirm remote access/firewall requirements with Hostinger where applicable; do not expose MySQL to all IPs as a shortcut.

## 3. Generate secrets locally

Open `tools/secret-generator.html` on your computer. Click its button and copy the four generated values into Hostinger, not GitHub. The page makes no network requests and stores nothing. Use different values for each key.

## 4. Set the initial environment variables

```
NODE_ENV=production
APP_ORIGIN=https://YOUR-NEW-APP-DOMAIN
DB_HOST=YOUR_REAL_DB_HOST
DB_PORT=3306
DB_NAME=YOUR_NEW_DATABASE
DB_USER=YOUR_DATABASE_USER
DB_PASSWORD=YOUR_NEW_DATABASE_PASSWORD
DB_SSL=false
SESSION_SECRET=LOCAL_GENERATOR_VALUE
FIRST_ADMIN_SETUP_SECRET=DIFFERENT_LOCAL_GENERATOR_VALUE
TOKEN_ENCRYPTION_KEY=LOCAL_GENERATOR_64_HEX_VALUE
MONITOR_ENABLED=false
```

`APP_ORIGIN` must be the exact HTTPS origin: no path or trailing slash. Set `DB_SSL=true` if your MySQL endpoint requires a trusted TLS connection. Do not turn off certificate verification to make a failed connection pass. Hostinger normally supplies `PORT`; do not override it.

The new project uses `SESSION_SECRET`, not `JWT_SECRET` or `ADMIN_SESSION_SECRET`. Database keys are `DB_*`, not `MYSQL_*`.

## 5. Deploy the Express app

Hostinger -> add a new Node.js web app -> connect GitHub -> choose the NEW repository and `main`.

- Framework: **Express**
- Root: **`./`**
- Entry: **`server.js`**
- Node: **22.x**
- Package manager: **npm**
- Build command, if shown: **`npm run build`**

The install lifecycle includes a frontend build even when the Express form does not offer a separate build command. Check the log for `Production frontend verified: dist/index.html`. Do not change the entry file to a path inside `dist`, and do not deploy only the static React output.

Do not assume Hostinger waits for GitHub Actions. Keep auto-deployment off while validating changes, or deploy a protected release branch after its checks pass.

After deployment, visit:

- `/api/health`: server liveness, frontend-file availability.
- `/api/ready`: database/schema and basic configuration readiness.
- `/setup`: create your first administrator with your email, a new 14+ character password, and the setup secret.

After successful setup, remove `FIRST_ADMIN_SETUP_SECRET` from Hostinger and redeploy. Setup is also blocked once a user exists.

**Gate 1:** login, logout, change password, readiness endpoint and MySQL persistence must work before Meta credentials are added.

## 6. Configure Meta OAuth

Use your Coastal Business app and a compatible Facebook Login for Business configuration. Configure the redirect URI to exactly:

`https://YOUR-NEW-APP-DOMAIN/api/meta/callback`

Set in Hostinger:

```
META_APP_ID=YOUR_APP_ID
META_APP_SECRET=YOUR_APP_SECRET
META_CONFIG_ID=YOUR_BUSINESS_LOGIN_CONFIGURATION_ID
META_API_VERSION=VERSION_SUPPORTED_BY_YOUR_META_APP
META_REDIRECT_URI=https://YOUR-NEW-APP-DOMAIN/api/meta/callback
```

Replace the version placeholder with a real `vNN.0` value from your app configuration. The app rejects an empty/invalid version instead of assuming one. Request only the permissions needed for your intended operation; this release reads ads and does not write campaigns. Your account needs access to the ad assets and the app needs appropriate permission access. The published-app flag is not sufficient proof. No separate manually copied `META_ACCESS_TOKEN` is used.

Redeploy -> sign in -> **Meta accounts -> Connect Facebook** -> grant access -> **Discover accounts** -> select up to 12 -> **Save mapping** -> **Sync insights**.

**Gate 2:** test the real authorization round trip, denied consent, token expiry, one account's data, and account visibility before adding all 12. This source has not been tested against your Meta app.

## 7. Enable AI reports

Only after real metrics have been synced, add:

```
OPENAI_API_KEY=YOUR_SERVER_SIDE_OPENAI_KEY
OPENAI_MODEL=gpt-5-mini
AI_DAILY_MAX_REPORTS=4
AI_MAX_OUTPUT_TOKENS=4000
AI_REPORT_LANGUAGE=bn
```

Use a model available to your OpenAI project that supports the Responses API and structured output. The model is configurable; a current paid API project/model allowance is required. ChatGPT and API billing are separate systems.

Redeploy -> **AI analyser & reports -> Generate AI report**. The action queues the report and processes one job. If earlier sync jobs are ahead of it, use **Process next job** or the scheduler. No report is generated for an empty dataset.

**Gate 3:** verify a real saved report, its evidence references, reporting dates, token usage, language, and behavior when the API key or billing is unavailable. AI output is advice, not a guaranteed diagnosis.

## 8. Start automatic monitoring (only after manual tests pass)

Set `MONITOR_ENABLED=true` and a unique `JOB_RUNNER_SECRET` in Hostinger.

Preferred: Hostinger **Advanced -> Cron Jobs**. The supplied `scripts/cron.js` handles at most four short jobs then exits. Use your actual Hostinger user/domain paths and the environment file path; the official guide is linked in `docs/API-AND-SOURCES.md`.

Example shape, NOT a ready-to-paste command with your real paths:

```
/opt/alt/alt-nodejs22/root/bin/node --env-file=/home/USERNAME/domains/DOMAIN/hbuilds/config/.env /home/USERNAME/domains/DOMAIN/hbuilds/current/nodejs/scripts/cron.js
```

Choose every five minutes and inspect cron output. Confirm your current deployment's paths and the cron command length limit. Secrets stay in the environment file, not in URL query parameters.

Alternative: the optional GitHub `monitor.yml`. Set repository Variables `ENABLE_SCHEDULE=true`, `APP_BASE_URL=https://YOUR-APP-DOMAIN`; set repository Secret `JOB_RUNNER_SECRET` equal to Hostinger's value. Use only ONE scheduler initially. GitHub schedules can be delayed and may consume Actions minutes; they are not a hard real-time service.

The job scheduler queues syncs when cached metrics are old, and an AI report at the configured interval (default 24 hours). This is a rolling cadence, not a promised exact 8 AM delivery. Reports appear inside the app; email/WhatsApp alerts are not implemented. No browser must stay open once the scheduler is correctly running.

## Troubleshooting

| Symptom | Check |
|---|---|
| 503 everywhere | Runtime logs, Node 22, entry `server.js`, process limits, actual server start |
| API health works but frontend missing | Install/postinstall/build log and `dist/index.html` |
| API returns HTML | Wrong static-only deployment; use Express entry |
| Readiness has `database:false` | DB host, credentials, network access, imported schema |
| Setup says closed | A user already exists; use login, do not delete data |
| Meta not configured | All Meta fields plus encryption key, exact callback and config ID |
| AI no data | Map accounts, sync completed-day metrics, then generate |
| AI request failed | API key, project billing, model availability, rate limits |
| Jobs stay queued | Scheduler disabled/not configured or cron/HTTPS authorization failing |

Do not send passwords, setup secrets, access tokens or API keys in screenshots.
