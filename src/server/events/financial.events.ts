import { EventEmitter } from 'events';

export const financialEvents = new EventEmitter();

export const FINANCIAL_EVENTS = {
  PAYMENT_ADDED: 'payment:added',
  EXPENSE_PAID: 'expense:paid',
  INCIDENT_UPDATED: 'incident:updated',
  INSTALLMENT_PAID: 'installment:paid',
};
