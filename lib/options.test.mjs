import options from './options.mjs';
import { describe, it, expect } from 'vitest';

// Options should be highly customizable. Override defaults, or create new options
// for use in your own rules. Therefore, there will be no checks on what options
// are present or the types of values stored.
describe('options', () => {
  it('options should be of type object', () => {
    expect(typeof options).toStrictEqual('object');
  });
});
