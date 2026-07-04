# SINGLE_POINT_OF_FAILURE_AUDIT_V2

Status: DOCUMENTED
Date: 2026-06-30
Mode: Read-only audit, no code/config changes

## Objective

Find every remaining single point of failure across:

- People
- DNS
- Payments
- Stripe
- BTCPay
- Wallet
- Receipts
- Jobs
- Workers
- Backups
- Domains
- Email
- OAuth
- Certificates
- Storage
- Monitoring

Rank each as Critical, Major, or Minor.

## Executive Verdict

Overall SPOF posture: YELLOW.

Farpy has many good launch-hardening pieces now: fail-closed auth/payment routes, token-gated downloads/receipts, wallet ledger idempotency, NodeMuncher lease auth, ops summary, audit scripts, recovery USB, documented infra roles, and an encryption plan for offsite backups.

The remaining critical SPOFs are operational and recovery-oriented:

1. One primary production control plane on Node A.
2. Offsite encrypted backup implementation and restore proof are planned but not yet complete.
3. Founder/operator continuity still depends on documented access recovery being actually usable by another operator.
4. Domains/DNS/payment dashboards remain external-account SPOFs unless access recovery is proven.

## Critical SPOFs

| Area | SPOF | Evidence | Impact | Current Mitigation | Required Action |
| --- | --- | --- | --- | --- | --- |
| Production control plane | Node A is the single live production control plane | `CONTROL_PLANE_BOUNDARY_V1` freezes Node A as website/API/wallet/auth/jobs/uploads/receipts host | Node A outage can stop customer UI, auth, wallet, uploads, jobs, receipts, downloads | Node B defined as warm standby/restore-test host; recovery docs exist | Prove Node B restore and cutover from encrypted offsite backup; document DNS/Caddy/service cutover time |
| Backups | No proven encrypted offsite backup/restore yet | `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1` is PLAN_ONLY; prior docs note same-host backup/restore proof but offsite blocked | Full Node A loss could lose recent job/wallet/receipt/upload/output state | Recovery USB and same-host snapshots exist | Implement age-encrypted offsite backup push and Node B restore proof before broad launch |
| People | Founder/operator access concentration | `FOUNDER_ABSENCE_FIX_V1` improved posture but offsite/restore/access proofs remain partial | If founder unavailable, domains, payments, keys, restore, and incidents may stall | Recovery docs and role map exist | Verify second operator has registrar, hosting, Stripe, BTCPay, email, Storage Box, and age key access without secrets in docs |
| Domains/DNS | Domain registrar and DNS access are external-account SPOFs | Recovery docs list domain/DNS loss as not covered by backup plan | Farpy can be unreachable even if servers are healthy | TLS/Caddy active; role docs exist | Document registrar, DNS provider, login recovery, 2FA recovery, auto-renew, and secondary operator access |
| Wallet ledger | Wallet JSONL on Node A is authoritative | `scripts/job-api.mjs` wallet state under `/var/lib/farpy*`; append ledger is source of truth | Wallet balances/history at risk if Node A data lost or corrupted | Idempotent ledger writes, refund path, same-host backup | Offsite encrypted backups plus periodic ledger integrity/export proof |
| Receipts | Receipt JSON on Node A is authoritative | `scripts/job-api.mjs` receipt path and tokenized receipt endpoint | Customers lose delivery proof if receipt store lost | Tokenized receipts, SHA fields, recovery snapshot docs | Offsite encrypted backups; public-safe receipt index/manifest optional later |
| Jobs/uploads/outputs | Production job and artifact store on Node A | Upload/output/job paths under `/var/lib/farpy-web-render` | Active packages, downloads, and receipts fail on storage loss | Same-host backup snapshot; tokenized downloads | Offsite encrypted artifact backup; storage capacity/integrity monitoring |
| Payment dashboards | Stripe and BTCPay admin access are external-account SPOFs | Payment reports require dashboard/API access; BTCPay Node C is separate | Topups/refunds/webhook repair can stall | Fail-closed webhook handling; Lightning gated; card works | Prove secondary operator access to Stripe/BTCPay and webhook/API key recovery |

## Major SPOFs

