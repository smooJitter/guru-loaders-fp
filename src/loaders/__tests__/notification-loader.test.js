import { createNotificationLoader } from '../notification-loader.js';
import { jest } from '@jest/globals';

describe('Notification Loader', () => {
  let notificationLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    notificationLoader = createNotificationLoader();
  });

  test('should validate notification module correctly', () => {
    const validModule = {
      name: 'appNotification',
      channels: { email: { type: 'email' } },
    };
    expect(notificationLoader.validate(validModule)).toBe(true);
  });

  test('should transform notification module correctly', () => {
    const module = {
      name: 'appNotification',
      channels: { email: { type: 'email' } },
    };
    const transformed = notificationLoader.transform(module);
    expect(transformed.name).toBe('appNotification');
    expect(transformed.channels.email.type).toBe('email');
  });

  test('should create notification instance correctly', async () => {
    const module = {
      name: 'appNotification',
      channels: { email: { type: 'email' } },
    };
    const instance = await notificationLoader.create(mockContext);
    expect(instance.send).toBeDefined();
    expect(instance.subscribe).toBeDefined();
  });
}); 