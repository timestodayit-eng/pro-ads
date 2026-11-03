# Coastal Manpower Ads Command Center

**Release 0.1.0 - foundation + read-only AI report implementation.**

A new, single-brand repository for Coastal Manpower Export Ltd. (RL-2380). This is not the old `bottol` application. Start with a new MySQL database. Do not overwrite an existing production app or import its `staff` table into this schema.

Read **START-HERE.md** before deployment. Read **docs/VALIDATION.md** for what was and was not tested. This source release is not a claim of a completed, live-tested ads publishing product.

## Included code

- React UI: login, first-admin setup, overview, Meta accounts, campaign drafts, AI reports, team settings and audit history. Responsive desktop/mobile layouts. No invented live statistics.
- Express API and same-origin React static serving. Single fixed entry point: `server.js`.
- MySQL schema: users, opaque sessions, roles, OAuth states, encrypted tokens, account mapping, daily insights, drafts, durable jobs, AI reports and audit events.
- Password hashing using Node's built-in scrypt; no native password-hashing binary dependency. First admin via `/setup`, no terminal required. Password changes revoke earlier sessions.
- Official Meta OAuth code: session-bound one-use state, server-side code exchange, encrypted token storage, account discovery, up to 12 mapped accounts and read-only daily insights sync. Requires your actual Meta app configuration and live tests.
- Campaign drafts: shared video/media references and per-content caption, headline, description and CTA. Each content has a distinct ad-set intent. Per-account daily ad-set budget rules, manual overrides, age intentions, schedule and phone destinations. USD and BDT draft budgets supported. No live publishing endpoint is enabled.
- OpenAI Responses API integration with JSON Schema structured output, evidence-reference validation, stored input snapshots, token usage and a configurable daily attempt limit. Report language defaults to Bengali. The AI has no tools or permissions to change ads.
- Finite MySQL job processing via Hostinger cron or optional authenticated HTTPS scheduler. Jobs survive server restarts; running jobs have leases. AI requests with unknown completion are not automatically retried.
- GitHub build/tests/MySQL integration workflow, dependency audit gate and optional schedule workflow.

## Explicitly not included yet

1. Live campaign/ad-set/ad creation, media transfer to Meta, activation, pause/resume or budget writes.
2. 500 MB-1 GB multipart object-storage upload and resumable media processing.
3. Accurate rolling 12/24-hour hourly insights and account-type-specific billing balance interpretation.
4. Complete Meta app review, permissions approval, remote revocation webhooks, provider data-deletion endpoints, MFA or independent security review.
5. Full time-series anomaly detection, real call-quality/CRM attribution, profit/ROAS calculations or automatic optimization.

The current analyser uses completed calendar days in each account's timezone (1, 3 or 7 days). It must not be labeled as an exact rolling 24-hour report. It reports `clicks` (all-clicks) and only `action_type=lead`; it does not count calls or sum overlapping conversion actions. Currencies remain separate.

## Architecture

Browser -> same-origin Express API -> MySQL

- Browser opens official Meta authorization; tokens are exchanged only by the server.
- Meta -> daily metric snapshots -> deterministic aggregation -> OpenAI -> report JSON -> MySQL -> reports UI.
- AI receives identifiers and aggregate numbers, not applicant records, phone lists, passports, credentials or full 1 GB video files.
- Browser never receives the OpenAI key or Meta app secret.
- `mysql2` with explicit SQL replaces the earlier proposed Prisma layer for this initial release. This reduces build-generation/native-engine deployment moving parts and allows direct phpMyAdmin schema import.

## Deployment contract

| Setting | Value |
|---|---|
| Repository | New private `coastal-ads-command-center` |
| Framework | Express |
| Root | `./` |
| Entry file | `server.js` |
| Node | 22.x (at least 22.12) |
| Package manager | npm |
| Build command, when available | `npm run build` |
| Runtime start | `npm start` or direct `node server.js` |

`npm install` runs `postinstall`, which builds React before the server starts. Vite is deliberately in deployment dependencies so a production-only install still has the build tool. `server.js` NEVER compiles the frontend at startup. The GitHub workflow can also produce an artifact containing `dist` and its generated lockfile. Express serves the same origin; API 404s never fall through to HTML.

This source bundle does not include a resolved npm lockfile because npm registry access was unavailable in the build environment. The first successful GitHub workflow creates one. Preserve the lockfile from its built artifact; later CI runs use `npm ci` when it is present. Do not claim a dependency audit has passed before the workflow runs.

## Commands (for a developer/CI)

```
npm install
npm test
npm run check
npm run build
npm run db:migrate
npm start
```

Database integration tests need a fresh MySQL database and `RUN_DB_TESTS=true`. GitHub Actions provisions one automatically. They mock Meta and do not spend money or publish ads.

## Repository map

```
server.js                 Fixed Express entry point
client/src/               React UI + API client + CSS
server/auth.js            Setup, login, sessions, roles, CSRF
server/meta.js            OAuth, discovery and mapping
server/metrics.js         Meta daily insights and aggregation
server/ai.js              Server-only OpenAI report service
server/jobs.js            Durable jobs and finite execution
shared/                   Pure budget and reporting calculations
sql/001-initial.sql        phpMyAdmin-compatible new schema
scripts/cron.js            Finite Hostinger cron runner
scripts/package.py        Built-release archive creator
.github/workflows/        Build/test/audit and optional scheduler
.env.example              Names and placeholders only
```

API notes and official sources: `docs/API-AND-SOURCES.md`.