| Area | SPOF | Evidence | Impact | Current Mitigation | Required Action |
| --- | --- | --- | --- | --- | --- |
| Stripe | Stripe is the only fully live broad public payment rail | Card/Stripe visible and fail-closed; PayPal deferred; Lightning gated; Bitcoin/BTCPay still needs continued proof | Stripe outage/account hold blocks normal topups | Wallet balance can cover existing funded users | Keep Bitcoin on-chain proof current; add documented manual incident flow for Stripe outage |
| BTCPay / Node C | BTCPay depends on Node C and its Lightning/on-chain config | `LIGHTNING_*` notes show Lightning hidden/gated; Node C payments role | Bitcoin rail can fail independently of Node A | Card default remains live; webhook fail-closed | Back up Node C config/wallet; prove BTCPay restore and on-chain invoice-to-credit path |
| OAuth | Google OAuth/session path depends on Google provider config | Google OAuth restore/fix notes; signin also has email magic-link | Google/provider misconfig blocks one-click sign-in | Email magic-link remains present | Keep email signin verified; document OAuth client recovery and callback URLs |
| Email | Email delivery/sign-in/support likely external provider dependent | Signin/support flows use email; provider not fully documented in current docs | Magic links/support can fail | Google OAuth alternative exists | Document email provider, DNS records, sender credentials recovery, bounce monitoring |
| Certificates/TLS | Caddy-managed TLS and cert renewal path | Founder absence docs found TLS valid; certbot path had issues; Caddy likely manages certs | Expired certs break public access | Caddy active and certs valid at audit time | Monitor cert expiry externally; document renewal source and test forced Caddy reload/renewal path |
| Monitoring | Monitoring exists but still depends on configured ops token and scripts/timers | Ops dashboard, production regression suite, funnel report, IONOS role | Failures may go unnoticed if monitor host/token/timer breaks | Ops summary and audits exist | Add second alert recipient and external monitor proof; monitor the monitors |
| Workers | Render availability depends on limited worker supply | NodeMuncher controlled alpha; PR-003 Octane lane; worker status endpoint | Jobs can queue/stall if no render partner online | Alerts for worker offline/stale; failure/refund behavior | Keep public stage limits; add standby Blender worker and run regular worker smoke |
| Storage capacity | Node A local disk/inodes can block uploads/renders | Ops alert requirements include disk/inode; data plane lives locally | Upload/render/download failures | Ops summary storage basics | Prove disk/inode alerts trigger and reach operator; add capacity runbook |
| Caddy/routing | Caddy config is central ingress | All public routes depend on Caddy; `/real` redirect, downloads slash fixes were Caddy/static-sensitive | Misconfig can break site/API | Caddy config backup/validation docs | Keep backup-before-change mandatory; test `caddy validate` in deploy runbook |
| Secrets/env files | Runtime secrets concentrated under `/etc/farpy` | Env hardening notes moved secrets to protected files | Loss/mispermission can break payments/auth/jobs | Permissions hardened; recovery USB includes configs metadata | Include encrypted `/etc/farpy` in offsite plan; avoid plaintext USB secret exposure unless sealed |

## Minor SPOFs

| Area | SPOF | Evidence | Impact | Current Mitigation | Required Action |
| --- | --- | --- | --- | --- | --- |
| Public proof page | Public proof depends on live API/sidecar fetches and has honest empty states | `PublicProofPage.tsx` displays `No public proof yet` for unavailable data | Trust page looks thin if APIs fail | Honest fallback; no fake numbers | Populate only receipt-derived public-safe proof later |
| Benchmark distribution | Windows-only Benchmark artifacts and public download sidecars | Benchmark release notes and download URLs | Non-Windows users cannot use Benchmark | Windows-only copy is honest | Keep Linux/macOS unadvertised until real artifacts exist |
| Add-on package | Single ZIP artifact/path | Add-on audit/deploy notes | Broken ZIP breaks Blender add-on onboarding | SHA sidecar and `/addon` instructions | Keep versioned archive history and hash manifest |
| NodeMuncher installer/signing | Controlled alpha installer/signing/update gaps | NodeMuncher audits list signing/update as deferred | Public worker trust blocker, not current customer blocker | NodeMuncher not broad public | Resolve before public worker launch |
| Rate limiting | Abuse controls not fully proven | Security audits mark rate-limit proof incomplete | Queue/upload/signin spam risk | Auth gates, upload limits, fail-closed routes | Add rate-limit proof before bigger traffic |
| Static export/deploy | Static `out` deploy can drift from source | Recent regression suite found stale `Render Lane` in production | Copy/CTA mismatch, stale trust language | Regression suite catches drift | Treat deploy verification as mandatory after frontend fixes |
| Logs | Logs are local and can rotate away | Funnel/ops docs use access logs | Incident reconstruction can be incomplete | Funnel reports and ops summaries | Define log retention and offsite sanitized log policy |

