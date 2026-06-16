# GitHub Handoff

## Repository

- Repository name: `security-compliance-evidence-automation`
- Suggested GitHub description: `Compliance evidence automation dashboard for controls, evidence review, gap analysis, security packages, and audit trails.`
- Suggested initial branch: `main`
- Suggested license: MIT

## Project Goal

Use this repository as a public portfolio demo for conversations with US B2B/SaaS startups that need internal tools for compliance-adjacent operations. The goal is to show that manual compliance evidence work can be turned into a structured workflow with controls, owners, review queues, gap analysis, package readiness, and audit trails.

Position yourself as an AI automation / product builder for operations and internal tools. Do not position this as legal advice, audit work, or senior security engineering.

## What To Say In 60 Seconds

This is a demo internal dashboard for security compliance evidence automation. It tracks SOC 2, ISO 27001, and customer security review controls, shows which evidence is missing or expired, lets a reviewer approve or reject evidence, calculates readiness and gaps, builds a synthetic customer review package, and records every decision in an audit log. It uses only synthetic data and runs locally with no external services or API keys.

## Before Publishing

Run these commands from the repository folder:

```bash
npm install
npm run lint
npm run build
npm test
```

Then start the app:

```bash
npm run dev
```

Open `http://localhost:3000` and verify:

- Dashboard is visible and not blank.
- KPI cards show readiness, missing evidence, in-review items, expired evidence, and package status.
- Search and filters update the evidence queue.
- Clicking an evidence row updates the detail panel.
- Reviewer actions change evidence status and add audit events.
- Controls view shows mapped controls and evidence requirements.
- Gaps view shows severity, owner, reason, impact, and next action.
- Package view can generate a synthetic package state.
- Audit log shows traceable events.

## Security And Privacy Checklist

This repo is intended to be public. Before pushing, confirm:

- `.env`, `.env.*`, `node_modules`, `.next`, logs, local screenshots, and temporary reports are ignored.
- No real names, emails, phone numbers, addresses, tokens, passwords, private infrastructure names, real customer names, or private system screenshots are included.
- All owners, controls, evidence previews, package data, and audit events are synthetic.
- No external integrations are required.
- No API keys are needed for setup.
- README contains the demo-only compliance disclaimer.

Recommended local searches before publishing:

```bash
rg -n "Daniel|OpenClaw|Tailscale|Hermes|token|secret|password|api[_-]?key|phone|email|@"
rg -n "\.env|BEGIN .*PRIVATE KEY|sk-[A-Za-z0-9]"
```

The expected result should be either no matches or only safe documentation/checklist text.

## GitHub Topics

- `compliance-automation`
- `security-compliance`
- `soc2`
- `iso27001`
- `evidence-management`
- `audit-log`
- `internal-tools`
- `workflow-automation`
- `nextjs`
- `typescript`
- `saas-dashboard`
- `portfolio-project`

## Publish Steps

From the repository folder:

```bash
git init
git branch -M main
git add .
git commit -m "Initial compliance evidence automation demo"
```

Create an empty GitHub repository named `security-compliance-evidence-automation`, then connect and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/security-compliance-evidence-automation.git
git push -u origin main
```

After publishing, add the suggested description and topics in GitHub repository settings.

## Demo Boundaries

This project is a portfolio demo. It is not legal advice, compliance advice, a SOC 2 audit, an ISO 27001 certification system, or a substitute for qualified review. Keep it framed as a product demo for workflow automation, evidence management, dashboards, and auditability.
