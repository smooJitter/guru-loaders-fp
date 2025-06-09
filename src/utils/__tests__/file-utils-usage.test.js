import { describe, it, expect } from '@jest/globals';
import * as fileUtils from '../file-utils.js';

describe('file-utils usage in a module', () => {
  it('should call findFiles and return an array', async () => {
    const files = await fileUtils.findFiles(['*.js']);
    expect(Array.isArray(files)).toBe(true);
  });
}); 