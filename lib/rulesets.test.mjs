import * as rulesets from './rulesets.mjs';
import { describe, it, expect } from 'vitest';

/** @type {import('@rubicon2/object-transformer').options} */
const options = {
  omitRulelessKeys: true,
  omitEmptyStrings: true,
  pathSeparator: '.',
  nestedInputKeys: true,
  nestedOutputKeys: true,
};

describe('prisma object-transformer rulesets', () => {
  describe('get', () => {
    describe('take', () => {
      it('should create a key value pair on the output object that matches prisma expected format', () => {
        const output = {};
        rulesets.get.take({ output, key: 'take', value: '5', options });

        expect(output).toStrictEqual({
          take: 5,
        });
      });
    });

    describe('skip', () => {
      it('should create a key value pair on the output object that matches prisma expected format', () => {
        const output = {};
        rulesets.get.skip({ output, key: 'skip', value: '10', options });

        expect(output).toStrictEqual({
          skip: 10,
        });
      });
    });

    describe('cursor', () => {
      it('should create a key value pair on the output object that matches prisma expected format', () => {
        const output = {};
        rulesets.get.cursor({
          output,
          key: 'cursor',
          value: 'abc-123',
          options,
        });

        expect(output).toStrictEqual({
          cursor: {
            id: 'abc-123',
          },
        });
      });

      it('works correctly even if user has set a different option pathSeparator', () => {
        const output = {};
        rulesets.get.cursor({
          output,
          key: 'cursor',
          value: '25',
          options: {
            ...options,
            pathSeparator: '/',
          },
        });

        expect(output).toStrictEqual({
          cursor: {
            id: '25',
          },
        });
      });
    });

    describe('orderBy, sortOrder and _onFinish', () => {
      it.each([
        {
          name: 'orderBy param and no sortOrder params',
          input: {
            orderBy: 'date',
            sortOrder: undefined,
          },
          expectedOutput: {
            orderBy: [
              {
                date: 'asc',
              },
            ],
          },
        },
        {
          name: 'sortOrder param and no orderBy params',
          input: {
            orderBy: undefined,
            sortOrder: 'desc',
          },
          expectedOutput: {},
        },
        {
          name: 'orderBy params array and no sortOrder params',
          input: {
            orderBy: ['date', 'name'],
            sortOrder: undefined,
          },
          expectedOutput: {
            orderBy: [
              {
                date: 'asc',
              },
              {
                name: 'asc',
              },
            ],
          },
        },
        {
          name: 'sortOrder params array and no orderBy params',
          input: {
            orderBy: undefined,
            sortOrder: ['desc', 'asc', 'desc'],
          },
          expectedOutput: {},
        },
        {
          name: 'orderBy params array and sortOrder params array',
          input: {
            orderBy: ['date', 'name'],
            sortOrder: ['desc', 'asc', 'desc'],
          },
          expectedOutput: {
            orderBy: [
              {
                date: 'desc',
              },
              {
                name: 'asc',
              },
            ],
          },
        },
      ])(
        'correctly ties $name together and produces correct output with orderBy, sortOrder and _onFinish functions',
        ({ input, expectedOutput }) => {
          const output = {};

          rulesets.get.orderBy({
            input,
            output,
            key: 'orderBy',
            value: input.orderBy,
            options,
          });
          rulesets.get.sortOrder({
            input,
            output,
            key: 'sortOrder',
            value: input.sortOrder,
            options,
          });
          rulesets.get._onFinish({ input, output, options });
          delete output._temp;

          expect(output).toStrictEqual(expectedOutput);
        },
      );

      it('works with nested paths', () => {
        const input = {
          orderBy: [
            'my.nested.key',
            'another.nested.key1',
            'another.nested.key2',
          ],
          sortOrder: ['desc', 'asc', 'desc'],
        };
        const output = {};

        rulesets.get.orderBy({
          input,
          output,
          key: 'orderBy',
          value: input.orderBy,
          options,
        });
        rulesets.get.sortOrder({
          input,
          output,
          key: 'sortOrder',
          value: input.sortOrder,
          options,
        });

        rulesets.get._onFinish({ input, output, options });
        delete output._temp;

        expect(output).toStrictEqual({
          orderBy: [
            {
              my: {
                nested: {
                  key: 'desc',
                },
              },
            },
            {
              another: {
                nested: {
                  key1: 'asc',
                  key2: 'desc',
                },
              },
            },
          ],
        });
      });

      it('overwrites a duplicate key on the same object depth instead of creating an array, which is deepMerge default behaviour', () => {
        const input = {
          orderBy: ['my.nested.key', 'my.nested.key'],
          sortOrder: ['asc', 'desc'],
        };
        const output = {};

        rulesets.get.orderBy({
          input,
          output,
          key: 'orderBy',
          value: input.orderBy,
          options,
        });
        rulesets.get.sortOrder({
          input,
          output,
          key: 'sortOrder',
          value: input.sortOrder,
          options,
        });

        rulesets.get._onFinish({ input, output, options });
        delete output._temp;

        expect(output).toStrictEqual({
          orderBy: [
            {
              my: {
                nested: {
                  key: 'desc',
                },
              },
            },
          ],
        });
      });

      it('works correctly even if user has set a different option pathSeparator', () => {
        const customOptions = {
          ...options,
          pathSeparator: '/',
        };

        const output = {};
        rulesets.get.orderBy({
          output,
          key: 'orderBy',
          value: ['my/nested/key'],
          options,
        });
        rulesets.get.sortOrder({
          output,
          key: 'sortOrder',
          value: ['desc'],
          options,
        });

        // This is the only use of customOptions. Since orderBy and sortOrder just save the values in
        // _temp, it doesn't matter what pathSeparator they have since they don't use it.
        rulesets.get._onFinish({ input: {}, output, options: customOptions });
        delete output._temp;

        expect(output).toStrictEqual({
          orderBy: [
            {
              my: {
                nested: {
                  key: 'desc',
                },
              },
            },
          ],
        });
      });

      it.each([
        {
          name: 'orderBy and then sortOrder',
          input: {
            orderBy: ['my.nested.key', 'another.nested.key'],
            sortOrder: ['asc', 'desc'],
          },
          ruleOrder: ['orderBy', 'sortOrder'],
        },
        {
          name: 'sortOrder and then orderBy',
          input: {
            orderBy: ['my.nested.key', 'another.nested.key'],
            sortOrder: ['asc', 'desc'],
          },
          ruleOrder: ['sortOrder', 'orderBy'],
        },
      ])('can work in any order, running $name', ({ input, ruleOrder }) => {
        const output = {};

        for (const rule of ruleOrder) {
          rulesets.get[rule]({
            input,
            output,
            key: rule,
            value: input[rule],
            options,
          });
        }

        rulesets.get._onFinish({ input, output, options });
        delete output._temp;

        expect(output).toStrictEqual({
          orderBy: [
            {
              my: {
                nested: {
                  key: 'asc',
                },
              },
            },
            {
              another: {
                nested: {
                  key: 'desc',
                },
              },
            },
          ],
        });
      });

      it("doesn't throw an error if _onFinish is called without orderBy or sortOrder being run", () => {
        const input = {
          orderBy: ['my.nested.key', 'another.nested.key'],
          sortOrder: ['asc', 'desc'],
        };
        const output = {};

        expect(() =>
          rulesets.get._onFinish({ input, output, options }),
        ).not.toThrowError();
        expect(output).toStrictEqual({});
      });
    });
  });
});
