import { createContainer } from '../container';
import { createToken } from '../token';
import { injectable } from '../injectable';

const t0 = createToken<string>('tok-0');
const t1 = createToken<string>('tok-1');
const t2 = createToken<string>('tok-2');

describe('container scopes', () => {
  it('scoped', async () => {
    const randomString = (from: string) => `${from}${Math.random().toString().slice(2, 6)}`;
    const parentContainer = createContainer();
    const childContainer1 = createContainer(parentContainer);
    const childContainer2 = createContainer(parentContainer);
    const providers = [
      injectable({ provide: t0, useFactory: () => randomString('t0'), scope: 'scoped' }),
      injectable({ provide: t1, useFactory: (v1) => `${v1}+${randomString('t1')}`, scope: 'scoped', inject: [t0] }),
      injectable({
        provide: t2,
        useFactory: (v1, v2) => `${v1}+${v2}+${randomString('t2')}`,
        scope: 'scoped',
        inject: [t0, t1],
      }),
    ];

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

    // @TODO this might be a problem
    // the first child gets a parent implementation because we have already switched the context to the parent
    expect(forChild1[2]).toEqual(forParent[2]);
    // I want the last part to be different
    // console.log({ forParent, forChild1 });
    // expect(forChild1[2]).not.toEqual(forParent[2]);
    // expect(forChild1[2].split('+').slice(0, 3).join('+')).toEqual([forChild1[0], forChild1[1]].join('+'));
    // for the second child the middle part depends on the value from itself
    expect(forChild2[2]).not.toEqual(forParent[2]);
    expect(forChild2[2].split('+').slice(0, 3).join('+')).toEqual([forChild2[0], forChild2[1]].join('+'));
  });
});
