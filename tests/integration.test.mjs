import transformer, { copy } from '@rubicon2/object-transformer';
import { rulesets, options } from '../index.js';
import { PrismaClient } from '../generated/prisma/client';
import { users, files } from './setup.mjs';
import { describe, it, expect } from 'vitest';

const db = new PrismaClient();

// What should I be comparing against prisma's result from transformed query?
// A manually created/formatter query everytime? Or just comparing data?
// I chose to compare data, cuz if some aspect of the prisma client API changes,
// re-writing these tests will be a pain. Whereas, if I am just comparing
// the prisma query result against expected data, only the transformer ruleset
// implementation will have to change - not the tests.

// Will need to use toMatchObject instead of toStrictEqual - since test db has
// createdAt and updatedAt values which prisma automatically adds, but those
// properties won't be present in the test data we will be comparing against.

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
      // Common rules we want to test, if anything needs changing for a particular test just create a new transformer.
      const t = transformer(rulesets.get, options);

      it('transformer output should not cause an error when given to prisma e.g. in findMany call', () => {
        // I.e. the body or query object on an express request object.
        const input = {
          take: '5',
          skip: '10',
          cursor: 'abc-123',
          orderBy: ['createdAt', 'updatedAt'],
          sortOrder: 'desc',
          ignoreMe: 'this should not appear in the output',
        };
        const query = t(input);
        expect(async () => await db.user.findMany(query)).not.toThrow();
      });

      it('should be able to extend rules', () => {
        // Just to test end user experience, not interactions with prisma.
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
          cursor: 'abc-123',
          orderBy: ['email', 'first_name'],
          sortOrder: 'desc',
          myKey: 'my value',
          ignoreMe: 'this should not appear in the output',
        };

        const outputObj = t(input);
        expect(outputObj).toStrictEqual({
          take: 5,
          skip: 10,
          cursor: { id: 'abc-123' },
          orderBy: [{ email: 'desc' }, { first_name: 'asc' }],
          myKey: 'my value',
          myExtendedFinish: 'my extended finish results',
        });
      });

      it.each([
        {
          take: '1',
          expectedOutputLength: 1,
        },
        {
          take: '2',
          expectedOutputLength: 2,
        },
      ])(
        'take: $take limits the number of results to $expectedOutputLength',
        async ({ take, expectedOutputLength }) => {
          const input = { take };
          const query = t(input);
          const output = await db.user.findMany(query);
          expect(output).toMatchObject(
            users.filter((user, index) => index < take),
          );
          expect(output.length).toStrictEqual(expectedOutputLength);
        },
      );

      it.each([
        {
          skip: '1',
          expectedOutput: users.filter((user, index) => index >= 1),
        },
        {
          skip: '2',
          expectedOutput: users.filter((user, index) => index >= 2),
        },
      ])(
        'skip: $skip skips $skip results',
        async ({ skip, expectedOutput }) => {
          // Might need to sort by id to make sure results are in the same order every time?
          // Seems fine now, but if tests start randomly failing try that first.
          const input = { skip };
          const query = t(input);
          const output = await db.user.findMany(query);
          expect(output).toMatchObject(expectedOutput);
        },
      );

      it('cursor: can be used for cursor-based pagination', async () => {
        // Get initial result, which will function as our cursor.
        const initialResult = await db.user.findFirst({
          orderBy: {
            id: 'asc',
          },
        });
        const input = { cursor: initialResult.id };
        const query = t(input);
        const output = await db.user.findMany({
          ...query,
          // Add this stuff here manually instead of as part of input.
          // We want to test object-transformer ruleset for cursor property only.
          // We aren't trying to test skip and orderBy transformer rules here.
          skip: 1,
          orderBy: {
            id: 'asc',
          },
        });
        expect(output).toMatchObject(
          users
            .toSorted((a, b) => a.id.localeCompare(b.id))
            .filter((a, index) => index >= 1),
        );
      });

      describe('orderBy', () => {
        it('works with a string input', async () => {
          const input = { orderBy: 'email' };
          const query = t(input);
          const output = await db.user.findMany(query);
          console.log(output);
          expect(output).toMatchObject(
            users.toSorted((a, b) => a.email.localeCompare(b.email)),
          );
        });

        it('works with an array of strings for input', async () => {
          const input = { orderBy: ['last_name', 'first_name'] };
          const query = t(input);
          const output = await db.user.findMany(query);
          expect(output).toMatchObject(
            users
              .toSorted((a, b) => a.first_name.localeCompare(b.first_name))
              .toSorted((a, b) => a.last_name.localeCompare(b.last_name)),
          );
        });
      });

      describe('sortOrder, in conjunction with orderBy', async () => {
        it('works with a string input', async () => {
          const input = { orderBy: 'first_name', sortOrder: 'desc' };
          const query = t(input);
          const output = await db.user.findMany(query);
          expect(output).toMatchObject(
            users.toSorted((a, b) => b.first_name.localeCompare(a.first_name)),
          );
        });

        it('works with an array of strings for input', async () => {
          const input = {
            orderBy: ['last_name', 'first_name'],
            sortOrder: ['desc', 'desc'],
          };
          const query = t(input);
          const output = await db.user.findMany(query);
          expect(output).toMatchObject(
            users
              .toSorted((a, b) => b.first_name.localeCompare(a.first_name))
              .toSorted((a, b) => b.last_name.localeCompare(a.last_name)),
          );
        });
      });
    });
  });
});
