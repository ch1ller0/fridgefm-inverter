import { createToken, declareContainer, CHILD_DI_FACTORY_TOKEN, injectable } from '../index'; // di entry
import type { FactoryOptions } from '../module/provider.types';

const ROOT_TOKEN = createToken<() => Readonly<[number, number, number]>>('root');
const V_1_TOKEN = createToken<number>('v-1');
const V_2_TOKEN = createToken<number>('v-2');

describe('container-declaration', () => {
  describe('errors', () => {
    it('ResolverError', () => {
      const container = declareContainer({
        providers: [
          injectable({
            provide: ROOT_TOKEN,
            useFactory:
              ({ v1 }) =>
              () =>
                [v1, 10, 10],
            deps: { v1: V_1_TOKEN },
          }),
          injectable({ provide: V_1_TOKEN, useFactory: ({ v2 }) => 10 + v2, deps: { v2: V_2_TOKEN } }),
        ],
      });
      expect(() => {
        container.get(ROOT_TOKEN);
      }).toThrowError('Token "v-2" is not provided, stack: v-1 -> v-2');
    });

    describe('CyclicDepError', () => {
      it('basic cycle', () => {
        const container = declareContainer({
          providers: [
            injectable({
              provide: ROOT_TOKEN,
              useFactory:
                ({ v1 }) =>
                () =>
                  [v1, 10, 10],
              deps: { v1: V_1_TOKEN },
            }),
            injectable({ provide: V_1_TOKEN, useFactory: ({ v2 }) => 10 + v2, deps: { v2: V_2_TOKEN } }),
            injectable({ provide: V_2_TOKEN, useFactory: ({ rootFn }) => rootFn()[0], deps: { rootFn: ROOT_TOKEN } }),
          ],
        });
        expect(() => {
          container.get(ROOT_TOKEN);
        }).toThrowError('Cyclic dependency for token: root, stack: root -> v-1 -> v-2 -> root');
      });

      it('long cycle', () => {
        const tokens = Array(100)
          .fill(undefined)
          .map((s, i) => createToken<unknown>(`t-${i}`));

        const container = declareContainer({
          providers: tokens.map((token, index) =>
            injectable({
              provide: token,
              useFactory: ({ v }) => v,
              // each token depends on the next one except for the last - it depends on first one, making a cycle
              deps: {
                v: tokens[index + 1] ? tokens[index + 1] : tokens[0],
              },
            }),
          ),
        });

        expect(() => {
          container.get(tokens[0]);
        }).toThrowError(
          `Cyclic dependency for token: t-0, stack: ${[...tokens, tokens[0]]
            .map((s) => s.symbol.description)
            .join(' -> ')}`,
        );
      });

      it('should not throw for edge case', () => {
        const container = declareContainer({
          providers: [
            injectable({
              provide: ROOT_TOKEN,
              useFactory:
                ({ v1, v2 }) =>
                () =>
                  [10, v1, v2],
              deps: { v1: V_1_TOKEN, v2: V_2_TOKEN },
            }),
            injectable({ provide: V_1_TOKEN, useFactory: () => 10 }),
            injectable({ provide: V_2_TOKEN, useFactory: ({ v1 }) => v1 + 5, deps: { v1: V_1_TOKEN } }),
          ],
        });
        expect(() => {
          container.get(ROOT_TOKEN);
        }).not.toThrowError();
      });
    });
  });

  describe('child-di-factory', () => {
    const CHILD_TOKEN = createToken<Readonly<[number, number, number]>>('child-token');

    const createProviders = ([v1scope, v2scope]: [FactoryOptions['scope'], FactoryOptions['scope']]) => {
      const childProvider = injectable({
        provide: CHILD_TOKEN,
        deps: { v1: V_1_TOKEN, v2: V_2_TOKEN, v2next: V_2_TOKEN },
        useFactory: ({ v1, v2, v2next }) => [v1, v2, v2next] as const,
      });

      const rootProvider = injectable({
        provide: ROOT_TOKEN,
        useFactory: ({ childDiFactory }) => {
          const childDi = childDiFactory(childProvider);
          return childDi;
        },
        deps: { childDiFactory: CHILD_DI_FACTORY_TOKEN } as const,
      });

      const createGetNumber = () => {
        let counter = 0;
        return () => {
          counter++;
          return counter * 100;
        };
      };

      const dep1provider = injectable({
        provide: V_1_TOKEN,
        useFactory: createGetNumber(),
        scope: v1scope,
      });

      const dep2provider = injectable({
        provide: V_2_TOKEN,
        useFactory: ({ v1 }) => v1 + 50,
        deps: { v1: V_1_TOKEN } as const,
        scope: v2scope,
      });

      return [rootProvider, dep1provider, dep2provider];
    };

    it('singleton/singleton', () => {
      const container = declareContainer({ providers: createProviders(['singleton', 'singleton']) });
      const values1 = container.get(ROOT_TOKEN)();
      const values2 = container.get(ROOT_TOKEN)();
      // v1 and v2 is the same for both calls
      expect(values1).toEqual([100, 150, 150]);
      expect(values2).toEqual([100, 150, 150]);
    });

    it('singleton/scoped', () => {
      const container = declareContainer({ providers: createProviders(['singleton', 'scoped']) });
      const values1 = container.get(ROOT_TOKEN)();
      const values2 = container.get(ROOT_TOKEN)();
      // v1 and v2 is the same for both calls
      expect(values1).toEqual([100, 150, 150]);
      expect(values2).toEqual([100, 150, 150]);
    });

    it('singleton/transient', () => {
      const container = declareContainer({ providers: createProviders(['singleton', 'transient']) });
      const values1 = container.get(ROOT_TOKEN)();
      const values2 = container.get(ROOT_TOKEN)();
      // v1 and v2 is the same for both calls
      expect(values1).toEqual([100, 150, 150]);
      expect(values2).toEqual([100, 150, 150]);
    });

    it('scoped/singleton', () => {
      const container = declareContainer({ providers: createProviders(['scoped', 'singleton']) });
      const values1 = container.get(ROOT_TOKEN)();
      const values2 = container.get(ROOT_TOKEN)();
      // this time v2 is the same for both but v1 is different
      expect(values1).toEqual([100, 250, 250]);
      expect(values2).toEqual([200, 250, 250]);
    });

    it('scoped/scoped', () => {
      const container = declareContainer({ providers: createProviders(['scoped', 'scoped']) });
      const values1 = container.get(ROOT_TOKEN)();
      const values2 = container.get(ROOT_TOKEN)();
      // v1 is cached between root calls
      expect(values1).toEqual([100, 150, 150]);
      expect(values2).toEqual([200, 250, 250]);
    });

    it('scoped/transient', () => {
      const container = declareContainer({ providers: createProviders(['scoped', 'transient']) });
      const values1 = container.get(ROOT_TOKEN)();
      const values2 = container.get(ROOT_TOKEN)();
      // v1 is cached between root calls
      expect(values1).toEqual([100, 150, 150]);
      expect(values2).toEqual([200, 250, 250]);
    });

    it('transient/singleton', () => {
      const container = declareContainer({ providers: createProviders(['transient', 'singleton']) });
      const values1 = container.get(ROOT_TOKEN)();
      const values2 = container.get(ROOT_TOKEN)();
      // v2 is the same, but v1 gets called 4 times
      expect(values1).toEqual([100, 250, 250]);
      expect(values2).toEqual([300, 250, 250]);
    });

    it('transient/scoped', () => {
      const container = declareContainer({ providers: createProviders(['transient', 'scoped']) });
      const values1 = container.get(ROOT_TOKEN)();
      const values2 = container.get(ROOT_TOKEN)();
      // v1 gets called 4 times instead of 2
      expect(values1).toEqual([100, 250, 250]);
      expect(values2).toEqual([300, 450, 450]);
    });

    it('transient/transient', () => {
      const container = declareContainer({ providers: createProviders(['transient', 'transient']) });
      const values1 = container.get(ROOT_TOKEN)();
      const values2 = container.get(ROOT_TOKEN)();
      // this time v2 gets called 4 times
      expect(values1).toEqual([100, 250, 350]);
      expect(values2).toEqual([400, 550, 650]);
    });

    it('checks if dependencies are all resolved', () => {
      const NEVER_TOKEN = createToken<number>('nothing');

      const dep1provider = injectable({
        provide: V_1_TOKEN,
        useFactory: ({ nothing }) => nothing,
        scope: 'scoped',
        deps: { nothing: NEVER_TOKEN },
      });

      const container = declareContainer({
        providers: [...createProviders(['scoped', 'scoped']), dep1provider],
      });
      try {
        container.get(ROOT_TOKEN)();
      } catch (e) {
        expect(e.message).toEqual('Token "nothing" is not provided, stack: v-1 -> nothing');
        expect(e.depStack).toEqual([V_1_TOKEN, NEVER_TOKEN]);
      }
    });
  });
});
