import { loggingHook } from '../loggingHook';

describe('loggingHook', () => {
  it('should log the provided message', () => {
    const mockLogger = { info: jest.fn() };
    const context = { logger: mockLogger };
    const message = 'Test message';

    loggingHook(context, message);

    expect(mockLogger.info).toHaveBeenCalledWith(message);
  });
}); 