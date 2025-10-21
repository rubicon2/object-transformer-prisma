import options from './options.mjs';
import { describe, it, expect } from 'vitest';

describe('prisma object-transformer options', () => {
  it('options should be of type object', () => {
    expect(typeof options).toStrictEqual('object');
  });

  it('should omit ruleless keys', () => {
    expect(options.omitRulelessKeys).toStrictEqual(true);
  });

  it('should omit empty strings', () => {
    expect(options.omitEmptyStrings).toStrictEqual(true);
  });
});
