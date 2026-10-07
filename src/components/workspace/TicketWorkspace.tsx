import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { findDuplicate, paymentTime } from "../../domain/operations";
import {
  User,
  CreditCard,
  FileText,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Mail,
  DollarSign,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

export const TicketWorkspace: React.FC = () => {
  const {
    tickets,
    selectedTicketId,
    customers,
    payments,
    policies,
    approvals,
    isTeaching,
    recordAction,
    issueRefund,
    submitApprovalRequest,
    resolveTicket,
    showToast,
    messages,
    draftAndSendReply,
    checkRefundPolicy,
  } = useApp();

  const ticket = tickets.find((t) => t.id === selectedTicketId);
  const customer = ticket
    ? customers.find((c) => c.id === ticket.customerId)
    : null;
  const customerPayments = customer
    ? payments.filter((p) => p.customerId === customer.id)
    : [];
  const relevantPolicy =
    policies.find((p) => p.id === "POL_REFUND_01") || policies[0];

  const [activeTab, setActiveTab] = useState<"details" | "payments" | "policy">(
    "details",
  );
  const replyMessage =
    messages.find((m) => m.ticketId === selectedTicketId)?.text || "";
  const replySource = messages.find(
    (m) => m.ticketId === selectedTicketId,
  )?.provenance;
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [verifiedDuplicate, setVerifiedDuplicate] = useState<boolean>(false);
  const [duplicatePaymentId, setDuplicatePaymentId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setVerifiedDuplicate(false);
    setDuplicatePaymentId(null);
    setActiveTab("details");
  }, [selectedTicketId]);

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-500 text-sm">
        Select a ticket from the inbox to inspect operations workspace.
      </div>
    );
  }

  const duplicate = (() => {
    try {
      return findDuplicate(customerPayments);
    } catch {
      return null;
    }
  })();
  const candidateDuplicate = duplicate?.payment || null;

  // Handlers for Semantic Operations (also emits ObservationEvent when isTeaching)
  const handleFindCustomer = () => {
    if (!customer) return;
    recordAction(
      "find_customer",
      "customer",
      customer.id,
      `Located customer profile: ${customer.name} (${customer.plan})`,
      { customerId: customer.id, email: customer.email, plan: customer.plan },
    );
    showToast(`Customer account ${customer.name} inspected.`);
  };

  const handleGetRecentPayments = () => {
    if (!customer) return;
    setActiveTab("payments");
    recordAction(
      "get_recent_payments",
      "payment",
      customer.id,
      `Retrieved ${customerPayments.length} billing transaction records`,
      { customerId: customer.id, count: customerPayments.length },
    );
    showToast(
      `Loaded ${customerPayments.length} billing records for ${customer.name}.`,
    );
  };

  const handleDetectDuplicate = () => {
    if (candidateDuplicate) {
      setVerifiedDuplicate(true);
      setDuplicatePaymentId(candidateDuplicate.id);
      setActiveTab("payments");
      recordAction(
        "detect_duplicate_payment",
        "payment",
        candidateDuplicate.id,
        `Verified duplicate payment of $${candidateDuplicate.amount} (${candidateDuplicate.id})`,
        {
          duplicatePaymentId: candidateDuplicate.id,
          amount: candidateDuplicate.amount,
          intervalMinutes: duplicate
            ? Math.round(
                (paymentTime(duplicate.payment.chargedAt) -
                  paymentTime(duplicate.original.chargedAt)) /
                  60000,
              )
            : 0,
        },
      );
      showToast(
        `Duplicate payment confirmed: $${candidateDuplicate.amount} on ${candidateDuplicate.id}`,
      );
    } else {
      // Non-duplicate scenario (e.g. Sarah Williams)
      setVerifiedDuplicate(false);
      recordAction(
        "detect_duplicate_payment",
        "payment",
        ticket.id,
        "Analyzed transactions: No identical charges found within billing interval",
        { isDuplicate: false, chargesChecked: customerPayments.length },
      );
      showToast("Guardrail: No matching duplicate charges detected.");
    }
  };

  const handleCheckPolicy = () => {
    setActiveTab("policy");
    if (!candidateDuplicate) {
      showToast(
        "No verified duplicate; refund eligibility cannot be established.",
      );
      return;
    }
    try {
      const result = checkRefundPolicy(candidateDuplicate.id, ticket.id);
      recordAction(
        "check_refund_policy",
        "policy",
        result.policyId,
        `Verified policy eligibility; approval ${result.requiresApproval ? "required" : "not required"}`,
        result,
      );
      showToast(
        result.requiresApproval
          ? "Manager approval is required before refund."
          : "Verified duplicate is eligible for refund.",
      );
    } catch (error) {
      showToast((error as Error).message);
    }
  };
  const handleRequestApproval = () => {
    if (!candidateDuplicate) {
      showToast("Verify a duplicate before requesting approval.");
      return;
    }
    submitApprovalRequest(
      ticket.id,
      candidateDuplicate.amount,
      "Verified high-value duplicate payment",
    );
  };
  const handleRefundPayment = async () => {
    if (!candidateDuplicate) {
      showToast("No verified duplicate payment to refund.");
      return;
    }
    try {
      const refundId = await issueRefund(candidateDuplicate.id, ticket.id);
      showToast(`Refund ${refundId} issued.`);
    } catch {
      /* Context displays the failed guard. */
    }
  };
  const handleDraftAndSendReply = async () => {
    setIsDrafting(true);
    try {
      await draftAndSendReply(ticket.id);
    } catch {
      /* Context displays provider or receipt error. */
    } finally {
      setIsDrafting(false);
    }
  };
  const handleCloseTicket = () => resolveTicket(ticket.id);

  const ticketApproval = approvals.find((a) => a.ticketId === ticket.id);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-y-auto">
      {/* Top Ticket Header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-900/40">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              #{ticket.id}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                ticket.status === "resolved"
                  ? "bg-emerald-950/70 border border-emerald-800 text-emerald-300"
                  : ticket.status === "pending_approval"
                    ? "bg-amber-950/70 border border-amber-800 text-amber-300"
                    : "bg-zinc-800 text-zinc-300 border border-zinc-700"
              }`}
            >
              {ticket.status === "resolved" ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Resolved
                </>
              ) : ticket.status === "pending_approval" ? (
                <>
                  <Clock className="w-3 h-3 text-amber-400" />
                  Waiting for Manager Approval
                </>
              ) : (
                "Open"
              )}
            </span>
            <span className="text-xs text-zinc-500">{ticket.createdAt}</span>
          </div>

          {ticket.amount && (
            <div className="flex items-center gap-1.5 font-mono text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-md text-zinc-200">
              <span className="text-zinc-500">Flagged Amount:</span>
              <span className="font-semibold text-white">
                ${ticket.amount} {ticket.currency || "USD"}
              </span>
            </div>
          )}
        </div>

        <h2 className="text-lg font-semibold text-white tracking-tight">
          {ticket.subject}
        </h2>

        {/* Customer Quick Summary */}
        {customer && (
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-zinc-800/60 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-medium text-zinc-200">{customer.name}</span>
              <span className="text-zinc-500 font-mono">
                ({customer.email})
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
              <span>{customer.plan}</span>
            </div>
            <span>•</span>
            <div>
              Lifetime Value:{" "}
              <span className="font-mono text-zinc-300 font-medium">
                ${customer.lifetimeValue}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Semantic Operational Actions Bar */}
      <div className="px-6 py-3 bg-zinc-900/80 border-b border-zinc-800 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mr-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Semantic Actions:
        </span>

        <button
          onClick={handleFindCustomer}
          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <User className="w-3 h-3 text-indigo-400" />
          Inspect Customer
        </button>

        <button
          onClick={handleGetRecentPayments}
          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <CreditCard className="w-3 h-3 text-blue-400" />
          Inspect Payments
        </button>

        <button
          onClick={handleDetectDuplicate}
          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Verify Duplicate
        </button>

        <button
          onClick={handleCheckPolicy}
          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <FileText className="w-3 h-3 text-purple-400" />
          Check Policy
        </button>

        {/* Manager Approval Button (Recommended when amount > 500) */}
        {(ticket.amount && ticket.amount > 500) ||
        (candidateDuplicate && candidateDuplicate.amount > 500) ? (
          <button
            onClick={handleRequestApproval}
            className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Request Manager Approval (&gt;$500)
          </button>
        ) : null}

        <button
          onClick={handleRefundPayment}
          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <DollarSign className="w-3 h-3 text-emerald-400" />
          Refund Payment
        </button>

        <button
          onClick={handleDraftAndSendReply}
          disabled={isDrafting}
          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Send className="w-3 h-3 text-indigo-400" />
          {isDrafting ? "Drafting..." : "Send Customer Reply"}
        </button>

        {ticket.status !== "resolved" && (
          <button
            onClick={handleCloseTicket}
            className="ml-auto px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-medium border border-emerald-700/80 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Close Ticket
          </button>
        )}
      </div>

      {/* Main Workspace Body */}
      <div className="p-6 space-y-6">
        {/* Customer Ticket Message */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-zinc-400">
            <Mail className="w-3.5 h-3.5 text-zinc-500" />
            Customer Message:
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed font-sans bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/80">
            "{ticket.message}"
          </p>
        </div>

        {/* Tab Controls for Detailed Inspection */}
        <div className="border-b border-zinc-800 flex items-center gap-6">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "details"
                ? "border-indigo-500 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Customer Overview
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "payments"
                ? "border-indigo-500 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Payment Transactions ({customerPayments.length})
            {candidateDuplicate && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("policy")}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "policy"
                ? "border-indigo-500 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Applicable Refund Policy
          </button>
        </div>

        {/* Tab 1: Customer Details */}
        {activeTab === "details" && customer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Account Credentials
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Account ID:</span>
                  <span className="font-mono text-zinc-200">{customer.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Full Name:</span>
                  <span className="text-zinc-200">{customer.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Primary Email:</span>
                  <span className="text-zinc-200">{customer.email}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Customer Since:</span>
                  <span className="text-zinc-200">{customer.joinedDate}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Subscription & Status
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Active Tier:</span>
                  <span className="font-semibold text-indigo-400">
                    {customer.plan}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Account Health:</span>
                  <span className="text-emerald-400 font-medium uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                    {customer.status}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Cumulative Revenue:</span>
                  <span className="font-mono font-medium text-white">
                    ${customer.lifetimeValue}.00 USD
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payments Ledger */}
        {activeTab === "payments" && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-3.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">
                Billing Transaction Ledger
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Showing {customerPayments.length} recent transactions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/90 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-4">Transaction ID</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Timestamp (UTC)</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {customerPayments.map((p) => {
                    const isDup =
                      p.id === duplicatePaymentId ||
                      (candidateDuplicate && candidateDuplicate.id === p.id);
                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isDup
                            ? "bg-amber-950/30 border-l-2 border-amber-500"
                            : "hover:bg-zinc-900/60"
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-zinc-300 font-medium">
                          {p.id}
                          {isDup && (
                            <span className="ml-2 inline-block text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 border border-amber-700/60">
                              Duplicate Flagged
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-white">
                          ${p.amount}.00 {p.currency}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {p.description}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                          {p.chargedAt}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                              p.status === "refunded"
                                ? "bg-purple-950/70 text-purple-300 border border-purple-800"
                                : "bg-emerald-950/70 text-emerald-300 border border-emerald-800"
                            }`}
                          >
                            {p.status}
                            {p.refundId && ` (${p.refundId})`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status === "captured" && (
                            <button
                              onClick={async () => {
                                try {
                                  await issueRefund(p.id, ticket.id);
                                } catch {
                                  /* Guard error is visible in toast. */
                                }
                              }}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Policy Documentation */}
        {activeTab === "policy" && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {relevantPolicy.title}
                </h4>
                <p className="text-xs text-zinc-400">
                  Category: {relevantPolicy.category} • Version:{" "}
                  {relevantPolicy.version}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-zinc-400">
                  Manager Sign-off Threshold:
                </span>
                <p className="font-mono text-xs font-semibold text-amber-400">
                  &gt; ${relevantPolicy.thresholdAmount}.00 USD
                </p>
              </div>
            </div>

            <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap bg-zinc-950/70 p-4 rounded-lg border border-zinc-800/80 leading-relaxed">
              {relevantPolicy.content}
            </pre>
          </div>
        )}

        {/* Approvals Banner if requested */}
        {ticketApproval && (
          <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <h5 className="text-xs font-semibold text-amber-200">
                  Manager Approval Request: {ticketApproval.id}
                </h5>
                <p className="text-xs text-amber-300/80">
                  Amount: ${ticketApproval.amount} • Reason:{" "}
                  {ticketApproval.reason} • Status:{" "}
                  <strong className="uppercase">{ticketApproval.status}</strong>
                </p>
              </div>
            </div>

            {ticketApproval.status === "pending" && (
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-900/60 text-amber-300 border border-amber-700">
                Awaiting Operations Lead
              </span>
            )}
          </div>
        )}

        {/* Communication Thread / Generated Reply */}
        {replyMessage && (
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mock Customer Confirmation
              </span>
              <span className="text-zinc-500 font-mono text-[10px]">
                Saved for {ticket.customerEmail}
              </span>
            </div>
            <p className="text-[11px] text-amber-300">
              {replySource?.mode === "fixture"
                ? "Offline demo fixture — no model inference"
                : `Nemotron on Nebius: ${replySource?.model || "unknown"}`}
            </p>
            <pre className="text-xs text-zinc-300 font-sans whitespace-pre-wrap bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
              {replyMessage}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
