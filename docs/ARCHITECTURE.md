# ShadowOps — current architecture

Verified on 2026-10-05 through source inspection, automated domain/AI/HTTP tests, TypeScript check, Vite build and local offline browser journeys. Nebius live calls and production deployment are unverified.

## Components

- [server.ts](../server.ts): Express JSON API, health/configuration status, bounded body size and sanitized errors. Development mounts Vite with HMR on the same HTTP server; production serves `dist` with an SPA fallback.
- [server/ai.ts](../server/ai.ts): server-only Nebius configuration/catalog, bounded concurrency and token budgets, timeout/retry for transient HTTP responses, induction/comparison/matching/reply prompts, runtime request/response validation and provenance. Offline fixture mode is explicit per request; a live failure cannot choose it.
- [domain/contracts.ts](../src/domain/contracts.ts): Zod contracts for workflow IR, steps, conditions, observations, tickets, AI proposals/matches and skill inputs/outputs. Workflow validation rejects unknown/duplicate skills, duplicate/reserved IDs, missing prerequisites/arguments, incomplete workflows, bad/forward/prototype references and conditional core effects. Only approval may branch in V1.
- [domain/operations.ts](../src/domain/operations.ts): owns the operational ledger and executable handler registry. Provides one refund/policy/receipt/closure boundary for manual and workflow execution. Resolves references by step IDs and canonical aliases, checks contracts before handlers, validates outputs and saves a run/checkpoint trace.
- [AppContext](../src/context/AppContext.tsx): React orchestration, browser persistence, teaching sessions, normalized event traces, AI requests, accepted workflow updates, matching state, errors, schedule CRUD and reset. Business mutations call OperationsEngine. [context.ts](../src/context/context.ts) preserves React context identity separately from the implementation during hot refresh.
- [Skill metadata](../src/data/skillRegistry.ts): derives input/output JSON schemas from the runtime contracts. The server uses those same contracts to constrain prompts; executable handlers live in OperationsEngine.
- [App shell](../src/App.tsx): tab navigation and review/execution modals. Workspace, Skills and Runs consume context state.

## Ownership and storage

OperationsState contains tickets, customers, payments, policies, approvals, workflows, runs and messages. AppContext subscribes to snapshots emitted by the engine and stores `shadowops_operations_v2` in localStorage. Original unversioned operational keys are not loaded. Reset creates isolated clean seed state; the application's initial state excludes the seed file's showcase workflows and historical runs.

Demonstration records and semantic event payloads persist separately under `shadowops_demonstrations`. Activities, schedules and the explicit AI mode use separate keys. Draft, selected view, toast and matching state remain UI state. There is no shared database, migration or server-side business CRUD authority. The trusted scope is a controlled single-browser mock demo, not production financial authorization.

Policy eligibility uses structured USD thresholds and a 48-hour duplicate window plus ledger/customer ownership. Free-text policy prose is prompt context, not executable code. Unknown/inconsistent structured policy stops refunds. Every issued receipt records its originating ticket; confirmations cannot reuse another ticket's receipt even for the same customer.

## Learning path

1. Teaching pins a session to one open ticket and records action/args/entities/results. Reply generation blocks ticket/session changes and asynchronous completion is checked against its originating session.
2. Stop & Learn requires resolved business state, normalizes adjacent redundant events, then sends induction or comparison input. Comparison includes saved prior demonstration traces.
3. Live mode selects/configures an available Nemotron model from `/v1/models`, calls `/v1/chat/completions`, parses JSON and validates core IR/proposals. Server-owned policies and skill contracts constrain the model; ticket text is treated as data.
4. The server stamps workflow metadata and provider/model/mode/request provenance. Client validates again before save/refine.
5. Accepted proposals use the specified target, condition and step. Whole updated workflow validation happens before publication. Same/new classifications are handled separately. Run definitions preserve execution versions, but a separate workflow version archive is not implemented.

Live output remains untrusted data: it is never executed as JavaScript, shell commands or arbitrary tool names. The configured model must be a catalogued Nemotron variant. Fast/deep model variables are optional; endpoint allowlisting requires HTTPS Nebius Token Factory hosts. The server loads ignored `.env.local` before `.env`, with exported environment variables taking precedence. Secrets never enter browser variables or result payloads.

Reference: [Nebius official Nemotron cookbook](https://github.com/nebius/token-factory-cookbook/tree/main/models/nemotron), which documents the OpenAI-compatible interface and regional model configuration. Exact availability is verified at runtime per account/endpoint, not inferred from this document.

## Execution and approval

A new run stores a validated immutable definition, version, canonical context, next-step index, ISO timestamps and step traces before executing. Inputs resolve from `ticket`, prior step IDs or `customer/payments/duplicate/policy/approval/refund/reply/message/closed` aliases. Every skill validates input/output and checks ticket/customer ownership. Unknown handlers cannot succeed.

Conditional approval steps evaluate the actual IR condition. Independently, a high-value refund step inserts a policy approval checkpoint if needed even when no learned branch exists. The run stores its pending approval and stops in `waiting_approval`. Approve resumes the same step; Reject marks failed without refund. Pending/active runs lock other mutations/runs for the same ticket.

Refund mutates only the verified duplicate ledger entry and records its receipt/ticket. Draft calls the configured AI mode using actual refund facts. Send verifies receipt/amount and persists the mock message. Close requires that message and refunded payment. Exceptions persist failed trace/error; completed durations come from real timestamps, with no artificial delays or fixed success summaries.

Waiting checkpoints survive a refresh in the same browser. Interrupted `running`/`queued` runs become failed and require ledger review, avoiding blind replay after a partially completed effect. General crash-safe server recovery, cross-browser coordination and retry are not implemented.

Reset increments a generation token, aborts in-flight HTTP requests, replaces engine state and clears sessions/history. Late execution/reply results fail the generation check before mutation; late learning results cannot publish a workflow. Hiding an execution modal does not delete its run.

## Verification and remaining infrastructure

[Operations tests](../tests/operations.test.ts) cover approval, receipt ownership, duplicate windows, unsafe IR, argument/condition execution, concurrency and reset. [AI tests](../tests/ai.test.ts) verify model catalog/transport/schema behavior with stubbed provider responses and explicit fixtures. [HTTP integration tests](../tests/api.test.ts) cover malformed/error responses and the full offline A/B/C/D sequence.

[package.json](../package.json) defines dev/start, test, TypeScript check and Vite build; [lockfile](../package-lock.json) makes npm setup repeatable. [.env.example](../.env.example) documents server-only configuration. No deployment or paid-provider call was performed. See [README](../README.md) for execution commands and [gap analysis](PRD_GAP_ANALYSIS.md) for P1/P2 work.
