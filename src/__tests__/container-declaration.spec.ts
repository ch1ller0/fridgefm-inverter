import { createToken, declareContainer, CHILD_DI_FACTORY_TOKEN, injectable, modifyToken } from '../index'; // di entry
import type { FactoryOptions } from '../module/provider.types';

const ROOT_TOKEN = createToken<() => Readonly<[number, number, number]>>('root');
const V_1_TOKEN = createToken<number>('v-1');
const V_2_TOKEN = createToken<number>('v-2');

describe('container-declaration', () => {
  it('simple chain', () => {
    const v1token = createToken<{ a: number; b: number }>('value1');
    const v2token = createToken<{ a: number; c: number }>('value2');
    const f1token = createToken<{ a: number; b: number; c: number }>('factory1');
    const f2token = createToken<{ a: number; b: number; c: number }>('factory2');
    const v1provider = injectable({ provide: v1token, useValue: { a: 1, b: 2 } });
    const v2provider = injectable({ provide: v2token, useValue: { a: 2, c: 3 } });
    const f1provider = injectable({
      provide: f1token,
      inject: [v1token, v2token] as const,
      useFactory: (v1, v2) => ({
        a: v1.a + v2.a,
        b: v1.b + 10,
        c: v2.c + 20,
      }),
    });
    const f2provider = injectable({
      provide: f2token,
      inject: [f1token] as const,
      useFactory: (v1) => ({
        a: v1.a + 10,
        b: v1.b + 20,
        c: v1.c + 30,
      }),
    });
    const providers = [v1provider, v2provider, f1provider, f2provider];

    const cont1 = declareContainer({ providers });
    expect(cont1.get(f1token)).toEqual({ a: 3, b: 12, c: 23 });
    expect(cont1.get(f2token)).toEqual({ a: 13, b: 32, c: 53 });

    const cont2 = declareContainer({ providers: providers.reverse() });
    expect(cont2.get(f1token)).toEqual({ a: 3, b: 12, c: 23 });
    expect(cont2.get(f2token)).toEqual({ a: 13, b: 32, c: 53 });
  });

  describe('errors', () => {
    it('ResolverError', () => {
      const container = declareContainer({
        providers: [
          injectable({ provide: ROOT_TOKEN, useFactory: (v1) => () => [v1, 10, 10], inject: [V_1_TOKEN] }),
          injectable({ provide: V_1_TOKEN, useFactory: (v2) => 10 + v2, inject: [V_2_TOKEN] }),
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
            injectable({ provide: ROOT_TOKEN, useFactory: (v1) => () => [v1, 10, 10], inject: [V_1_TOKEN] }),
            injectable({ provide: V_1_TOKEN, useFactory: (v2) => 10 + v2, inject: [V_2_TOKEN] }),
            injectable({ provide: V_2_TOKEN, useFactory: (rootFn) => rootFn()[0], inject: [ROOT_TOKEN] }),
          ],
        });
        expect(() => {
          container.get(ROOT_TOKEN);
        }).toThrowError('Cyclic dependency for token: root, stack: root -> v-1 -> v-2 -> root');

        try {
          container.get(ROOT_TOKEN);
        } catch (e) {
          expect(e.depStack.map((s) => s.symbol.description)).toEqual(['root', 'v-1', 'v-2', 'root']);
        }
      });

      it('long cycle', () => {
        const tokens = Array(100)
          .fill(undefined)
          .map((_, i) => createToken<unknown>(`t-${i}`));

        const container = declareContainer({
          providers: tokens.map((token, index) =>
            injectable({
              provide: token,
              useFactory: (v) => v,
              // each token depends on the next one except for the last - it depends on first one, making a cycle
              inject: [tokens[index + 1] ? tokens[index + 1] : tokens[0]],
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
              useFactory: (v1, v2) => () => [10, v1, v2],
              inject: [V_1_TOKEN, V_2_TOKEN],
            }),
            injectable({ provide: V_1_TOKEN, useFactory: () => 10 }),
            injectable({ provide: V_2_TOKEN, useFactory: (v1) => v1 + 5, inject: [V_1_TOKEN] }),
          ],
        });
        expect(() => {
          container.get(ROOT_TOKEN);
        }).not.toThrowError();
      });
    });
  });

  describe('token declarations', () => {
    it('token not provided', () => {
      expect.assertions(2);
      const f1token = createToken<{ a: number }>('1');
      const f2token = createToken<{ a: number }>('2');
      const f3token = createToken<{ a: number }>('3');

      const f1prov = injectable({
        provide: f1token,
        inject: [f2token] as const,
        useFactory: (value) => ({ a: value.a }),
      });
      const f2prov = injectable({
        provide: f2token,
        inject: [f3token] as const,
        useFactory: (value) => ({ a: value.a }),
      });
      const container = declareContainer({ providers: [f1prov, f2prov] });

      try {
        container.get(f1token);
      } catch (e) {
        expect(e.message).toEqual('Token "3" is not provided, stack: 2 -> 3');
        expect(e.depStack).toEqual([f2token, f3token]);
      }
    });

    it('token is optional', () => {
      const rootToken = createToken<number>('root');
      const optToken = createToken<number>('opt');

      const rootDep = injectable({
        provide: rootToken,
        inject: [{ token: optToken, optional: true }] as const,
        useFactory: (opt) => (opt || 100) + 1,
      });

      const value = declareContainer({ providers: [rootDep] }).get(rootToken);
      expect(value).toEqual(101);
    });

    it('multi token is optional', () => {
      const rootToken = createToken<number[]>('root');
      const multiToken = modifyToken.multi(createToken<number>('multi'));

      const rootDep = injectable({
        provide: rootToken,
        inject: [{ token: multiToken, optional: true }] as const,
        useFactory: (opt) => opt,
      });

      const value = declareContainer({ providers: [rootDep] }).get(rootToken);
      // optional multi tokens resolve to empty array
      expect(value).toEqual([]);
    });
  });

  describe('child-di-factory', () => {
    const rootToken = createToken<number>('root');
    const parentDepToken = createToken<number>('parent:dep');
    const childToken = createToken<number>('child');
    const childInnerToken = createToken<number>('child:inner');

    it('child di checks the dep tree once', () => {
      let childDiCalledTimes = 0;
      let innerCalledTimes = 0;
      const createChildToken = createToken<() => number>('create-child');

      const childDep = injectable({
        provide: childToken,
        inject: [childInnerToken] as const,
        useFactory: (childInnerDep) => {
          innerCalledTimes += 1;
          return childInnerDep + 1;
        },
      });

      const container = declareContainer({
        providers: [
          injectable({ provide: parentDepToken, useValue: 1 }),
          injectable({
            provide: createChildToken,
            scope: 'singleton',
            inject: [CHILD_DI_FACTORY_TOKEN] as const,
            // this is an orthodox and recommended way to create child containers with already resolved root
            useFactory: (childDiFactory) => {
              const childScope = childDiFactory(childDep);
              childDiCalledTimes += 1;

              return () => childScope();
            },
          }),
          injectable({
            provide: childInnerToken,
            inject: [parentDepToken] as const,
            useFactory: (parentDep) => parentDep + 1,
          }),
        ],
      });
      const arr = new Array(4).fill(undefined).map(() => container.get(createChildToken)());
      expect(arr).toEqual([3, 3, 3, 3]);
      // useFactory using childDiFactory is called only once - check deps tree once
      expect(childDiCalledTimes).toEqual(1);
      expect(innerCalledTimes).toEqual(4);
    });

    it('token not provided for child container', () => {
      expect.assertions(2);

      const childDep = injectable({
        provide: childToken,
        inject: [childInnerToken] as const,
        useFactory: (childInnerDep) => childInnerDep + 1,
      });

      // register only root provider and scoped provider (it is used inside of a childDep)
      const container = declareContainer({
        providers: [
          injectable({
            provide: rootToken,
            inject: [CHILD_DI_FACTORY_TOKEN] as const,
            useFactory: (childDiFactory) => {
              const childScope = childDiFactory(childDep);
              return childScope();
            },
          }),
          injectable({
            provide: childInnerToken,
            inject: [parentDepToken] as const,
            useFactory: (parentDep) => parentDep + 1,
          }),
        ],
      });

      try {
        container.get(rootToken);
      } catch (e) {
        expect(e.message).toEqual('Token "parent:dep" is not provided, stack: child -> child:inner -> parent:dep');
        expect(e.depStack).toEqual([childToken, childInnerToken, parentDepToken]);
      }
    });

    describe('scopes', () => {
      const CHILD_TOKEN = createToken<Readonly<[number, number, number]>>('child-token');

      const createProviders = ([v1scope, v2scope]: [FactoryOptions['scope'], FactoryOptions['scope']]) => {
        const childProvider = injectable({
          provide: CHILD_TOKEN,
          inject: [V_1_TOKEN, V_2_TOKEN, V_2_TOKEN],
          useFactory: (v1, v2, v2next) => [v1, v2, v2next] as const,
        });

        const rootProvider = injectable({
          provide: ROOT_TOKEN,
          useFactory: (childDiFactory) => {
            const childDi = childDiFactory(childProvider);
            return childDi;
          },
          inject: [CHILD_DI_FACTORY_TOKEN] as const,
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
          useFactory: (v1) => v1 + 50,
          inject: [V_1_TOKEN] as const,
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
          useFactory: (nothing) => nothing,
          scope: 'scoped',
          inject: [NEVER_TOKEN],
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
});
