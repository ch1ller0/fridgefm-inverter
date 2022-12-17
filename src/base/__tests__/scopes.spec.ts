import { createBaseContainer } from '../container';
import { createToken } from '../token';
import { injectable } from '../injectable';
import { randomString } from '../../../examples/shared/utils';

const t0 = createToken<string>('tok-0');
const t1 = createToken<string>('tok-1');
const t2 = createToken<string>('tok-2');

const providers = [
  injectable({ provide: t0, useFactory: () => randomString(), scope: 'scoped' }),
  injectable({ provide: t1, useFactory: (v1) => `${v1}+${randomString()}`, scope: 'scoped', inject: [t0] }),
  injectable({
    provide: t2,
    useFactory: (v1, v2) => `${v1}+${v2}+${randomString()}`,
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
});
