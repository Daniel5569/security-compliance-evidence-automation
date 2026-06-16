# ADR-001: Scheduled Jobs + Append-Only Audit Trail Over Event-Driven Streams

**Date:** 2026-06-17  
**Status:** Accepted  
**Deciders:** Portfolio author

## Context

The other projects in this portfolio use an event-driven architecture: Redis Streams with consumer group pattern, dead-letter queues, and worker pools. The question was whether to apply the same pattern here for compliance evidence collection.

## Decision

Use **scheduled jobs (cron) with an append-only, hash-chained audit trail** instead of event-driven streams.

## Rationale

Compliance evidence collection is snapshot-based by definition, not event-driven:

1. **Evidence has defined freshness windows** (SOC 2: 90 days, ISO 27001: varies). A nightly or weekly scheduled collector is the natural fit. A stream consumer would trigger on the wrong thing — there is no "event" that signals "time to recollect a quarterly access review."

2. **Audit trails must be immutable and verifiable**. In a compliance context the audit trail is evidence itself. An append-only store with a cryptographic hash chain (each event records `SHA-256(payload + previousHash)`) lets an auditor verify that the log has not been tampered with — a property that event-driven stream consumers do not inherently provide.

3. **Evidence review workflows are human-paced, not machine-paced**. A reviewer approving or rejecting evidence happens once per item over days or weeks. Redis Streams are designed for thousands of machine-speed events per second. Using streams here would add operational overhead (consumer group management, dead-letter handling, Redis cluster) with no throughput benefit.

4. **Compliance frameworks expect point-in-time snapshots**. SOC 2 Type II requires evidence from specific time periods. The natural data model is: `Snapshot(controlId, date, collectedBy, hash)` — a record, not a stream event.

## Divergence From Other Repos

This is an intentional architectural divergence. The event-driven pattern is correct for the other repos because they handle real-time operational workflows (ops automation, LLM evaluation pipelines) where message ordering, parallelism, and backpressure matter. For compliance, the bottleneck is human review and regulatory cadence, not throughput.

A portfolio that uses the same pattern everywhere is less interesting than one that picks the right tool for each domain.

## Resulting Architecture

```
Scheduled collector (cron)
    ↓ snapshot per control (configurable interval: daily/weekly/quarterly)
Immutable evidence store (append-only, no UPDATE on collected rows)
    ↓
Hash chain audit trail (each event: SHA-256(id + timestamp + actor + action + prevHash))
    ↓
Human review workflow (approve / request_changes / reject / mark_expired)
    ↓
Package builder (readiness gate: ≥85% approved, 0 high gaps, ≤2 pending reviews)
```

In this frontend-only portfolio demo the compliance engine (`lib/compliance-engine.ts`) and hash chain (`lib/audit-chain.ts`) implement the core logic with deterministic synthetic data, keeping the demo zero-dependency and instantly runnable.

## Consequences

- No Redis, no worker pool, no consumer groups required for this project.
- The hash chain verification function is a portfolio-differentiating feature: reviewers can confirm the audit log has not been modified between collection and review.
- If productionised, the scheduled collector would be a simple cron job (Temporal workflow, GitHub Actions scheduled, or a cron in a managed Postgres environment like Neon) — not a stream consumer.
