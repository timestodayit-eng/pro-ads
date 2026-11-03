# AI Analyser & Reports - implementation contract

## Implemented pipeline

1. Read completed daily Meta insights for mapped accounts (1, 3 or 7 completed local reporting days).
2. Aggregate spend, impressions, all-clicks and exactly the `lead` action type in server code. Calculate CTR, CPC, CPM and cost per reported lead; zero denominators yield null, not a fake zero efficiency.
3. Separate every currency and retain per-account window and sync timestamp.
4. Store the input snapshot, call OpenAI Responses with strict JSON Schema and `store:false`, reject incomplete/refused output and unknown evidence references, then store output and token usage.
5. Render report findings, severity, limitations, human next steps and linked numerical evidence. JSON export and browser printing are available.

The model does not directly retrieve accounts, run SQL, access credentials, pause ads or change budgets. Model names are configurable; changing one may require updating compatibility parameters and testing structured output.

## Current limitations

The initial analyser is not a time-series change detector. Without objectives, attribution settings, CRM quality, actual calls and a sufficiently large sample, it must not claim conversion quality, profit, statistically proven winners or causation. It may suggest hypotheses for review. Evidence-reference checks constrain citations, but do not prove every generated sentence is correct.

No exact rolling 12/24-hour AI comparison is implemented. These windows need independently tested hourly coverage and timezone handling, rather than subtracting two mutable cumulative counters or labeling yesterday as "last 24 hours".

No 1 GB videos are uploaded to OpenAI. Future creative analysis should be a separate opt-in feature using selected frames/transcripts, redaction and explicit cost/retention controls.

## Monitoring

On-demand reports work through the jobs queue. Automatic execution requires a configured Hostinger cron or authenticated external scheduler. Default automatic mode is OFF. Target sync cadence is every 15 minutes with a default AI report interval of 24 hours; actual freshness depends on queue length, provider delays and scheduler success. Monitoring produces in-app reports only in this release.

AI report attempt cap defaults to four per UTC day. Each attempt, even a failed one, counts. Output budget defaults to 4,000 tokens. Daily request limits bound attempts, not exact monetary cost. The server records successful token usage; use provider billing tools for actual charges.

## Next verified milestones

- M1 gate: successful repository build, MySQL-backed setup/login, correct API routing and restart persistence. Current source package targets this gate first.
- M2 gate: live Coastal Meta OAuth, permission denial/reconnect tests, 12-account mapping, hourly reporting and correctly typed billing fields.
- M3 gate: direct private object-storage multipart video upload up to 1 GB, retries, metadata checks, resumability and storage lifecycle.
- M4 gate: one approved account -> paused campaign/ad-set/ad; then multi-account idempotent publishing with per-content ad sets and manual review before activation. Category/targeting validation required.
- M5 gate: tested scheduled reports, configurable baselines and alerts, report retention, data deletion, operator audit and production security review.

OAuth and daily read-sync implementations are included now to support the analyser, but passing M1 does not imply M2's live permissions and provider behavior have passed.
