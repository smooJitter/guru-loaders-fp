import actions from '../billing-invoice-mutation.actions.js';
import { validate } from '../../../utils/validate.js';
import * as yup from 'yup';

describe('billing-invoice-mutation.actions', () => {
  let context;
  let InvoiceMock;
  let saveMock;

  beforeEach(() => {
    saveMock = jest.fn();
    // InvoiceMock is a constructor function
    InvoiceMock = function (data) {
      Object.assign(this, data);
    };
    InvoiceMock.prototype.save = saveMock;
    InvoiceMock.findByIdAndUpdate = jest.fn();
    InvoiceMock.updateMany = jest.fn();

    context = {
      models: {
        Invoice: InvoiceMock
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const findAction = (name) => actions.find(a => a.name === name).method;

  it('should create an invoice (happy path)', async () => {
    const input = {
      context,
      userId: 'user1',
      stripeInvoiceId: 'stripe_123',
      amountDue: 100,
      invoiceId: 'inv_1',
    };
    saveMock.mockResolvedValueOnce({ toObject: () => ({ ...input, __v: 0 }) });
    const result = await findAction('createInvoice')(input);
    expect(result).toMatchObject({ userId: 'user1', stripeInvoiceId: 'stripe_123', amountDue: 100, invoiceId: 'inv_1' });
    expect(result.__v).toBeUndefined();
  });

  it('should fail to create an invoice with missing fields (fail path)', async () => {
    const input = { context };
    await expect(findAction('createInvoice')(input)).rejects.toThrow();
  });

  it('should update an invoice (happy path)', async () => {
    InvoiceMock.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'inv_1', amountDue: 200, __v: 0 }) }) });
    const input = { context, id: 'inv_1', data: { amountDue: 200 } };
    const result = await findAction('updateInvoice')(input);
    expect(result).toMatchObject({ _id: 'inv_1', amountDue: 200 });
    expect(result.__v).toBeUndefined();
  });

  it('should throw if updating a non-existent invoice (fail path)', async () => {
    InvoiceMock.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
    const input = { context, id: 'inv_404', data: { amountDue: 200 } };
    await expect(findAction('updateInvoice')(input)).rejects.toThrow('Invoice not found');
  });

  it('should mark an invoice as paid (happy path)', async () => {
    InvoiceMock.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'inv_1', status: 'paid', __v: 0 }) }) });
    const input = { context, id: 'inv_1', paymentData: { method: 'card' } };
    const result = await findAction('markInvoiceAsPaid')(input);
    expect(result.status).toBe('paid');
    expect(result.__v).toBeUndefined();
  });

  it('should throw if marking a non-existent invoice as paid (fail path)', async () => {
    InvoiceMock.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
    const input = { context, id: 'inv_404', paymentData: { method: 'card' } };
    await expect(findAction('markInvoiceAsPaid')(input)).rejects.toThrow('Invoice not found');
  });

  it('should mark an invoice as overdue (happy path)', async () => {
    InvoiceMock.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'inv_1', status: 'overdue', __v: 0 }) }) });
    const input = { context, id: 'inv_1' };
    const result = await findAction('markInvoiceAsOverdue')(input);
    expect(result.status).toBe('overdue');
    expect(result.__v).toBeUndefined();
  });

  it('should throw if marking a non-existent invoice as overdue (fail path)', async () => {
    InvoiceMock.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
    const input = { context, id: 'inv_404' };
    await expect(findAction('markInvoiceAsOverdue')(input)).rejects.toThrow('Invoice not found');
  });

  it('should cancel an invoice (happy path)', async () => {
    InvoiceMock.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'inv_1', status: 'cancelled', __v: 0 }) }) });
    const input = { context, id: 'inv_1', reason: 'Customer request' };
    const result = await findAction('cancelInvoice')(input);
    expect(result.status).toBe('cancelled');
    expect(result.__v).toBeUndefined();
  });

  it('should throw if cancelling a non-existent invoice (fail path)', async () => {
    InvoiceMock.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
    const input = { context, id: 'inv_404', reason: 'Customer request' };
    await expect(findAction('cancelInvoice')(input)).rejects.toThrow('Invoice not found');
  });

  it('should void an invoice (happy path)', async () => {
    InvoiceMock.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'inv_1', status: 'void', __v: 0 }) }) });
    const input = { context, id: 'inv_1', reason: 'Duplicate' };
    const result = await findAction('voidInvoice')(input);
    expect(result.status).toBe('void');
    expect(result.__v).toBeUndefined();
  });

  it('should throw if voiding a non-existent invoice (fail path)', async () => {
    InvoiceMock.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
    const input = { context, id: 'inv_404', reason: 'Duplicate' };
    await expect(findAction('voidInvoice')(input)).rejects.toThrow('Invoice not found');
  });

  it('should bulk update invoices (happy path)', async () => {
    InvoiceMock.updateMany.mockResolvedValueOnce({ matchedCount: 2, modifiedCount: 2 });
    const input = { context, ids: ['inv_1', 'inv_2'], data: { status: 'paid' } };
    const result = await findAction('bulkUpdateInvoices')(input);
    expect(result).toEqual({ matched: 2, modified: 2 });
  });

  it('should throw on bulk update with empty ids (edge case)', async () => {
    const input = { context, ids: [], data: { status: 'paid' } };
    await expect(findAction('bulkUpdateInvoices')(input)).rejects.toThrow();
  });

  it('should bulk mark invoices as paid (happy path)', async () => {
    InvoiceMock.updateMany.mockResolvedValueOnce({ matchedCount: 3, modifiedCount: 3 });
    const input = { context, ids: ['inv_1', 'inv_2', 'inv_3'], paymentData: { method: 'card' } };
    const result = await findAction('bulkMarkAsPaid')(input);
    expect(result).toEqual({ matched: 3, modified: 3 });
  });

  it('should throw on bulk mark as paid with empty ids (edge case)', async () => {
    const input = { context, ids: [], paymentData: { method: 'card' } };
    await expect(findAction('bulkMarkAsPaid')(input)).rejects.toThrow();
  });
}); 