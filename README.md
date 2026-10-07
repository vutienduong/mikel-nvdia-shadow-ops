# ShadowOps

Turn human work into reusable AI skills. A controlled customer-support workspace demonstrates semantic teaching, workflow review, conditional refinement and deterministic execution with bounded mock refunds.

## Local setup

Use Node.js 22.12+ and npm. Dependencies are locked in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000` for the landing page or `/app` for the workspace. Set `PORT` if that port is occupied. The app uses React/Vite with an Express backend; `npm run preview` serves only built frontend assets, so use `npm run dev` or `npm start` for AI endpoints.

```sh
npm test
npm run lint
npm run build
NODE_ENV=production npm start
```

`lint` currently means TypeScript checking. Payments, customer messages and manager identity are mock data; no external payment or email action occurs.

## Run without Nebius credentials

Select **Offline demo — fixtures** in the top bar. This choice is explicit: no failed live inference silently turns into a demo result. Workflow drafts, refinement proposals, matching and customer replies are marked as offline fixtures. This mode validates the product execution loop, not model intelligence.

1. Click **Reset**, select Maria, enable **Teach Mode**.
2. Click Inspect Customer → Inspect Payments → Verify Duplicate → Check Policy → Refund Payment → Send Customer Reply → Close Ticket.
3. Click **Stop & Learn Workflow**, inspect the generated definition, then **Save as Active Skill** (v1).
4. Select Alex and repeat teaching. After Check Policy, click Request Manager Approval. Open Manager Approvals, approve the request and return to Alex. Refund, send reply, close, then Stop & Learn. Accept **Add Rule** to create v2. Pending/rejected approval never permits refund.
5. Select Daniel, wait for workflow matching, then **Run with ShadowOps**. The approval branch is skipped, the duplicate is refunded, a confirmation with its actual receipt is saved, and the ticket resolves.
6. Select Sarah and run. No verified duplicate is found; the failed run is retained and no payment changes.

Teach Mode locks the demonstration to its ticket. Cancel a teaching session before switching tickets; wait for any in-flight reply to finish. Reset clears fixtures learned during the demo, ledger changes, approval requests, demonstrations and runs. It also invalidates in-flight work.

## Enable NVIDIA Nemotron through Nebius

Copy `.env.example` to the ignored `.env.local` (or `.env`) file. The server loads `.env.local` before `.env`; exported environment variables take precedence over both. Set server-only `NEBIUS_API_KEY`; never put credentials in a `VITE_` variable. Set `NEBIUS_BASE_URL` to your Nebius Token Factory regional endpoint if needed. Restart the server, select **Nemotron** in the top bar, and reset before demonstrating again.

`NEBIUS_FAST_MODEL` and `NEBIUS_DEEP_MODEL` can contain exact IDs exposed by your account's `/v1/models` catalog. If omitted, the client selects available Nemotron variants, preferring Nano for matching/replies and Ultra for induction/comparison. It rejects unavailable or non-Nemotron configured models. Model names are not assumed to be globally available.

The implementation uses Nebius's OpenAI-compatible `/chat/completions` interface described in the [official Nemotron cookbook](https://github.com/nebius/token-factory-cookbook/tree/main/models/nemotron). Missing credentials, upstream errors, timeout, invalid JSON and unsafe workflow definitions produce visible errors; no workflow is activated from those failures.

Live A/B/C/D acceptance passed on 2026-10-05 with configured Nano and Ultra models: induction, conditional comparison, ticket matching, receipt-based reply and safe no-duplicate stop. See [recorded provider/engine evidence](docs/evidence/live-acceptance.json). Live outputs remain nondeterministic; failed validation is visible and never replaced by a fixture.

To rerun against your configured Nebius account (consumes inference credits): `npx tsx scripts/live-acceptance.ts`. The normal `npm test` suite never calls paid inference.

## Documentation and limits

See [documentation index](docs/README.md), [current product](docs/PRODUCT.md), [architecture](docs/ARCHITECTURE.md) and [PRD gap analysis](docs/PRD_GAP_ANALYSIS.md). The original [PRD](PRD.md) remains product intent.

Browser localStorage owns operational state. Waiting approval checkpoints survive a refresh in the same browser; running steps interrupted by refresh fail rather than replay financial effects. A shared database, automatic scheduling and general crash recovery remain outside this implementation. Workflow editing/archive, explicit safe post-refund retry, human review and measured run analytics are implemented. Rules can never relax the independent policy at the refund handler.

## Review, recovery and deployment

Drafts and published workflows have a validated editor for names, arguments and approval thresholds. Published edits/refinements archive the prior definition and increment version; Skills exposes original JSON and source demonstration traces. Each run keeps its original definition independently of later edits.

Runs supports real local-day/rolling 7-day/30-day filters and active/waiting/terminal statuses. Retry resumes the same run only at an explicitly failed draft/send/close checkpoint after verifying the existing ticket-owned USD receipt and completed prerequisites. It never replays a refund. Ambiguous interrupted effects, rejected approvals and no-duplicate stops require human review. Assign human review records a reason and freezes automatic retry. Analytics uses only recorded runs/step completions, with no fabricated ROI or benchmark numbers.

The repo includes a Vite frontend and Vercel function adapter in `api/index.ts`; `vercel.json` routes API and SPA requests. Preview deployment requires `vercel login`, then `vercel deploy -y`. Configure `NEBIUS_API_KEY`, `NEBIUS_BASE_URL`, `NEBIUS_FAST_MODEL`, `NEBIUS_DEEP_MODEL` as server environment variables in the Vercel project before redeploying to enable live AI. Without them, select Offline demo. Never upload `.env.local` or put the key in frontend variables. This controlled demo has no production user authentication or shared database; restrict a live deployment's audience.

For deploying from a different machine, follow [the deployment procedure](docs/DEPLOYMENT.md); generate a credential-free source archive with `python3 scripts/package-source.py`. No Vercel deployment has been completed from this checkout.

[Watch the live browser demo](public/demo/shadowops-demo.mp4) (2m33s, labeled cuts/2× speed, no audio).

Licensed under [MIT](LICENSE). See [demo package](docs/DEMO.md) for architecture and presentation sequence.
