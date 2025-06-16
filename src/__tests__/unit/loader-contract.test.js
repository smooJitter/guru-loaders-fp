import { createModelLoader } from '../../loaders/model-loader.js';
import { createActionLoader2 } from '../../loaders/action-loader-2/index.js';

// Mock Mongoose model
const mockUserModel = { modelName: 'User', schema: {}, find: jest.fn() };
const mockPostModel = { modelName: 'Post', schema: {}, find: jest.fn() };

// Mock action modules
const mockActionModules = [
  {
    default: {
      user: {
        doSomething: (args) => `user did ${args.input}`,
      },
      post: {
        create: (args) => `post created: ${args.input}`,
      },
    },
  },
];

// Mock findFiles and importModule for models
const mockFindFilesModels = jest.fn(() => ['User.model.js', 'Post.model.js']);
const mockImportModuleModels = jest.fn((file) => {
  if (file === 'User.model.js') return { default: () => mockUserModel };
  if (file === 'Post.model.js') return { default: () => mockPostModel };
  return {};
});

// Mock findFiles and importModule for actions
const mockFindFilesActions = jest.fn(() => ['user.actions.js']);
const mockImportModuleActions = jest.fn(() => mockActionModules[0]);


describe('Loader contract: context population', () => {
  it('should populate context.models with expected Mongoose models', async () => {
    const context = { logger: console };
    const loader = createModelLoader(
      {},
      {
        findFiles: mockFindFilesModels,
        importModule: mockImportModuleModels,
      }
    );
    const result = await loader(context);
    expect(result.context.models).toHaveProperty('User');
    expect(result.context.models).toHaveProperty('Post');
    expect(result.context.models.User).toBe(mockUserModel);
    expect(result.context.models.Post).toBe(mockPostModel);
  });

  it('should populate context.actions with expected actions', async () => {
    const context = { logger: console, services: { logger: console } };
    const loader = createActionLoader2({
      findFiles: mockFindFilesActions,
      importModule: mockImportModuleActions,
    });
    const result = await loader(context);
    expect(result.context.actions).toHaveProperty('user');
    expect(result.context.actions).toHaveProperty('post');
    expect(typeof result.context.actions.user.doSomething).toBe('function');
    expect(typeof result.context.actions.post.create).toBe('function');
    // Test action execution
    expect(result.context.actions.user.doSomething({ input: 'something' })).toContain('user did something');
    expect(result.context.actions.post.create({ input: 'foo' })).toContain('post created: foo');
  });
}); 