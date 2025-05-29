import { createWorkflowLoader } from '../workflow-loader.js';
import { jest } from '@jest/globals';

describe('Workflow Loader', () => {
  let workflowLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    workflowLoader = createWorkflowLoader();
  });

  test('should validate workflow module correctly', () => {
    const validModule = {
      name: 'appWorkflow',
      workflows: { onboarding: { steps: ['signup', 'profile'] } },
    };
    expect(workflowLoader.validate(validModule)).toBe(true);
  });

  test('should transform workflow module correctly', () => {
    const module = {
      name: 'appWorkflow',
      workflows: { onboarding: { steps: ['signup', 'profile'] } },
    };
    const transformed = workflowLoader.transform(module);
    expect(transformed.name).toBe('appWorkflow');
    expect(transformed.workflows.onboarding.steps).toContain('signup');
  });

  test('should create workflow instance correctly', async () => {
    const module = {
      name: 'appWorkflow',
      workflows: { onboarding: { steps: ['signup', 'profile'] } },
    };
    const instance = await workflowLoader.create(mockContext);
    expect(instance.start).toBeDefined();
    expect(instance.complete).toBeDefined();
  });
}); 