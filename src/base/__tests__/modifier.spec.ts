import { createContainer } from '../container';
import { createToken, modifyToken } from '../token';
import { injectable } from '../injectable';

const delay = (to: number) => new Promise((resolve) => setTimeout(() => resolve(undefined), to));

const t1exp = createToken<string>('tok:1:expect');
const t2dep = modifyToken.multi(createToken<string>('tok:2:dependent'));

const createFakeContainers = (withParent?: true) => {
  const parentContainer = createContainer();
  if (typeof withParent === 'undefined') {
    return [parentContainer];
  }
  return [parentContainer, createContainer(parentContainer)];
};

describe('depending', () => {
  describe('on multi', () => {
    it('registration order -> correct order', async () => {
      const [container] = createFakeContainers();
      const providers = [
        injectable({ provide: t1exp, useFactory: (second) => second.join(':'), inject: [t2dep] as const }),
        injectable({ provide: t2dep, useValue: '1' }),
        injectable({ provide: t2dep, useFactory: () => '2' }),
        injectable({ provide: t2dep, useValue: '3' }),
        injectable({ provide: t2dep, useFactory: () => delay(10).then(() => '4') }),
        injectable({ provide: t2dep, useFactory: () => delay(1).then(() => '5') }),
      ];
      providers.forEach((f) => f(container)());

      const res = await container.resolveSingle(t1exp);
      expect(res).toEqual('1:2:3:4:5');
    });

    it('no implementation -> empty array', async () => {
      const [container] = createFakeContainers();
      injectable({
        provide: t1exp,
        useFactory: (second) => `secondLength:${second.length.toString()}`,
        inject: [t2dep] as const,
      })(container)();
      const res = await container.resolveSingle(t1exp);
      expect(res).toEqual(`secondLength:0`);
    });

    it('factory implementation -> cached between resolves', async () => {
      const [container] = createFakeContainers();
      const providers = [
        injectable({
          provide: t1exp,
          useFactory: (second) => second.join(':'),
          inject: [t2dep] as const,
          scope: 'transient',
        }),
        injectable({ provide: t2dep, useFactory: () => Math.random().toString().slice(2, 8) }),
        injectable({ provide: t2dep, useValue: Math.random().toString().slice(2, 8) }),
      ];
      providers.forEach((f) => f(container)());

      const res1 = await container.resolveSingle(t2dep);
      const res2 = await container.resolveSingle(t2dep);
      expect(res1).toEqual(res2);

      const res3 = await container.resolveSingle(t1exp);
      const res4 = await container.resolveSingle(t1exp);
      expect(res3).toEqual(res4);
    });

    it('transient scope -> is not cached', async () => {
      const [container] = createFakeContainers();
      const providers = [
        injectable({ provide: t1exp, useFactory: (second) => second.join(':'), inject: [t2dep] as const }),
        injectable({ provide: t2dep, useFactory: () => Math.random().toString().slice(2, 8), scope: 'transient' }),
        injectable({ provide: t2dep, useFactory: () => Math.random().toString().slice(2, 8), scope: 'transient' }),
      ];
      providers.forEach((f) => f(container)());

      const res1 = await container.resolveSingle(t1exp);
      const res2 = await container.resolveSingle(t1exp);
      expect(res1).toEqual(res2);
    });

    it('combination of child and parent implementation -> TODO', async () => {
      const [parentC, childC] = createFakeContainers(true);
      injectable({ provide: t1exp, useFactory: (second) => second.join(':'), inject: [t2dep], scope: 'scoped' })(
        parentC,
      )();
      injectable({ provide: t1exp, useFactory: (second) => second.join(':'), inject: [t2dep], scope: 'scoped' })(
        childC,
      )();
      injectable({ provide: t2dep, useFactory: () => 'from-parent', scope: 'scoped' })(parentC)();
      injectable({ provide: t2dep, useFactory: () => 'from-children', scope: 'scoped' })(childC)();

      const res1 = await parentC.resolveSingle(t1exp);
      const res2 = await childC.resolveSingle(t1exp);
      // gets the implementation from respective containers and does not mix them together
      expect(res1).toEqual('from-parent');
      expect(res2).toEqual('from-children');
    });
  });
});
