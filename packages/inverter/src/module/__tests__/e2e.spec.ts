import { createToken, createContainer, injectable, modifyToken } from '../../index';
import { randomString } from '../../base/__tests__/utils.mock';
import { createModule } from '../module';

const RANDOM_SCOPED = createToken<string>('random:scoped');
const RANDOM_SINGLETON = createToken<string>('random:singleton');
const RANDOM_TRANSIENT = createToken<string>('random:transient');
const STRING = createToken<string>('unique');
const STRING_MULTI = modifyToken.multi(STRING);

const providers = [
  injectable({ provide: RANDOM_SINGLETON, useFactory: randomString, scope: 'singleton' }),
  injectable({ provide: RANDOM_SCOPED, useFactory: randomString, scope: 'scoped' }),
  injectable({ provide: RANDOM_TRANSIENT, useFactory: randomString, scope: 'transient' }),
];

const getUniqueValues = (arr: (string | number)[]) => [...new Set(arr)];

describe('e2e', () => {
  it('different scopes', async () => {
    const parentContainer = createContainer({ providers });
    const createScope = async (req: string) => {
      const childContainer = createContainer(
        {
          providers: [injectable({ provide: STRING, useValue: req })],
        },
        parentContainer,
      );
      const [singletons, scopeds, transients] = await Promise.all([
        Promise.all([childContainer.get(RANDOM_SINGLETON), childContainer.get(RANDOM_SINGLETON)]),
        Promise.all([childContainer.get(RANDOM_SCOPED), childContainer.get(RANDOM_SCOPED)]),
        Promise.all([childContainer.get(RANDOM_TRANSIENT), childContainer.get(RANDOM_TRANSIENT)]),
      ]);

      return { singletons, scopeds, transients };
    };

    const fromParent = {
      singletons: await Promise.all([parentContainer.get(RANDOM_SINGLETON), parentContainer.get(RANDOM_SINGLETON)]),
      scopeds: await Promise.all([parentContainer.get(RANDOM_SCOPED), parentContainer.get(RANDOM_SCOPED)]),
      transients: await Promise.all([parentContainer.get(RANDOM_TRANSIENT), parentContainer.get(RANDOM_TRANSIENT)]),
    };
    const fromChildren = await Promise.all([createScope('first'), createScope('second')]);

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

  describe('modules', () => {
    it('multiple addition -> only the last implementation is applied', async () => {
      const mod = createModule({
        name: 'some-module',
        providers: [
          injectable({ provide: STRING, useFactory: randomString, scope: 'singleton' }),
          injectable({ provide: STRING, useFactory: randomString, scope: 'transient' }),
          injectable({ provide: STRING, useFactory: randomString, scope: 'scoped' }),
        ],
      });
      const container = createContainer({ modules: [mod, mod, mod] });
      const res1 = await container.get(STRING);
      const res2 = await container.get(STRING);
      expect(typeof res1).toEqual('string');
      // module is applied only once
      expect(container.__providers.length).toEqual(3);
      // the same because the implementation is in scope:scoped
      expect(res1).toEqual(res2);
    });

    it('multiple addition -> only the last implementation is applied', async () => {
      const mod = createModule({
        name: 'some-module',
        providers: [
          injectable({ provide: STRING, useFactory: randomString, scope: 'singleton' }),
          injectable({ provide: STRING, useFactory: randomString, scope: 'scoped' }),
          injectable({ provide: STRING, useFactory: randomString, scope: 'transient' }),
        ],
      });
      const container = createContainer({ modules: [mod, mod, mod] });
      const res = [await container.get(STRING), await container.get(STRING)];

      expect(typeof res[0]).toEqual('string');
      // module is applied only once
      expect(container.__providers.length).toEqual(3);
      // different because the implementation is in scope:transient
      expect(res[0]).not.toEqual(res[1]);
    });

    it('hierarchy', async () => {
      const mod = createModule({
        name: 'some-module',
        providers: [
          injectable({ provide: STRING, useFactory: randomString, scope: 'singleton' }),
          injectable({ provide: STRING, useFactory: randomString, scope: 'scoped' }),
          injectable({ provide: STRING, useFactory: randomString, scope: 'transient' }),
        ],
      });
      const parentContainer = createContainer({ modules: [mod, mod, mod] });
      const childContainer = createContainer({ modules: [mod, mod, mod] }, parentContainer);

      const par = [await parentContainer.get(STRING), await parentContainer.get(STRING)];
      const chi = [await childContainer.get(STRING), await childContainer.get(STRING)];
      // all the values are unique
      expect(getUniqueValues([...chi, ...par])).toEqual([...chi, ...par]);
    });

    it('multi token for hierarchy', async () => {
      const mod = createModule({
        name: 'some-module',
        providers: [
          injectable({ provide: STRING_MULTI, useFactory: randomString, scope: 'singleton' }),
          injectable({ provide: STRING_MULTI, useFactory: randomString, scope: 'scoped' }),
          injectable({ provide: STRING_MULTI, useFactory: randomString, scope: 'transient' }),
        ],
      });
      const parentContainer = createContainer({ modules: [mod, mod] });
      const child1 = createContainer({ modules: [] }, parentContainer);
      const child2 = createContainer({ modules: [] }, parentContainer);
      const res = await Promise.all(
        [parentContainer, child1, child2].map((c) =>
          Promise.all([c.get(STRING_MULTI), c.get(STRING_MULTI), c.get(STRING_MULTI)]),
        ),
      );

      // [container, callNo, scope]
      expect(getUniqueValues([res[0][0][0], res[0][1][0], res[0][2][0]])).toEqual([res[0][0][0]]);
      expect(
        getUniqueValues([
          res[0][0][0],
          res[0][1][0],
          res[0][2][0],
          res[1][0][0],
          res[1][1][0],
          res[1][2][0],
          res[2][0][0],
          res[2][1][0],
          res[2][2][0],
        ]),
      ).toEqual([res[0][0][0], res[1][1][0], res[2][2][0]]);
      expect(
        getUniqueValues([
          res[0][0][1],
          res[0][1][1],
          res[0][2][1],
          res[1][0][1],
          res[1][1][1],
          res[1][2][1],
          res[2][0][1],
          res[2][1][1],
          res[2][2][1],
        ]),
      ).toEqual([res[0][0][1], res[1][1][1], res[2][2][1]]);
      expect(
        getUniqueValues([
          res[0][0][2],
          res[0][1][2],
          res[0][2][2],
          res[1][0][2],
          res[1][1][2],
          res[1][2][2],
          res[2][0][2],
          res[2][1][2],
          res[2][2][2],
        ]),
      ).toEqual([
        res[0][0][2],
        res[0][1][2],
        res[0][2][2],
        res[1][0][2],
        res[1][1][2],
        res[1][2][2],
        res[2][0][2],
        res[2][1][2],
        res[2][2][2],
      ]);
    });
  });
});
