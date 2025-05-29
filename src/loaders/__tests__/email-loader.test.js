import { createEmailLoader } from '../email-loader.js';
import { jest } from '@jest/globals';

describe('Email Loader', () => {
  let emailLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    emailLoader = createEmailLoader();
  });

  test('should validate email module correctly', () => {
    const validModule = {
      name: 'appEmail',
      templates: { welcome: { subject: 'Welcome' } },
    };
    expect(emailLoader.validate(validModule)).toBe(true);
  });

  test('should transform email module correctly', () => {
    const module = {
      name: 'appEmail',
      templates: { welcome: { subject: 'Welcome' } },
    };
    const transformed = emailLoader.transform(module);
    expect(transformed.name).toBe('appEmail');
    expect(transformed.templates.welcome.subject).toBe('Welcome');
  });

  test('should create email instance correctly', async () => {
    const module = {
      name: 'appEmail',
      templates: { welcome: { subject: 'Welcome' } },
    };
    const instance = await emailLoader.create(mockContext);
    expect(instance.send).toBeDefined();
    expect(instance.render).toBeDefined();
  });
}); 