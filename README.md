# Security Compliance Evidence Automation

A production-shaped compliance operations console for tracking SOC 2, ISO 27001, and customer security review evidence — with control readiness, reviewer workflows, gap analysis, package builder, and a tamper-evident hash-chained audit trail.

Built as a portfolio demo targeting B2B SaaS companies where security reviews and evidence management are often handled manually in spreadsheets.

## Demo — run in 30 seconds

```bash
git clone https://github.com/Daniel5569/security-compliance-evidence-automation
cd security-compliance-evidence-automation
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No API keys, no database, no environment variables needed.

## What the demo shows

| View | What you can do |
|------|-----------------|
| **Dashboard** | Framework readiness scores, evidence queue, reviewer decisions (approve / request changes / reject), gap panel |
| **Controls** | 24 controls mapped to SOC 2 / ISO 27001 / Customer Review with requirements, owners, and readiness status |
| **Gaps** | Severity-ranked gap list with owner, impact, reason, and next action |
| **Package** | Customer security review package builder — readiness gate (≥85% approved, 0 high gaps, ≤2 pending), included/excluded evidence, redaction status |
| **Audit log** | Hash-chained event log with chain integrity verification badge |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js App Router  (React 19, TypeScript, CSS Grid)       │
│                                                             │
│  components/                                                │
│  ├── app-shell.tsx       ← state orchestrator               │
│  ├── compliance-dashboard.tsx                               │
│  ├── evidence-queue.tsx  ← sortable, filterable evidence    │
│  ├── evidence-detail-panel.tsx  ← reviewer workflow         │
│  ├── control-library.tsx                                    │
│  ├── gap-analysis.tsx                                       │
│  ├── package-builder.tsx                                    │
│  └── audit-log-table.tsx  ← hash-chain verification UI      │
│                                                             │
│  lib/                                                       │
│  ├── compliance-engine.ts  ← pure business logic (tested)   │
│  ├── audit-chain.ts        ← SHA-256 hash chain             │
│  ├── compliance-types.ts                                    │
│  └── demo-data.ts          ← deterministic synthetic seed   │
└─────────────────────────────────────────────────────────────┘
```

**Architectural note:** This project intentionally diverges from the event-driven (Redis Streams) pattern used in other repos in this portfolio. Compliance evidence collection is snapshot-based and human-paced — scheduled jobs with an append-only audit trail are the correct fit. See [`docs/adr-001-scheduled-jobs-vs-event-driven.md`](docs/adr-001-scheduled-jobs-vs-event-driven.md) for the full reasoning.

## Distinctive feature: tamper-evident audit trail

Every action in the audit log is linked into a SHA-256 hash chain. Each event stores:

```
chainHash  = SHA-256(id | timestamp | actor | action | targetId | beforeStatus | afterStatus | previousHash)
```

The Audit log view shows a **"Chain verified"** badge after computing all hashes client-side. Hover any hash cell to see the full 64-character hash and the previous link. This makes the audit log self-verifiable: if any event is altered, the chain breaks and the badge shows **"Chain broken"** with the first broken sequence number.

In a production system this same pattern would run server-side with the chain persisted in an append-only table (e.g., PostgreSQL `GENERATED ALWAYS AS IDENTITY` + no `UPDATE`/`DELETE` grants on the audit table).

## SOC 2 control coverage

The demo ships with controls across five SOC 2 Trust Services Criteria domains:

| Domain | Controls |
|--------|----------|
| Access control (CC6) | User access review, employee access, authentication |
| Change management (CC8) | Change approval, deployment, rollback, vulnerability triage |
| Incident response (CC7.2–7.5) | IR procedures, severity matrix, customer communication |
| Vendor management (CC9) | Vendor risk, subprocessor register, supplier review |
| Security monitoring (CC7.1) | Alert policy, triage samples, log coverage |

Plus ISO 27001 Annex A domains (A.5 – A.18 subset) and a Customer Security Review package track.

## Compliance workflow model

```
Evidence collected
       ↓
 in_review (queued for human review)
       ↓
 approved ──────────────────────────► included in package
       │
 needs_changes → owner updates → back to in_review
       │
 rejected ──────────────────────────► excluded from package
       │
 expired (freshness window exceeded) ► creates high gap
```

A **package** is `ready` when:
- Readiness score ≥ 85% across framework controls
- Zero high-severity gaps
- ≤ 2 pending review items

## Tech stack

- **Next.js 15** (App Router)
- **React 19** with TypeScript strict mode
- **Vitest** — 12 tests covering compliance engine and hash chain
- **ESLint 9** flat config with `typescript-eslint`
- **GitHub Actions** CI (lint → type-check → test → build)
- Zero external dependencies at runtime (no database, no API keys)

## Commands

```bash
npm run dev    # dev server at localhost:3000
npm run build  # production build
npm run lint   # ESLint (zero warnings)
npm test       # Vitest
npx tsc --noEmit  # type-check
```

## Synthetic data and privacy

All controls, evidence items, owners, and audit events are deterministic synthetic data. No real names, infrastructure identifiers, API keys, credentials, or customer data. Safe to publish as-is.

## Compliance disclaimer

Portfolio/demo project. Not legal advice, not an audit tool, not a SOC 2 or ISO 27001 certification service.
