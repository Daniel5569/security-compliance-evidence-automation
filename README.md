# Security Compliance Evidence Automation

[![CI](https://github.com/Daniel5569/security-compliance-evidence-automation/actions/workflows/ci.yml/badge.svg)](https://github.com/Daniel5569/security-compliance-evidence-automation/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**[→ Live Demo](https://security-compliance-evidence-automa.vercel.app)** · **[→ GitHub](https://github.com/Daniel5569/security-compliance-evidence-automation)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Daniel5569/security-compliance-evidence-automation)

A production-shaped compliance operations console for tracking SOC 2, ISO 27001, and customer security review evidence — with control readiness, reviewer workflows, gap analysis, package builder, and a tamper-evident hash-chained audit trail.

Built as a portfolio demo targeting B2B SaaS companies where security reviews and evidence management are often handled manually in spreadsheets.

## Who is this for

- **Founders pre-SOC 2** who need to understand what a real compliance ops workflow looks like before hiring a dedicated team
- **Compliance engineers** evaluating evidence tracking architecture — hash-chained audit trails, reviewer workflows, and gap analysis at the schema level
- **CTOs and engineering leads** at B2B SaaS companies that receive customer security questionnaires manually and want to systematize the process
- **Security-focused engineers** interested in tamper-evident audit log design with SHA-256 hash chaining

## Quick Start

> **No database needed for the demo.** The Dashboard, Controls, Gaps, and Package views all work with synthetic in-memory data out of the box. Only the Audit Log persistence requires a database.

```bash
git clone https://github.com/Daniel5569/security-compliance-evidence-automation
cd security-compliance-evidence-automation
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the full UI loads immediately with seeded demo data.

**With audit persistence (optional):** Add a `.env` file with your [Neon](https://neon.tech) connection strings:

```
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://<user>:<password>@<host-direct>/<db>?sslmode=require
```

Then run `npm run db:push` to push the schema. Reviewer actions will now persist to your Neon instance and the chain verify endpoint becomes live.

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
- The decision to add Neon persistence while keeping the in-memory demo UX intact is documented in [`docs/adr-002-neon-postgres-audit-persistence.md`](docs/adr-002-neon-postgres-audit-persistence.md).

## Distinctive feature: tamper-evident audit trail

Every action in the audit log is linked into a SHA-256 hash chain. Each event stores:

- its own payload hash
- the hash of the previous event
- `chainHash = SHA-256(payload | previousHash)`

Reviewer actions write each new chained event to Neon via `POST /api/audit`. The server appends to the chain by fetching the previous tail hash from the DB, computing `SHA-256(payload | previousHash)`, and inserting the full `ChainedAuditEvent` row. A public `GET /api/audit/verify` endpoint re-reads all rows and re-walks the chain, returning `{ valid, totalEvents, firstBrokenAt }` — verifiable by any HTTP client without the UI.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15, React 19, TypeScript |
| Styling | CSS Grid, custom properties (no Tailwind) |
| ORM | Drizzle ORM |
| Database | Neon PostgreSQL (serverless HTTP driver) |
| Audit chain | SHA-256 via Web Crypto API |
| Testing | Vitest (pure function unit tests) |
| CI | GitHub Actions |

## Running tests

```bash
npm run check         # lint + type check + tests + build
npm test              # unit tests only (Vitest)
npm run db:push       # push schema to Neon (requires DATABASE_URL)
```

## Data & privacy

Seed controls, evidence items, owners, and the pre-loaded audit events are deterministic synthetic data. Reviewer actions taken in the live UI generate real audit events that are persisted to your Neon instance — those are not synthetic. No real names, infrastructure identifiers, API keys, credentials, or customer data in the repo. Safe to publish as-is.

## Architecture decision records

- [`adr-001`](docs/adr-001-scheduled-jobs-vs-event-driven.md) — why scheduled jobs instead of Redis Streams for compliance evidence
- [`adr-002`](docs/adr-002-neon-postgres-audit-persistence.md) — why Neon was added while keeping in-memory UX intact
