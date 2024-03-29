import { createBaseContainer } from '../container';
import { createToken, modifyToken } from '../token';
import { injectable } from '../injectable';
import { delay } from './utils.mock';

const t1exp = createToken<string>('tok:1');
const t2base = createToken<string>('tok:2');
const t2def = modifyToken.defaultValue(t2base, '[2](default)');
const t2mul = modifyToken.multi(t2base);

const createFakeContainers = (withParent?: true) => {
  const parentContainer = createBaseContainer();
  if (typeof withParent === 'undefined') {
    return [parentContainer];
  }
  return [parentContainer, createBaseContainer(parentContainer)];
};

const fakeInjectables = [
  {
    value: injectable({ provide: t1exp, useValue: '[1](value)' }),
    factory: injectable({ provide: t1exp, useFactory: () => '[1](factory)' }),
    depfactory: injectable({
      provide: t1exp,
      useFactory: (second) => `${second}+[1](depfactory)`,
      inject: [t2base] as const,
    }),
    depdeffactory: injectable({
      provide: t1exp,
      useFactory: (second) => `${second}+[1](depdeffactory)`,
      inject: [t2def] as const,
    }),
    depmulfactory: injectable({
      provide: t1exp,
      useFactory: (second) => `${second.join('+')}+[1](dep-factory)`,
      inject: [t2mul] as const,
    }),
  },
  {
    value: injectable({ provide: t2base, useValue: '[2](value)' }),
    factory: injectable({ provide: t2base, useFactory: () => '[2](factory)' }),
    valueMulti: injectable({ provide: t2mul, useValue: '[2](value)' }),
    factoryMulti: injectable({ provide: t2mul, useFactory: () => '[2](factory)' }),
  },
] as const;

describe('injection-methods', () => {
  describe('basic', () => {
    it('basic value', async () => {
      const [container] = createFakeContainers();
      fakeInjectables[0].value(container)();

      const res = await container.resolveSingle(t1exp);
      expect(res).toEqual('[1](value)');
    });

    it('basic optional', async () => {
      const [container] = createFakeContainers();

      const res = await container.resolveSingle({ token: t1exp, optional: true });
      expect(res).toEqual(undefined);
    });

    it('empty factory', async () => {
      const [container] = createFakeContainers();
      fakeInjectables[0].factory(container)();

      const res = await container.resolveSingle(t1exp);
      expect(res).toEqual('[1](factory)');
    });
  });

  describe('depend', () => {
    it('on value', async () => {
      const [container] = createFakeContainers();
      fakeInjectables[0].depfactory(container)();
      fakeInjectables[1].value(container)();

      const res = await container.resolveSingle(t1exp);
      expect(res).toEqual('[2](value)+[1](depfactory)');
    });

    it('on default', async () => {
      const [container] = createFakeContainers();
      fakeInjectables[0].depdeffactory(container)();

      const res = await container.resolveSingle(t1exp);
      expect(res).toEqual('[2](default)+[1](depdeffactory)');
    });

    it('on factory', async () => {
      const [container] = createFakeContainers();
      fakeInjectables[0].depfactory(container)();
      fakeInjectables[1].factory(container)();

      const res = await container.resolveSingle(t1exp);
      expect(res).toEqual('[2](factory)+[1](depfactory)');
    });

    it('on multi provider', async () => {
      const [container] = createFakeContainers();
      fakeInjectables[0].depmulfactory(container)();
      fakeInjectables[1].valueMulti(container)();
      fakeInjectables[1].factoryMulti(container)();
      fakeInjectables[1].valueMulti(container)();

      const res = await container.resolveSingle(t1exp);
      // value gets deduplicated
      expect(res).toEqual('[2](value)+[2](factory)+[2](value)+[1](dep-factory)');
    });
  });

  describe('edge cases', () => {
    it('type is correct when resolving promises', async () => {
      const [container] = createFakeContainers();
      const t1 = createToken<Promise<number>>('tok:1:promise');
      const t2 = createToken<Promise<number>>('tok:2:promise');

      injectable({
        provide: t2,
        useFactory: (a) =>
          a.then((val) => {
            return delay(10).then(() => val + 1);
          }),
        inject: [t1],
      })(container)();
      injectable({ provide: t1, useValue: delay(50).then(() => 100) })(container)();

      const res = await Promise.all([container.resolveSingle(t1), container.resolveSingle(t2)]);
      expect(res).toEqual([100, 101]);
    });

    it('fail if incorrect injection type', () => {
      const [container] = createFakeContainers();

      expect(() => {
        injectable({ provide: t1exp, useNothing: 1 })(container)();
      }).toThrow('Incorrect args passed to injectable factory');
    });
  });
});
