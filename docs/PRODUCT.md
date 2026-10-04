# ShadowOps — current product

Verification: 2026-10-05. Source inspection, automated domain/AI/HTTP integration tests, TypeScript checking and Vite production build. Browser journeys verified locally: offline A → B → C, Sarah safe stop/history, reset, manual approval bypass rejection, autonomous approval reject/resume. Nebius live inference and production deployment were not verified because credentials/deployment are unavailable. Tests use a provider stub for live transport and labeled fixtures for offline journeys.

## Users and current journeys

ShadowOps serves operations specialists who teach reusable customer-support workflows and managers who review runs and approve mock refunds. The workspace contains Inbox, Customers, Payments, Policies, Approvals and Activity Log. Four seeded cases represent Maria ($79 duplicate), Alex ($1,100 duplicate), Daniel ($119 duplicate) and Sarah (different $99/$49 charges).

- Reset starts a clean learning demo: open tickets, captured payments, no learned workflows, runs, messages, approvals or demonstrations. Previously seeded showcase workflows/runs are not loaded by the application.
- Teach Mode records semantic actions against a fixed ticket. Changing tickets during teaching or generating a reply is blocked. Stop & Learn requires the ticket to have completed refund, saved customer confirmation and closure.
- First demonstration produces a validated workflow draft with visual/JSON review and explicit save. The second demonstration is compared with the current workflow and stored prior traces. Same-workflow results do not insert rules; supported conditional proposals require explicit Add Rule. New-workflow output must pass the same validator.
- Refinement applies the proposal's workflow ID, step and condition, rather than a fixed threshold. Existing approval steps cannot be inserted again. The current version increments; independent old-version browsing/editing is not implemented.
- Ticket matching classifies subject/message rather than trusting seeded intent. A match with confidence at least 0.70 is suggested for an explicit human Run action. There is no automatic low-confidence execution.
- Autonomous execution resolves workflow references and conditions, runs registered handlers, and records inputs, outputs, timestamps, latency and failed/completed/waiting states. Refunds and messages update the same browser ledger as manual actions.
- Manager approval pauses the run before refund. Approve resumes from its checkpoint; Reject ends the run without issuing a refund. A workflow v1 without a learned approval branch still respects the independent $500 policy guard.
- Run History retains failed, waiting and successful runs. Each new run includes the exact workflow definition/version used. Closing the live modal only hides its view.

## AI modes

The default mode is live NVIDIA Nemotron through Nebius Token Factory. The server verifies available models, makes real induction/comparison/matching/reply requests, validates results and returns provider/model/request provenance. Missing configuration, timeout, unavailable model, upstream failure or malformed output produces an error. There is no silent fallback.

Offline demo is an explicit top-bar selection. It uses deterministic fixtures for the supported complete duplicate-payment demonstration, observed approval variation, keyword ticket matching and receipt-based reply. Outputs are labeled fixture; they are not evidence of AI learning or calibrated confidence. The end-to-end UI has been verified in this mode. Live inference remains unverified until credentials are configured.

## Business rules

All financial and communication effects are mock operations. Refund handlers verify customer email/account ownership, captured status, a duplicate of the same customer/currency/service plan within the structured 48-hour window, and consistent USD refund/governance policies. Only the secondary duplicate may be refunded. Policy ambiguities and missing customers stop execution.

A refund above $500 requires an approved request tied to its ticket, payment, amount, currency and run (or manual operation). Learned rules can require additional approvals but cannot weaken the refund boundary. Active runs lock manual mutations and duplicate execution on the same ticket; already-refunded payments cannot be refunded again.

Customer confirmations contain the actual refund ID and amount, are stored in the ticket's mock history, and use a receipt belonging to that ticket. Invalid provider facts or missing receipt prevent sending. Closure requires both successful refund and saved confirmation. Reply failure leaves the refund visible but the ticket open for human follow-up. Reset invalidates pending inference/replies/execution so old results cannot recreate cleared state.

## Persistence and remaining limits

A versioned localStorage record stores the browser's operational ledger, workflow definitions, runs/checkpoints and customer messages. Demonstrations and semantic traces are separately stored in the same browser. This is not server-side or multi-user persistence. A refresh can resume a waiting approval, but an interrupted running step is marked failed rather than blindly replayed.

Draft/refinement modals offer review/save/reject; editing and a full workflow version archive remain P1. General retry/escalation and a database remain P1. Navigation is tab-based rather than `/skills` and `/runs` routes. No landing page, production deployment or live model acceptance result is claimed.

Analytics still mixes browser-derived totals with illustrative weekly chart data and estimated savings. Schedule CRUD/manual dispatch exists without an automatic cron worker; automatic scheduling and additional workflow types are outside V1. The seed file retains historical reference fixtures, but clean application state excludes them.

## Sources

- [Application state and teaching](../src/context/AppContext.tsx)
- [Operations engine and guards](../src/domain/operations.ts)
- [Workflow/skill contracts](../src/domain/contracts.ts)
- [AI service](../server/ai.ts)
- [Ticket workspace](../src/components/workspace/TicketWorkspace.tsx)
- [Original PRD](../PRD.md) and [gap analysis](PRD_GAP_ANALYSIS.md)
