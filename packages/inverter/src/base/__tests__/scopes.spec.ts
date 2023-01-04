import { createBaseContainer } from '../container';
import { createToken } from '../token';
import { injectable } from '../injectable';
import { randomString, delay } from './utils.mock';

const t0 = createToken<string>('tok-0');
const t1 = createToken<string>('tok-1');
const t2 = createToken<string>('tok-2');

const providers = [
  injectable({ provide: t0, useFactory: () => randomString(), scope: 'scoped' }),
  injectable({ provide: t1, useFactory: (v1) => `${v1}+${randomString()}`, scope: 'scoped', inject: [t0] }),
  injectable({
    provide: t2,
    useFactory: (v0, v1) => `${v0}+${v1}+${randomString()}`,
    scope: 'scoped',
    inject: [t0, t1],
  }),
];

describe('container scopes', () => {
  it('depending on the singleton value', async () => {
    const singletonProv = injectable({ provide: t0, useFactory: () => randomString(), scope: 'singleton' });
    const parentContainer = createBaseContainer();
    singletonProv(parentContainer)();
    providers[1](parentContainer)();
    const childContainers = new Array(3).fill(undefined).map(() => {
      const cont = createBaseContainer(parentContainer);
      providers[1](cont)();
      return cont;
    });

    const res0P = await parentContainer.resolveSingle(t0);
    const res00 = await childContainers[0].resolveSingle(t0);
    const res01 = await childContainers[1].resolveSingle(t0);
    const res02 = await childContainers[2].resolveSingle(t0);
    // are all the same because the scope for it is singleton for provider t0
    expect({ res00, res01, res02 }).toEqual({ res00: res0P, res01: res0P, res02: res0P });

    const res1P = await parentContainer.resolveSingle(t1);
    const res10 = await childContainers[0].resolveSingle(t1);
    const res11 = await childContainers[1].resolveSingle(t1);
    const res12 = await childContainers[2].resolveSingle(t1);
    // are all different because the provider is registered individually for each container
    expect({ res10, res11, res12 }).not.toEqual({ res10: res1P, res11: res1P, res12: res1P });
    // they are different between each other
    expect(res10).not.toEqual(res11);
    expect(res11).not.toEqual(res12);
    expect(res12).not.toEqual(res10);
    // but the first part is taken from singleton t0
    expect(res10.split('+')[0]).toEqual(res1P.split('+')[0]);
  });

  it('complex', async () => {
    const parentContainer = createBaseContainer();
    const childContainer1 = createBaseContainer(parentContainer);
    const childContainer2 = createBaseContainer(parentContainer);

    providers[0](parentContainer)();
    providers[1](parentContainer)();
    providers[2](parentContainer)();

    providers[1](childContainer1)();

    providers[1](childContainer2)();
    providers[2](childContainer2)();

    const forParent = [
      await parentContainer.resolveSingle(t0),
      await parentContainer.resolveSingle(t1),
      await parentContainer.resolveSingle(t2),
    ];
    const forChild1 = [
      await childContainer1.resolveSingle(t0),
      await childContainer1.resolveSingle(t1),
      await childContainer1.resolveSingle(t2),
    ];
    const forChild2 = [
      await childContainer2.resolveSingle(t0),
      await childContainer2.resolveSingle(t1),
      await childContainer2.resolveSingle(t2),
    ];

    // first is not registered in the child container -> we search in parent
    expect(forChild1[0]).toEqual(forParent[0]);
    expect(forChild2[0]).toEqual(forParent[0]);
    // second is registered in the child -> values with parent and different childs are different
    expect(forChild1[1]).not.toEqual(forParent[1]);
    expect(forChild2[1]).not.toEqual(forParent[1]);
    expect(forChild1[1]).not.toEqual(forChild2[1]);
    // and it stays cached in the child
    expect(await childContainer1.resolveSingle(t1)).toEqual(forChild1[1]);
    expect(await childContainer2.resolveSingle(t1)).toEqual(forChild2[1]);
    // and the first part is the same
    expect(forChild1[1].split('+')[0]).toEqual(forParent[0]);
    expect(forChild2[1].split('+')[0]).toEqual(forParent[0]);
    expect(forChild1[1].split('+')[1]).not.toEqual(forChild2[1].split('+')[1]);
    expect(forChild1[1].split('+')[1]).not.toEqual(forParent[1]);
    expect(forChild2[1].split('+')[1]).not.toEqual(forParent[1]);

    // the first child gets a parent implementation because we dont have it registered inside it
    expect(forChild1[2]).toEqual(forParent[2]);
    // for the second child the middle part depends on the value from itself because provider 2 was registered inside it
    expect(forChild2[2]).not.toEqual(forParent[2]);
    expect(forChild2[2].split('+').slice(0, 3).join('+')).toEqual([forChild2[0], forChild2[1]].join('+'));
  });

  it('no containers have access to the child', async () => {
    expect.assertions(3);
    const parentContainer = createBaseContainer();
    const childContainer1 = createBaseContainer(parentContainer);
    const childContainer2 = createBaseContainer(parentContainer);
    // this provider is only private for the second container
    injectable({ provide: t0, useFactory: () => 'SUPER_SECRET', scope: 'scoped' })(childContainer2)();

    try {
      await parentContainer.resolveSingle(t0);
    } catch (e) {
      expect(e.message).toContain('Token "tok-0" was not provided');
    }
    try {
      await childContainer1.resolveSingle(t0);
    } catch (e) {
      expect(e.message).toContain('Token "tok-0" was not provided');
    }
    const protectedVal = await childContainer2.resolveSingle(t0);
    expect(protectedVal).toEqual('SUPER_SECRET');
  });

  it('child containers get garbage collected', async () => {
    const finalizationMock = jest.fn();
    // @ts-ignore
    const garbageRegistry = new FinalizationRegistry(finalizationMock);
    const parentContainer = createBaseContainer();
    const fakeServer = {
      cb: jest.fn((v: string) => Promise.resolve(v)),
      on: function (cb: (v: string) => void) {
        // @ts-ignore
        this.cb = cb;
      },
    };

    fakeServer.on((value) => {
      const childContainer = createBaseContainer(parentContainer);
      providers.forEach((p) => {
        p(childContainer)();
      });
      injectable({ provide: t0, useValue: value })(childContainer)();
      garbageRegistry.register(childContainer, value, { a: 1 });
      return childContainer.resolveSingle(t2);
    });

    const res = await Promise.all([fakeServer.cb('0'), fakeServer.cb('1'), fakeServer.cb('2')]);
    expect(res[0].startsWith('0+0')).toEqual(true);
    expect(res[1].startsWith('1+1')).toEqual(true);
    expect(res[2].startsWith('2+2')).toEqual(true);

    // means that the --expose-gc flag is enabled
    if (!!global.gc) {
      global.gc();
      await delay(200);
      expect(finalizationMock).toHaveBeenCalledTimes(3);
      expect(finalizationMock.mock.calls.map((s) => s[0]).sort()).toEqual(['0', '1', '2']);
    }
  });
});