## Area-by-Area Classification

### People

Rank: Critical.

SPOF: founder/operator access concentration.

Farpy has documents, release notes, and recovery plans, but founder absence is only reduced to YELLOW when a second operator can actually access infrastructure, payments, domains, email, backups, and encryption keys.

### DNS / Domains

Rank: Critical.

SPOF: registrar/DNS account and renewal access.

Backups do not cover domain loss. DNS cutover is required for Node B standby to matter.

### Payments

Rank: Major.

SPOF: Stripe is the only broadly proven public payment rail. Bitcoin on-chain exists but must remain continuously proven. Lightning is intentionally gated. PayPal deferred.

### Stripe

Rank: Major.

SPOF: Stripe account/API/webhook access and account health.

Mitigations: signature validation, malformed JSON fail-closed, card default, wallet balance for already funded users.

### BTCPay

Rank: Major.

SPOF: Node C/BTCPay host and wallet configuration.

Mitigations: backend route hardening, public checkout URL fix, Lightning hidden/gated. Required: Node C backup and restore proof.

### Wallet

Rank: Critical.

SPOF: authoritative wallet ledger lives in production data plane.

Mitigations: append-only JSONL, idempotent event/session/invoice checks, refund path, backup plan. Required: encrypted offsite backup and restore proof.

### Receipts

Rank: Critical.

SPOF: receipt JSON store and token URLs live in data plane.

Mitigations: token-gated receipt endpoint, SHA fields, audit scripts. Required: offsite receipt restore proof.

### Jobs

Rank: Critical.

SPOF: job metadata controls package lifecycle and customer status.

Mitigations: job JSON, ops alerts, failure/refund paths. Required: standby restore/cutover proof.

### Workers

Rank: Major.

SPOF: limited render partner capacity and worker online state.

Mitigations: worker auth, lease APIs, alerts, NodeMuncher controlled alpha, stage-limit copy. Required: at least one standby Blender worker and routine render smoke.

### Backups

Rank: Critical.

SPOF: offsite encrypted backup is planned, not implemented/proven.

Mitigations: same-host backup, recovery USB, age encryption plan. Required: implement encrypted offsite push and restore proof.

### Email

Rank: Major.

SPOF: magic-link/support email delivery provider and DNS records.

Mitigations: Google OAuth alternative. Required: document provider, credentials recovery, SPF/DKIM/DMARC, test sending.

### OAuth

Rank: Major.

SPOF: Google OAuth client/config.

Mitigations: email magic-link remains. Required: OAuth config recovery and callback route smoke in audits.

### Certificates

Rank: Major.

SPOF: Caddy/TLS renewal and account/config.

Mitigations: Caddy active and certs valid in prior audits. Required: expiry monitor and renewal runbook.

### Storage

Rank: Critical.

SPOF: local production storage for uploads, outputs, jobs, wallet, receipts.

Mitigations: disk/inode alerts, backups. Required: offsite encrypted backup plus capacity thresholds and restore proof.

### Monitoring

Rank: Major.

SPOF: monitors can fail silently or only alert founder.

Mitigations: ops dashboard, regression suite, funnel reports, IONOS monitor role. Required: second alert recipient and monitor-heartbeat proof.

## Highest Priority Fix Order

1. Implement `WEB_RENDER_BACKUP_ENCRYPTION_IMPLEMENTATION_V1` and prove restore on Node B.
2. Prove second-operator access for domain/DNS, Stripe, BTCPay, email, hosting, Storage Box, and encrypted backup key custody.
3. Prove Node B standby restore/cutover runbook from encrypted offsite snapshot.
4. Back up Node C/BTCPay config/wallet state and document restore.
5. Add external monitor delivery to at least two humans.
6. Add routine paid/render/download/receipt smoke evidence to monitoring cadence.

## Current Non-Blockers If Kept Bounded

- NodeMuncher broad launch remains deferred/controlled alpha.
- Lightning remains hidden/gated.
- PayPal remains deferred.
- Benchmark remains public utility but not core customer render path.
- Public proof can remain honest but thin if it does not fake numbers.

## Commands Run

Read-only inspection:

```powershell
rg -n "SPOF|single point|founder|DNS|domain|registrar|Stripe|BTCPay|wallet|receipt|jobs|worker|backup|Storage Box|email|OAuth|Google|certificate|cert|TLS|Caddy|monitoring|IONOS|Node A|Node B|Node C|restore|offsite" release scripts src -S
```

No code changes were made.
No production changes were made.
No secrets were printed.
