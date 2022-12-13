import { createContainer } from '../container';
import { createToken, modifyToken } from '../token';
import { injectable } from '../injectable';

const delay = (to: number) => new Promise((resolve) => setTimeout(() => resolve(undefined), to));

const t1exp = createToken<string>('tok:1:expect');
const t2dep = modifyToken.multi(createToken<string>('tok:2:dependent'));
// const t3uberdep = createToken<string>('tok:3:dependent');

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

    it.only('factory implementation -> cached between resolves', async () => {
      const [container] = createFakeContainers();
      const providers = [
        injectable({ provide: t2dep, useFactory: () => Math.random().toString().slice(2, 8) }),
        injectable({ provide: t2dep, useValue: Math.random().toString().slice(2, 8) }),
      ];
      providers.forEach((f) => f(container)());

      const res1 = await container.resolveSingle(t2dep);
      const res2 = await container.resolveSingle(t2dep);
      console.log({ res1, res2 });
      // @TODO there is a problem -> after the first resolving bindValue is being called internally
      // and it leads to a concatenated unintended implementation
      // { res1: [a, b], res2: [c, b, a] }
      expect(res1).toEqual(res2);
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

    it.todo('combination of child and parent implementation -> TODO');
  });
});
