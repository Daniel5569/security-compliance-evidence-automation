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
## Architecture Decisions FAQ

**Q: Why hash-chain audit events instead of relying on database timestamps and row versioning?**

Database timestamps can be updated by anyone with write access to the database — including migrations, admin scripts, and ORM bugs. A hash chain makes each event's integrity dependent on all previous events: changing or deleting any record breaks the chain at that point, and the break is detectable by re-running the verification function over the full sequence. Timestamps and row versions prove when a row was written; a hash chain proves the sequence has not been altered after the fact.

**Q: Why build this instead of using a managed tool like Vanta or Drata?**

Vanta and Drata are excellent products for teams that want to get to SOC 2 with minimal engineering effort. This codebase targets a different audience: compliance engineers who want to understand what the underlying data model and audit trail look like, and founders who want a lightweight internal tool they control rather than a SaaS subscription per-seat cost. It is also a portfolio demo that shows production-shaped architecture patterns — hash-chained audit trails and reviewer workflows — not a claim that everyone should build their own compliance platform.

**Q: What does tamper-evident mean in practice — can the hash chain detect all tampering?**

The chain detects any modification to a stored event that changes the data used to compute its hash (actor, action, target, timestamps, previous hash). It does not prevent tampering — someone with database write access can still overwrite rows. What it guarantees is that tampering is detectable: the verify endpoint re-derives each hash from the stored fields and checks it against the stored chain hash. If they diverge, the response includes the sequence number of the first broken link. The chain is a detection mechanism, not an access control.

**Q: Why scheduled jobs for evidence collection instead of event-driven updates?**

Evidence typically comes from external systems (ticketing tools, cloud provider dashboards, access review exports) that do not emit webhooks on every change. A scheduled pull model works with any source that has a read API, regardless of whether it supports push events. It also makes the ingestion pipeline deterministic and testable — run the collector at T, get the same evidence snapshot, verify the hash chain covers the run. An event-driven model would require webhook receivers, retry queues, and deduplication logic for each source system.

**Q: What is a security package — who receives it and in what format?**

A security package is a point-in-time export of evidence for a specific control set, formatted for a customer or auditor. In practice this is a ZIP of evidence artifacts (screenshots, policy documents, export CSVs) plus a cover page listing control IDs, evidence references, and review status. B2B SaaS companies produce these for enterprise customers who ask for security documentation before signing a contract. The package builder in this system assembles the export from the evidence already stored in the database rather than requiring manual collection each time.
