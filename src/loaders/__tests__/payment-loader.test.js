import { createPaymentLoader } from '../payment-loader.js';
import { jest } from '@jest/globals';

describe('Payment Loader', () => {
  let paymentLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    paymentLoader = createPaymentLoader();
  });

  test('should validate payment module correctly', () => {
    const validModule = {
      name: 'appPayment',
      providers: { stripe: { apiKey: 'sk_test' } },
    };
    expect(paymentLoader.validate(validModule)).toBe(true);
  });

  test('should transform payment module correctly', () => {
    const module = {
      name: 'appPayment',
      providers: { stripe: { apiKey: 'sk_test' } },
    };
    const transformed = paymentLoader.transform(module);
    expect(transformed.name).toBe('appPayment');
    expect(transformed.providers.stripe.apiKey).toBe('sk_test');
  });

  test('should create payment instance correctly', async () => {
    const module = {
      name: 'appPayment',
      providers: { stripe: { apiKey: 'sk_test' } },
    };
    const instance = await paymentLoader.create(mockContext);
    expect(instance.charge).toBeDefined();
    expect(instance.refund).toBeDefined();
  });
}); 