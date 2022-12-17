import { createToken, createContainer, createChildContainer, injectable } from '../../index';
import { randomString } from '../../../examples/shared/utils';

const RANDOM_SCOPED = createToken<string>('random:scoped');
const RANDOM_SINGLETON = createToken<string>('random:singleton');
const RADNOM_TRANSIENT = createToken<string>('random:transient');
const UNIQUE = createToken<string>('unique');

const providers = [
  injectable({ provide: RANDOM_SINGLETON, useFactory: randomString, scope: 'singleton' }),
  injectable({ provide: RANDOM_SCOPED, useFactory: randomString, scope: 'scoped' }),
  injectable({ provide: RADNOM_TRANSIENT, useFactory: randomString, scope: 'transient' }),
];

const getUniqueValues = (arr: (string | number)[]) => [...new Set(arr)];

describe('e2e', () => {
  it('different scopes', async () => {
    const container = createContainer({ providers });
    const createScope = async (req: string) => {
      const childContainer = await createChildContainer(container, {
        providers: [injectable({ provide: UNIQUE, useValue: req })],
      });
      const [singletons, scopeds, transients] = await Promise.all([
        Promise.all([childContainer.get(RANDOM_SINGLETON), childContainer.get(RANDOM_SINGLETON)]),
        Promise.all([childContainer.get(RANDOM_SCOPED), childContainer.get(RANDOM_SCOPED)]),
        Promise.all([childContainer.get(RADNOM_TRANSIENT), childContainer.get(RADNOM_TRANSIENT)]),
      ]);

      return { singletons, scopeds, transients };
    };

    const fromParent = {
      singletons: await Promise.all([container.get(RANDOM_SINGLETON), container.get(RANDOM_SINGLETON)]),
      scopeds: await Promise.all([container.get(RANDOM_SCOPED), container.get(RANDOM_SCOPED)]),
      transients: await Promise.all([container.get(RADNOM_TRANSIENT), container.get(RADNOM_TRANSIENT)]),
    };
    const fromChildren = await Promise.all([createScope('first'), createScope('second')]);
    console.log({ fromParent, fromChildren });

    // singletons are the same between different resolves
    expect(fromParent.singletons[0]).toEqual(fromParent.singletons[1]);
    // singletons are the same for all the containers no matter of the hierarchy
    expect(fromParent.singletons).toEqual(fromChildren[0].singletons);
    expect(fromParent.singletons).toEqual(fromChildren[1].singletons);
    // and more generally they share only one unique value
    expect(
      getUniqueValues([...fromParent.singletons, ...fromChildren[0].singletons, ...fromChildren[1].singletons]),
    ).toEqual([fromParent.singletons[0]]);

    // scopeds are the same between resolves
    expect(fromParent.scopeds[0]).toEqual(fromParent.scopeds[1]);
    expect(fromChildren[0].scopeds[0]).toEqual(fromChildren[0].scopeds[1]);
    expect(fromChildren[1].scopeds[0]).toEqual(fromChildren[1].scopeds[1]);
    // but they are different for each container
    expect(fromParent.scopeds).not.toEqual(fromChildren[0].scopeds);
    expect(fromChildren[0].scopeds[1]).not.toEqual(fromChildren[1].scopeds[1]);
    // and more generally they have a per-container value
    expect(getUniqueValues([...fromParent.scopeds, ...fromChildren[0].scopeds, ...fromChildren[1].scopeds])).toEqual([
      fromParent.scopeds[0],
      fromChildren[0].scopeds[0],
      fromChildren[1].scopeds[0],
    ]);

    // transients are different all the time
    expect(fromParent.transients[0]).not.toEqual(fromParent.transients[1]);
    expect(fromChildren[0].transients[0]).not.toEqual(fromChildren[0].transients[1]);
    // and more generally there are (number of containers)*(number of resolves) unique values
    expect(
      getUniqueValues([...fromParent.transients, ...fromChildren[0].transients, ...fromChildren[1].transients]),
    ).toEqual([
      fromParent.transients[0],
      fromParent.transients[1],
      fromChildren[0].transients[0],
      fromChildren[0].transients[1],
      fromChildren[1].transients[0],
      fromChildren[1].transients[1],
    ]);
  });
});
