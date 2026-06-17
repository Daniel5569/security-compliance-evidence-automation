# Security Compliance Evidence Automation

A production-shaped compliance operations console for tracking SOC 2, ISO 27001, and customer security review evidence — with control readiness, reviewer workflows, gap analysis, package builder, and a tamper-evident hash-chained audit trail.

Built as a portfolio demo targeting B2B SaaS companies where security reviews and evidence management are often handled manually in spreadsheets.

## Demo — run in 60 seconds

```bash
git clone https://github.com/Daniel5569/security-compliance-evidence-automation
cd security-compliance-evidence-automation
npm install
```

Create a `.env` file with your Neon connection strings (see [neon.tech](https://neon.tech)):

```
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://<user>:<password>@<host-direct>/<db>?sslmode=require
```

Push the schema to your Neon instance, then start the dev server:

```bash
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Dashboard, Controls, Gaps, and Package views work with synthetic in-memory data. Reviewer actions (approve / reject / request changes) on the Audit log view additionally persist each event to Neon via `POST /api/audit`.

> **Quick demo without a database:** the frontend views work without a database. Set up `.env` only if you want the audit trail persistence and the public verify endpoint.

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
│  ├── audit-chain.ts        ← SHA-256 hash chain + append    │
│  ├── compliance-types.ts                                    │
│  ├── demo-data.ts          ← deterministic synthetic seed   │
│  └── db/                                                    │
│      ├── schema.ts         ← Drizzle audit_events table     │
│      └── index.ts          ← Neon serverless connection     │
│                                                             │
│  app/api/                                                   │
│  ├── audit/route.ts        ← POST: persist new event to DB  │
│  └── audit/verify/route.ts ← GET: re-verify chain from DB  │
└─────────────────────────────────────────────────────────────┘
```

**Architectural notes:**
- This project intentionally diverges from the event-driven (Redis Streams) pattern used in other repos in this portfolio. Compliance evidence collection is snapshot-based and human-paced — scheduled jobs with an append-only audit trail are the correct fit. See [`docs/adr-001-scheduled-jobs-vs-event-driven.md`](docs/adr-001-scheduled-jobs-vs-event-driven.md).
- The decision to add Neon persistence while keeping the frontend-only UX intact is documented in [`docs/adr-002-neon-postgres-audit-persistence.md`](docs/adr-002-neon-postgres-audit-persistence.md).

## Distinctive feature: tamper-evident audit trail

Every action in the audit log is linked into a SHA-256 hash chain. Each event stores:

```
chainHash  = SHA-256(id | timestamp | actor | action | targetId | beforeStatus | afterStatus | previousHash)
```

The Audit log view shows a **"Chain verified"** badge after computing all hashes client-side. Hover any hash cell to see the full 64-character hash and the previous link. This makes the audit log self-verifiable: if any event is altered, the chain breaks and the badge shows **"Chain broken"** with the first broken sequence number.

Reviewer actions write each new chained event to Neon via `POST /api/audit`. The server appends to the chain by fetching the previous tail hash from the DB, computing `SHA-256(payload | previousHash)`, and inserting the full `ChainedAuditEvent` row. A public `GET /api/audit/verify` endpoint re-reads all rows and re-walks the chain, returning `{ valid, totalEvents, firstBrokenAt }` — verifiable by any HTTP client without the UI.

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

- **Next.js 15** (App Router, API routes)
- **React 19** with TypeScript strict mode
- **Drizzle ORM** + **Neon PostgreSQL** (serverless HTTP driver) — audit event persistence
- **Vitest** — 17 tests covering compliance engine, hash chain, and server-side append logic
- **ESLint 9** flat config with `typescript-eslint`
- **GitHub Actions** CI (lint → type-check → test → build)

## Commands

```bash
npm run dev       # dev server at localhost:3000
npm run build     # production build
npm run lint      # ESLint (zero warnings)
npm test          # Vitest (17 tests, no DB required)
npx tsc --noEmit  # type-check
npm run db:push   # push schema to Neon (requires DATABASE_URL in .env)
npm run db:studio # open Drizzle Studio to browse audit_events table
```

## Synthetic data and privacy

All controls, evidence items, owners, and audit events are deterministic synthetic data. No real names, infrastructure identifiers, API keys, credentials, or customer data. Safe to publish as-is.

## Compliance disclaimer

Portfolio/demo project. Not legal advice, not an audit tool, not a SOC 2 or ISO 27001 certification service.
