import * as rules from './rules.mjs';
import transformer from '@rubicon2/object-transformer';
import { describe, it, expect } from 'vitest';

const input = {
  myKey: 'my value',
  my: {
    nested: {
      key: 'my nested value',
    },
  },
  myDate: '2020-12-25',
};

/** @type {import('@rubicon2/object-transformer').options} */
const options = {
  omitRulelessKeys: true,
  omitEmptyStrings: true,
};

describe('rules', () => {
  describe.each(
    Object.keys(rules).map((rule) => ({
      name: rule,
      rule: rules[rule],
    })),
  )('$name rule', ({ rule }) => {
    it('should be of type function', () => {
      expect(typeof rule).toStrictEqual('function');
    });

    it('should return a function', () => {
      expect(typeof rule()).toStrictEqual('function');
    });
  });

  describe('copyIncludes', () => {
    it('should create a value on the output object that matches prisma expected format', () => {
      const ruleset = {
        myKey: rules.copyIncludes(),
      };

      const t = transformer(ruleset, options);
      const output = t(input);

      expect(output).toStrictEqual({
        myKey: {
          contains: 'my value',
        },
      });
    });
  });

  describe('copyIncludesInsensitive', () => {
    it('should create a value on the output object that matches prisma expected format', () => {
      const ruleset = {
        myKey: rules.copyIncludesInsensitive(),
      };

      const t = transformer(ruleset, options);
      const output = t(input);

      expect(output).toStrictEqual({
        myKey: {
          contains: 'my value',
          mode: 'insensitive',
        },
      });
    });
  });
});
