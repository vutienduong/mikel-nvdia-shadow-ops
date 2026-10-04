import { SkillDefinition } from '../types';

export const SKILL_REGISTRY: Record<string, SkillDefinition> = {
  find_customer: {
    id: 'find_customer',
    name: 'Find customer',
    description: 'Retrieve customer account profile and subscription tier by ID or email',
    riskLevel: 'low',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'Unique customer identifier' },
      },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        customer: { type: 'object', description: 'Customer details' },
      },
    },
  },

  get_recent_payments: {
    id: 'get_recent_payments',
    name: 'Get recent payments',
    description: 'Fetch recent billing transactions and invoice records for a customer',
    riskLevel: 'low',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        limit: { type: 'number', default: 10 },
      },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        payments: { type: 'array' },
      },
    },
  },

  detect_duplicate_payment: {
    id: 'detect_duplicate_payment',
    name: 'Detect duplicate payment',
    description: 'Evaluate transaction history to identify matching charges within temporal proximity',
    riskLevel: 'low',
    inputSchema: {
      type: 'object',
      properties: {
        payments: { type: 'array' },
        windowMinutes: { type: 'number', default: 60 },
      },
      required: ['payments'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        isDuplicate: { type: 'boolean' },
        duplicatedPayment: { type: 'object' },
        originalPayment: { type: 'object' },
        confidence: { type: 'number' },
      },
    },
  },

  check_refund_policy: {
    id: 'check_refund_policy',
    name: 'Check refund policy',
    description: 'Verify eligibility against corporate refund guidelines and thresholds',
    riskLevel: 'low',
    inputSchema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string' },
        amount: { type: 'number' },
      },
      required: ['amount'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        eligible: { type: 'boolean' },
        requiresApproval: { type: 'boolean' },
        threshold: { type: 'number' },
      },
    },
  },

  request_manager_approval: {
    id: 'request_manager_approval',
    name: 'Request manager approval',
    description: 'Dispatch high-value or exception refund request to operations manager queue',
    riskLevel: 'medium',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string' },
        amount: { type: 'number' },
        reason: { type: 'string' },
      },
      required: ['ticketId', 'amount'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        approvalId: { type: 'string' },
        status: { type: 'string' },
      },
    },
  },

  refund_payment: {
    id: 'refund_payment',
    name: 'Refund payment',
    description: 'Execute transaction refund in billing gateway and record refund receipt',
    riskLevel: 'medium',
    inputSchema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['paymentId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        refundId: { type: 'string' },
        status: { type: 'string' },
        amountRefunded: { type: 'number' },
      },
    },
  },

  draft_customer_reply: {
    id: 'draft_customer_reply',
    name: 'Draft customer reply',
    description: 'Generate empathetic and accurate operational response with refund details',
    riskLevel: 'low',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string' },
        customerName: { type: 'string' },
        refundAmount: { type: 'number' },
        refundId: { type: 'string' },
      },
      required: ['ticketId', 'customerName'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        replyText: { type: 'string' },
      },
    },
  },

  send_customer_reply: {
    id: 'send_customer_reply',
    name: 'Send customer reply',
    description: 'Send support email to customer and update communications thread',
    riskLevel: 'low',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['ticketId', 'message'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        delivered: { type: 'boolean' },
        timestamp: { type: 'string' },
      },
    },
  },

  close_ticket: {
    id: 'close_ticket',
    name: 'Close ticket',
    description: 'Update ticket resolution status to closed and append audit trail',
    riskLevel: 'low',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string' },
        resolutionNote: { type: 'string' },
      },
      required: ['ticketId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string' },
        status: { type: 'string' },
      },
    },
  },
};
