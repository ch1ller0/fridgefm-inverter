import { createToken, declareContainer } from '../../index'; // di entry
import { CHILD_DI_FACTORY_TOKEN } from '../modules';
import { injectable } from '../provider';
import type { FactoryOptions } from '../provider.types';

const ROOT_TOKEN = createToken<() => [number, number, number]>('root');

describe('modules', () => {
  describe('child-di-factory', () => {
    const CHILD_TOKEN = createToken<[number, number, number]>('child-token');
    const V_1_TOKEN = createToken<number>('v-1');
    const V_2_TOKEN = createToken<number>('v-2');
    const createProviders = ([v1scope, v2scope]: [FactoryOptions['scope'], FactoryOptions['scope']]) => {
      const childProvider = injectable({
        provide: CHILD_TOKEN,
        inject: [V_1_TOKEN, V_2_TOKEN, V_2_TOKEN],
        useFactory: (v1, v2, v2next) => [v1, v2, v2next],
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
