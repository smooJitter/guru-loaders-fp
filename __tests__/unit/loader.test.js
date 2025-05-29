import { createLoader } from '../../src/index.js';

describe('Loader Factory', () => {
  const mockContext = {
    logger: {
      error: jest.fn()
    }
  };

  it('should create a loader for a given type', () => {
    const loader = createLoader('model');
    expect(typeof loader).toBe('function');
  });

  it('should handle errors gracefully', async () => {
    const loader = createLoader('model');
    await expect(loader(mockContext)).rejects.toThrow();
    expect(mockContext.logger.error).toHaveBeenCalled();
  });
}); 