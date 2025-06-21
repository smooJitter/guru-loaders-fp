import actions from '../billing-invoice-query.actions.js';

describe('billing-invoice-query.actions', () => {
  let context;
  let InvoiceMock;

  beforeEach(() => {
    InvoiceMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn()
    };
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

  it('should get invoice by Stripe ID (happy path)', async () => {
    InvoiceMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'inv_1', stripeInvoiceId: 'stripe_123', __v: 0 }) }) });
    const input = { context, stripeInvoiceId: 'stripe_123' };
    const result = await findAction('getInvoiceByStripeId')(input);
    expect(result).toMatchObject({ _id: 'inv_1', stripeInvoiceId: 'stripe_123' });
    expect(result.__v).toBeUndefined();
  });

  it('should return null if invoice by Stripe ID not found (edge case)', async () => {
    InvoiceMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
    const input = { context, stripeInvoiceId: 'stripe_404' };
    const result = await findAction('getInvoiceByStripeId')(input);
    expect(result).toBeNull();
  });

  it('should throw if stripeInvoiceId is missing (fail path)', async () => {
    const input = { context };
    await expect(findAction('getInvoiceByStripeId')(input)).rejects.toThrow();
  });

  it('should get invoices by user (happy path)', async () => {
    InvoiceMock.find.mockReturnValueOnce({ sort: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'inv_1', userId: 'user1', __v: 0 }]) }) }) });
    const input = { context, userId: 'user1' };
    const result = await findAction('getInvoicesByUser')(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject({ _id: 'inv_1', userId: 'user1' });
    expect(result[0].__v).toBeUndefined();
  });

  it('should return empty array if user has no invoices (edge case)', async () => {
    InvoiceMock.find.mockReturnValueOnce({ sort: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) });
    const input = { context, userId: 'user2' };
    const result = await findAction('getInvoicesByUser')(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should throw if userId is missing for getInvoicesByUser (fail path)', async () => {
    const input = { context };
    await expect(findAction('getInvoicesByUser')(input)).rejects.toThrow();
  });

  it('should get invoice by ID (happy path)', async () => {
    InvoiceMock.findById.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'inv_1', __v: 0 }) }) });
    const input = { context, id: 'inv_1' };
    const result = await findAction('getInvoiceById')(input);
    expect(result).toMatchObject({ _id: 'inv_1' });
    expect(result.__v).toBeUndefined();
  });

  it('should throw if invoice by ID not found (fail path)', async () => {
    InvoiceMock.findById.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
    const input = { context, id: 'inv_404' };
    await expect(findAction('getInvoiceById')(input)).rejects.toThrow('Invoice not found');
  });

  it('should throw if id is missing for getInvoiceById (fail path)', async () => {
    const input = { context };
    await expect(findAction('getInvoiceById')(input)).rejects.toThrow();
  });

  it('should list open invoices (happy path)', async () => {
    InvoiceMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'inv_1', status: 'open', __v: 0 }]) }) }) }) }) });
    InvoiceMock.countDocuments.mockResolvedValueOnce(1);
    const input = { context };
    const result = await findAction('listOpenInvoices')(input);
    expect(result.items[0]).toMatchObject({ _id: 'inv_1', status: 'open' });
    expect(result.items[0].__v).toBeUndefined();
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('should list open invoices with pagination (edge case)', async () => {
    InvoiceMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'inv_1', status: 'open', __v: 0 }, { _id: 'inv_2', status: 'open', __v: 0 }]) }) }) }) }) });
    InvoiceMock.countDocuments.mockResolvedValueOnce(5);
    const input = { context, limit: 2, offset: 0 };
    const result = await findAction('listOpenInvoices')(input);
    expect(result.items.length).toBe(2);
    expect(result.hasMore).toBe(true);
  });

  it('should handle error in listOpenInvoices (fail path)', async () => {
    InvoiceMock.find.mockImplementationOnce(() => { throw new Error('DB error'); });
    const input = { context };
    await expect(findAction('listOpenInvoices')(input)).rejects.toThrow('DB error');
  });

  it('should list paid invoices (happy path)', async () => {
    InvoiceMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'inv_2', status: 'paid', __v: 0 }]) }) }) }) }) });
    InvoiceMock.countDocuments.mockResolvedValueOnce(1);
    const input = { context };
    const result = await findAction('listPaidInvoices')(input);
    expect(result.items[0]).toMatchObject({ _id: 'inv_2', status: 'paid' });
    expect(result.items[0].__v).toBeUndefined();
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('should list paid invoices with date range (edge case)', async () => {
    InvoiceMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'inv_2', status: 'paid', paidAt: new Date('2024-01-01'), __v: 0 }]) }) }) }) }) });
    InvoiceMock.countDocuments.mockResolvedValueOnce(1);
    const input = { context, startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') };
    const result = await findAction('listPaidInvoices')(input);
    expect(result.items[0].status).toBe('paid');
    expect(result.items[0].paidAt).toBeInstanceOf(Date);
  });

  it('should handle error in listPaidInvoices (fail path)', async () => {
    InvoiceMock.find.mockImplementationOnce(() => { throw new Error('DB error'); });
    const input = { context };
    await expect(findAction('listPaidInvoices')(input)).rejects.toThrow('DB error');
  });

  it('should list overdue invoices (happy path)', async () => {
    InvoiceMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'inv_3', status: 'open', __v: 0 }]) }) }) }) }) });
    InvoiceMock.countDocuments.mockResolvedValueOnce(1);
    const input = { context };
    const result = await findAction('listOverdueInvoices')(input);
    expect(result.items[0]).toMatchObject({ _id: 'inv_3', status: 'open' });
    expect(result.items[0].__v).toBeUndefined();
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('should return empty array for overdue invoices if none found (edge case)', async () => {
    InvoiceMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) });
    InvoiceMock.countDocuments.mockResolvedValueOnce(0);
    const input = { context };
    const result = await findAction('listOverdueInvoices')(input);
    expect(result.items.length).toBe(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('should handle error in listOverdueInvoices (fail path)', async () => {
    InvoiceMock.find.mockImplementationOnce(() => { throw new Error('DB error'); });
    const input = { context };
    await expect(findAction('listOverdueInvoices')(input)).rejects.toThrow('DB error');
  });

  it('should search invoices (happy path)', async () => {
    InvoiceMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'inv_4', invoiceNumber: 'INV-100', __v: 0 }]) }) }) }) }) });
    InvoiceMock.countDocuments.mockResolvedValueOnce(1);
    const input = { context, query: 'INV-100' };
    const result = await findAction('searchInvoices')(input);
    expect(result.items[0]).toMatchObject({ _id: 'inv_4', invoiceNumber: 'INV-100' });
    expect(result.items[0].__v).toBeUndefined();
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('should return empty array for search if no invoices found (edge case)', async () => {
    InvoiceMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) });
    InvoiceMock.countDocuments.mockResolvedValueOnce(0);
    const input = { context, query: 'NO_MATCH' };
    const result = await findAction('searchInvoices')(input);
    expect(result.items.length).toBe(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('should handle error in searchInvoices (fail path)', async () => {
    InvoiceMock.find.mockImplementationOnce(() => { throw new Error('DB error'); });
    const input = { context, query: 'ANY' };
    await expect(findAction('searchInvoices')(input)).rejects.toThrow('DB error');
  });

  it('should throw if context is missing (fail path)', async () => {
    const input = { stripeInvoiceId: 'stripe_123' };
    await expect(findAction('getInvoiceByStripeId')(input)).rejects.toThrow();
  });
}); 