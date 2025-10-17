import transformer, { copy } from '@rubicon2/object-transformer';
import { rulesets, options } from '../index.js';
import { describe, it, expect } from 'vitest';

// How to do a proper integration test with prisma client?
// Probably have to do a docker container with a postgres database,
// and then migrate prisma schema to it.

describe('object-transformer-prisma', () => {
  describe('rulesets', () => {
    it.each(
      Object.keys(rulesets).map((ruleset) => ({
        name: ruleset,
        ruleset: rulesets[ruleset],
      })),
    )('$name ruleset should be of type object', ({ ruleset }) => {
      expect(typeof ruleset).toStrictEqual('object');
    });

    describe('get', () => {
      it('should format output object with standard properties as expected by prisma', () => {
        const t = transformer(rulesets.get, options);
        // I.e. the body or query object on an express request object.
        const input = {
          take: '5',
          skip: '10',
          cursor: '25',
          orderBy: ['date', 'name'],
          sortOrder: 'desc',
          ignoreMe: 'this should not appear in the output',
        };
        const outputObj = t(input);
        expect(outputObj).toStrictEqual({
          take: 5,
          skip: 10,
          cursor: { id: 25 },
          orderBy: [{ date: 'desc' }, { name: 'asc' }],
        });
      });

      it('should be able to extend rules', () => {
        const extendedRules = {
          ...rulesets.get,
          myKey: copy(),
          _onFinish: ({ input, output, options }) => {
            rulesets.get._onFinish({ input, output, options });
            // Whatever I want to do after get ruleset's _onFinished is done goes here.
            output.myExtendedFinish = 'my extended finish results';
          },
        };

        const t = transformer(extendedRules, options);

        const input = {
          take: '5',
          skip: '10',
          cursor: '25',
          orderBy: ['date', 'name'],
          sortOrder: 'desc',
          myKey: 'my value',
          ignoreMe: 'this should not appear in the output',
        };

        const outputObj = t(input);
        expect(outputObj).toStrictEqual({
          take: 5,
          skip: 10,
          cursor: { id: 25 },
          orderBy: [{ date: 'desc' }, { name: 'asc' }],
          myKey: 'my value',
          myExtendedFinish: 'my extended finish results',
        });
      });
    });
  });
});
