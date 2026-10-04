# ShadowOps

Turn human work into reusable AI skills. A controlled customer-support workspace demonstrates semantic teaching, workflow review, conditional refinement and deterministic execution with bounded mock refunds.

## Local setup

Use Node.js 22.12+ and npm. Dependencies are locked in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. Set `PORT` if that port is occupied. The app uses React/Vite with an Express backend; `npm run preview` serves only built frontend assets, so use `npm run dev` or `npm start` for AI endpoints.

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

No live inference was verified for this checkout because Nebius credentials are not available. Transport/schema behavior is tested against local stubs; offline API/engine and browser journeys are tested separately.

## Documentation and limits

See [documentation index](docs/README.md), [current product](docs/PRODUCT.md), [architecture](docs/ARCHITECTURE.md) and [PRD gap analysis](docs/PRD_GAP_ANALYSIS.md). The original [PRD](PRD.md) remains product intent.

Browser localStorage owns operational state. Waiting approval checkpoints survive a refresh in the same browser; running steps interrupted by refresh fail rather than replay financial effects. A shared database, general recovery/retry, workflow version archive, workflow editing, automatic scheduling and production deployment remain outside this P0 implementation. Rules can never relax the independent policy at the refund handler.
