# Deploy ShadowOps from another machine

This checkout cannot authenticate with Vercel. No deployment has been completed from this machine. The server/function adapter and routing configuration are prepared; the deployed API and live inference must still be verified after deployment.

## 1. Transfer the finished source

Use the clean `shadowops-source.tar.gz` package produced by `scripts/package-source.py`. It includes application code, tests, lockfile, documentation and the original PRD, but includes the placeholder `.env.example` and excludes credential `.env*` files, node_modules, build output, Git history and raw browser recordings. The finished public demo MP4 is included. Keep your API key separately in a password manager or another secure channel.

On the destination machine, with Node.js 22.12+:

```sh
mkdir shadowops
cd shadowops
tar -xzf /path/to/shadowops-source.tar.gz
npm ci
npm test
npm run lint
npm run build
```

Alternatively, once you have pushed the finished branch yourself, clone the repository and check out `codex/p0-learning-execution`. The current work is committed locally; do not assume the remote branch already contains these changes.

## 2. Sign in and link the Vercel project

```sh
npm install -g vercel
vercel login
vercel whoami
vercel link
```

Choose your own account/team. Create a new ShadowOps project, or select an existing project you intend to update. Use the repository root as the project directory. `vercel.json` sets Vite, `npm run build`, the `dist` output and API routing; do not deploy only the contents of `dist` because that would omit the backend.

## 3. Configure server environment variables

For each command, enter the value at Vercel's terminal prompt. Do not put the API key in command arguments, Git or a `VITE_` variable.

```sh
vercel env add NEBIUS_API_KEY preview
vercel env add NEBIUS_BASE_URL preview
vercel env add NEBIUS_FAST_MODEL preview
vercel env add NEBIUS_DEEP_MODEL preview
```

Values verified against the current account catalog:

```dotenv
NEBIUS_BASE_URL=https://api.tokenfactory.us-central1.nebius.com/v1/
NEBIUS_FAST_MODEL=nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B
NEBIUS_DEEP_MODEL=nvidia/Nemotron-3-Ultra-550b-a55b
```

`NEBIUS_API_KEY` is your Token Factory key. Configure these for every preview branch if the CLI asks about a specific branch. Endpoint/model availability may change; the application checks the catalog at runtime. Leave `PORT` and `DISABLE_HMR` unset on Vercel.

## 4. Deploy a preview

```sh
vercel deploy -y
```

Keep the returned deployment URL. Open it in a browser: `/` is the landing page, `/app` is the workspace. After changing environment variables, deploy again; existing deployments retain their original configuration.

## 5. Verify the deployed application

1. Open `/api/health`; it should return JSON with `ai.configured: true` and the two selected model IDs. This confirms configuration, not inference.
2. Open `/app`, select Nemotron, and Reset. Teach Maria through refund, saved confirmation and Close Ticket. Stop & Learn; save v1. Confirm the draft displays live Nebius/Nemotron provenance.
3. Teach Alex, request and approve manager approval, refund, reply and close. Accept the live refinement to v2. Verify archived v1 and its original source demonstration in Skills.
4. Run Daniel; confirm v2 completes with the actual refund receipt and saved reply.
5. Run Sarah; confirm no duplicate stops execution, no refund occurs, and failed history is present. Assign human review. Check Analytics reflects one completed and one failed autonomous run.
6. Refresh Skills/Runs; the same browser should retain its local records. A different browser starts its own demo state.

Missing configuration should produce a visible error; use explicit Offline demo to test without credits. A preview without the key has offline capability but is not proof of deployed live inference.

## 6. Production, if desired later

This is a controlled mock demo with browser-local state, no production authentication and no shared database. Use Vercel Deployment Protection/restricted access for a preview with live inference credentials; public calls otherwise consume your Nebius credit. The current in-process concurrency limit is not a global serverless spending quota.

If you choose a production release, add all four variables to `production` with `vercel env add <NAME> production`, then run:

```sh
vercel deploy --prod
```

Verify the same acceptance flow on the production URL. This guide does not claim that production has been deployed.

## Troubleshooting

- **401 from Nebius:** check Token Factory key and endpoint; creating a new Vercel deployment is required after replacing a key.
- **Model unavailable:** exact capitalization matters; use an ID returned by that account's `/v1/models` catalog.
- **HTML instead of API JSON:** deploy the full project and retain `api/index.ts` plus `vercel.json`, rather than hosting only `dist`.
- **Server function crash:** inspect Vercel function logs, ensure Node.js 22 and successful `npm ci`/build. Local tests do not prove serverless deployment.
- **Inference timeout/invalid workflow:** app refuses unsafe output without fixture fallback. Review the error; retry learning explicitly. A failed run may retry only an eligible communication checkpoint; it never replays a refund.
