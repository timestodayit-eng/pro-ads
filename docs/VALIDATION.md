# Validation record - source release 0.1.0

## Actually executed in the authoring environment

- **42 Node unit tests passed, 0 failures.** Includes budget arithmetic, 12-account/60-ad-set planning, copy sharing, overrides, currency separation, reporting denominators, evidence checks, response parsing, password hashing, token encryption/tamper checks, CSRF derivation and basic input handling.
- **Server/shared/script/test JavaScript syntax checks passed.**
- **JSX syntax transpilation passed** using the locally installed TypeScript compiler.
- **9 offline browser UI checks passed; 0 page errors.** Desktop login and dashboard, AI reports with disabled unconfigured key, multiple creative copy fields, copy-previous action, empty-account draft validation, settings/team view, mobile report layout and mobile login layout.
- Browser checks used in-memory fixtures and the React 19.1.1 bundle already present with the test tools. The application's declared dependency is React ^19.2.0. This is an interface smoke test, NOT a production Vite/package build or live API test. Screenshots show an empty fixture workspace, not real Coastal account data.

## Not executed / not verified

- **npm dependency installation and full Vite build:** npm registry DNS/network access failed in this environment (`EAI_AGAIN`). No claim of a successful production build is made.
- **npm audit:** not run successfully because dependency installation/registry access was unavailable. No claim of zero vulnerabilities is made.
- **14 MySQL/HTTP integration tests:** included but skipped locally; no MySQL server/dependencies were available. The GitHub workflow provisions MySQL 8 and runs them after installation and build. Tests cover setup/login/sessions, CSRF/origin rejection, non-HTML API 404s, disabled publishing, mocked Meta OAuth/discovery/mapping, draft persistence and password/session revocation.
- **Real Meta OAuth, permissions and ad-account sync:** not executed; no user app credentials or authorized token were used.
- **Real OpenAI report generation/billing:** not executed; no user API key was provided or charged.
- **Hostinger deployment, external scheduler, credentials, database networking and restart behavior:** not verified on your account.
- **Large video upload, rolling hourly metrics, billing balances and live ad publishing:** not implemented in this release.

## Required acceptance sequence

1. Upload to the new private repository and get a successful `Build and verify` workflow result, including npm audit and MySQL tests.
2. Deploy without Meta/OpenAI credentials. Verify /api/health, /api/ready, initial setup, login/logout and password change.
3. Add Meta configuration and authorize one account. Verify real discovery and metric dates/numbers against Ads Manager.
4. Add OpenAI credentials with spend controls. Generate one report, inspect its evidence and compare with the saved snapshot.
5. Only then enable a single scheduler and observe successful sync/report jobs and recovery from failure.

Passing the pure unit tests does not guarantee production security, Meta approval, live integration correctness or Hostinger compatibility. Preserve these limits when sharing the source with another developer.
