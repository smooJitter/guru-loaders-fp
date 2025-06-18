import { withPlugins, withMiddleware, withValidation } from '../plugins.js';
import { pipeAsync } from '@/utils/async-pipeline-utils.js';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('loader-core/plugins', () => {
  let mockContext;
  let plugins;

  beforeEach(async () => {
    plugins = await import('../plugins.js');

    mockContext = {
      services: {
        logger: mockLogger
      },
      test: true
    };
  });

  describe('withPlugins', () => {
    it('should apply plugins in order', async () => {
      const mockLoader = jest.fn().mockResolvedValue({ context: mockContext });
      const plugin1 = {
        before: jest.fn().mockImplementation(ctx => ({ ...ctx, p1: true })),
        after: jest.fn().mockImplementation(ctx => ({ ...ctx, p1After: true }))
      };
      const plugin2 = {
        before: jest.fn().mockImplementation(ctx => ({ ...ctx, p2: true })),
        after: jest.fn().mockImplementation(ctx => ({ ...ctx, p2After: true }))
      };

      const wrappedLoader = plugins.withPlugins([plugin1, plugin2])(mockLoader);
      const result = await wrappedLoader(mockContext);

      expect(plugin1.before).toHaveBeenCalled();
      expect(plugin2.before).toHaveBeenCalled();
      expect(mockLoader).toHaveBeenCalled();
      expect(plugin1.after).toHaveBeenCalled();
      expect(plugin2.after).toHaveBeenCalled();
      expect(result.context).toEqual(expect.objectContaining({
        p1After: true,
        p2After: true,
        services: mockContext.services,
        test: true
      }));
    });

    it('should handle async plugins', async () => {
      const mockLoader = jest.fn().mockResolvedValue({ context: mockContext });
      const asyncPlugin = {
        before: jest.fn().mockImplementation(async ctx => ({ ...ctx, asyncBefore: true })),
        after: jest.fn().mockImplementation(async ctx => ({ ...ctx, asyncAfter: true }))
      };

      const wrappedLoader = plugins.withPlugins([asyncPlugin])(mockLoader);
      const result = await wrappedLoader(mockContext);

      expect(asyncPlugin.before).toHaveBeenCalled();
      expect(asyncPlugin.after).toHaveBeenCalled();
      expect(result.context).toEqual(expect.objectContaining({
        asyncAfter: true,
        services: mockContext.services,
        test: true
      }));
    });

    it('should handle plugin errors gracefully', async () => {
      const mockLoader = jest.fn().mockResolvedValue({ context: mockContext });
      const errorPlugin = {
        before: jest.fn(() => {
          throw new Error('Plugin error');
        })
      };

      const wrappedLoader = plugins.withPlugins([errorPlugin])(mockLoader);
      await expect(wrappedLoader(mockContext)).rejects.toThrow('Plugin error');
    });
  });

  describe('withMiddleware', () => {
    it('should apply middleware in order', async () => {
      const mockLoader = jest.fn(async ctx => ({ context: ctx }));
      const middleware1 = jest.fn().mockImplementation(ctx => ({ ...ctx, m1: true }));
      const middleware2 = jest.fn().mockImplementation(ctx => ({ ...ctx, m2: true }));

      const wrappedLoader = plugins.withMiddleware([middleware1, middleware2])(mockLoader);
      const result = await wrappedLoader(mockContext);

      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
      expect(mockLoader).toHaveBeenCalled();
      expect(result.context).toEqual({
        ...mockContext,
        m1: true,
        m2: true
      });
    });

    it('should handle async middleware', async () => {
      const mockLoader = jest.fn(async ctx => ({ context: ctx }));
      const asyncMiddleware = jest.fn(async ctx => ({ ...ctx, asyncM: true }));

      const wrappedLoader = plugins.withMiddleware([asyncMiddleware])(mockLoader);
      const result = await wrappedLoader(mockContext);

      expect(asyncMiddleware).toHaveBeenCalled();
      expect(result.context).toEqual({
        ...mockContext,
        asyncM: true
      });
    });

    it('should handle middleware errors gracefully', async () => {
      const mockLoader = jest.fn().mockResolvedValue({ context: mockContext });
      const errorMiddleware = jest.fn(() => {
        throw new Error('Middleware error');
      });

      const wrappedLoader = plugins.withMiddleware([errorMiddleware])(mockLoader);
      await expect(wrappedLoader(mockContext)).rejects.toThrow('Middleware error');
    });
  });

  describe('withValidation', () => {
    it('should validate modules correctly', async () => {
      const mockLoader = jest.fn().mockResolvedValue({ context: mockContext });
      const validator1 = jest.fn().mockResolvedValue(true);
      const validator2 = jest.fn().mockResolvedValue(true);

      const wrappedLoader = plugins.withValidation([validator1, validator2])(mockLoader);
      await wrappedLoader(mockContext);

      expect(validator1).toHaveBeenCalledWith(mockContext);
      expect(validator2).toHaveBeenCalledWith(mockContext);
      expect(mockLoader).toHaveBeenCalledWith(mockContext);
    });

    it('should handle validation failures', async () => {
      const mockLoader = jest.fn().mockResolvedValue({ context: mockContext });
      const validator = jest.fn().mockRejectedValue(new Error('Validation failed'));

      const wrappedLoader = plugins.withValidation([validator])(mockLoader);
      await expect(wrappedLoader(mockContext)).rejects.toThrow('Validation failed');

      expect(validator).toHaveBeenCalledWith(mockContext);
      expect(mockLoader).not.toHaveBeenCalled();
    });

    it('should handle async validators', async () => {
      const mockLoader = jest.fn().mockResolvedValue({ context: mockContext });
      const asyncValidator = jest.fn().mockResolvedValue(true);

      const wrappedLoader = plugins.withValidation([asyncValidator])(mockLoader);
      await wrappedLoader(mockContext);

      expect(asyncValidator).toHaveBeenCalledWith(mockContext);
      expect(mockLoader).toHaveBeenCalledWith(mockContext);
    });

    it('should handle validator errors gracefully', async () => {
      const mockLoader = jest.fn().mockResolvedValue({ context: mockContext });
      const errorValidator = jest.fn(() => { throw new Error('Validator error'); });

      const wrappedLoader = plugins.withValidation([errorValidator])(mockLoader);
      await expect(wrappedLoader(mockContext)).rejects.toThrow('Validator error');
    });
  });
}); 