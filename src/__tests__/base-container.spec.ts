import { createToken, modifyToken } from '../base/token';
import { createBaseContainer } from '../base/base-container';

const createGetString = (prefix: string) => {
  let counter = 0;
  return () => {
    counter++;
    return prefix + counter.toString();
  };
};

const delay = (to: number) => new Promise((res) => setTimeout(res, to));

const createCounter = () => {
  let count = 0;
  return {
    fn: jest.fn(() => {
      count += 1;
      return count;
    }),
    called: () => count,
  };
};

/**
 * We have categories:
 * - bind type (bindValue, bindFactory)
 *   - bindFactory has scopes (singleton, transient, scoped)
 * - token modifiers (multi, optionalValue)
 * - container hierarchy (no parent, has parent)
 * - other mechanics
 *   - new bind shadows the previous one
 *   - non-provided token fails
 *   - circular dependency fails
 */

describe('createBaseContainer', () => {
  describe('values', () => {
    it('bind value', async () => {
      const container = createBaseContainer();
      const token = createToken<number>('value1');
      container.bindValue(token, 1);
      container.bindValue(token, 2);
      const value = await container.get(token);

      expect(value).toEqual(2);
    });

    it('optional value token', async () => {
      const container = createBaseContainer();
      const token = modifyToken.optionalValue(createToken<number>('optionalV1'), 1);
      const value1 = await container.get(token);
      expect(value1).toEqual(1);
      container.bindValue(token, 2);
      const value2 = await container.get(token);
      expect(value2).toEqual(2);
    });

    it('multi value token', async () => {
      const container = createBaseContainer();
      const multiValueToken = modifyToken.multi(createToken<number>('multivalue'));
      container.bindValue(multiValueToken, 1);
      const value1 = await container.get(multiValueToken);
      expect(value1).toEqual([1]);
      container.bindValue(multiValueToken, 2);
      const value2 = await container.get(multiValueToken);
      expect(value2).toEqual([1, 2]);
    });
  });

  describe('async-factories', () => {
    it('bind async factory', async () => {
      const container = createBaseContainer();
      const token = createToken<number>('asyncFactory1');
      container.bindAsyncFactory(token, () => delay(10).then(() => 1));
      const value1 = await container.get(token);
      console.log('value1: ', value1);
      expect(value1).toEqual(1);
    });
  });

  describe('factories', () => {
    it('bind factory', async () => {
      const container = createBaseContainer();
      const token = createToken<number>('factory1');
      container.bindFactory(token, () => 1);
      container.bindFactory(token, () => 2);
      expect(await container.get(token)).toEqual(2);
    });

    it('bind factory chaining', async () => {
      const container = createBaseContainer();
      const token1 = createToken<number>('factory1');
      const token2 = createToken<number>('factory2');
      container.bindFactory(token1, (ctx) => ctx.get(token).then((s) => s));
      container.bindFactory(token, () => 2);
      expect(await container.get(token)).toEqual(2);
    });

    it('optional factory token', async () => {
      const container = createBaseContainer();
      const token = modifyToken.optionalValue(createToken<number>('optionalF1'), 1);
      expect(await container.get(token)).toEqual(1);
      container.bindFactory(token, () => 2);
      expect(await container.get(token)).toEqual(2);
    });

    it('multi factory token', async () => {
      const container = createBaseContainer();
      const multiValueToken = modifyToken.multi(createToken<number>('multivalue'));
      container.bindFactory(multiValueToken, () => 1);
      expect(await container.get(multiValueToken)).toEqual([1]);
      container.bindFactory(multiValueToken, () => 2);
      expect(await container.get(multiValueToken)).toEqual([1, 2]);
    });

    it('values and factories shadow each other', async () => {
      const container = createBaseContainer();
      const token = createToken<number>('value1');
      container.bindValue(token, 1);
      container.bindFactory(token, () => 2);
      expect(await container.get(token)).toEqual(2);
      container.bindValue(token, 3);
      expect(await container.get(token)).toEqual(3);
    });

    it('scope - singleton', async () => {
      const parentContainer = createBaseContainer();
      const container = createBaseContainer(parentContainer);
      const token = createToken<number>('factory');
      const { fn, called } = createCounter();
      parentContainer.bindFactory(token, fn, { scope: 'singleton' });
      const [v1, v2] = [await container.get(token), await container.get(token)];
      expect([v1, v2]).toEqual([1, 1]);
      expect(called()).toEqual(1); // executed once - only for the parent
    });

    it('scope - transient', async () => {
      const parentContainer = createBaseContainer();
      const container = createBaseContainer(parentContainer);
      const token = createToken<number>('factory');
      const { fn, called } = createCounter();
      parentContainer.bindFactory(token, fn, { scope: 'transient' });
      const [v1, v2, v3] = [await parentContainer.get(token), await container.get(token), await container.get(token)];
      expect([v1, v2, v3]).toEqual([1, 2, 3]);
      expect(called()).toEqual(3); // transient mode calls on each get
    });

    it('scope - scoped single', async () => {
      const parentContainer = createBaseContainer();
      const container = createBaseContainer(parentContainer);
      const token = createToken<number>('factory');
      const { fn, called } = createCounter();
      parentContainer.bindFactory(token, fn);
      container.bindFactory(token, fn, { scope: 'scoped' });
      const [v1, v2, v3] = [await parentContainer.get(token), await container.get(token), await container.get(token)];
      expect([v1, v2, v3]).toEqual([1, 2, 2]);
      container.get(token);
      expect(called()).toEqual(2); // executed factory twice - for the container and its parent
    });

    it('scope - scoped multiple', async () => {
      const parentContainer = createBaseContainer();
      const container1 = createBaseContainer(parentContainer);
      const container2 = createBaseContainer(parentContainer);
      const token = createToken<number>('factory');
      parentContainer.bindFactory(token, () => 0);
      container1.bindFactory(token, () => 1, { scope: 'scoped' });
      container2.bindFactory(token, () => 2, { scope: 'scoped' });
      const [v1, v2, v3] = [await parentContainer.get(token), await container1.get(token), await container2.get(token)];
      expect([v1, v2, v3]).toEqual([0, 1, 2]); // each container has different factory
    });
  });

  describe('multi providers', () => {
    it('multi different providers type', async () => {
      const container = createBaseContainer();
      const token = modifyToken.multi(createToken<number>('smth'));
      expect(await container.get(token)).toEqual([]);
      container.bindValue(token, 1);
      expect(await container.get(token)).toEqual([1]);
      container.bindFactory(token, () => 2);
      expect(await container.get(token)).toEqual([1, 2]);
      container.bindValue(token, 3);
      expect(await container.get(token)).toEqual([1, 2, 3]);
    });

    it('multi different providers type with childs', async () => {
      // I am not pretty sure that everything works fine here
      const parent = createBaseContainer();
      const child = createBaseContainer(parent);
      const token = modifyToken.multi(createToken<string>('smth'));

      parent.bindValue(token, 'p1');
      expect(await child.get(token)).toEqual(['p1']);
      expect(await parent.get(token)).toEqual(['p1']);

      child.bindValue(token, 'c2');
      expect(await child.get(token)).toEqual(['c2', 'p1']);
      expect(await parent.get(token)).toEqual(['p1']);

      parent.bindFactory(token, createGetString('pa'), { scope: 'singleton' });
      expect(await child.get(token)).toEqual(['c2', 'p1', 'pa1']);
      expect(await parent.get(token)).toEqual(['p1', 'pa1']);

      parent.bindFactory(token, createGetString('pb'), { scope: 'scoped' });
      expect(await child.get(token)).toEqual(['c2', 'p1', 'pa1', 'pb1']);
      expect(await parent.get(token)).toEqual(['p1', 'pa1', 'pb2']);

      parent.bindFactory(token, createGetString('pc'), { scope: 'transient' });
      expect(await child.get(token)).toEqual(['c2', 'p1', 'pa1', 'pb3', 'pc1']);
      expect(await parent.get(token)).toEqual(['p1', 'pa1', 'pb4', 'pc2']); // pb bumped up

      child.bindFactory(token, createGetString('ca'), { scope: 'singleton' });
      expect(await child.get(token)).toEqual(['c2', 'ca1', 'p1', 'pa1', 'pb5', 'pc3']);
      expect(await parent.get(token)).toEqual(['p1', 'pa1', 'pb6', 'pc4']);

      child.bindFactory(token, createGetString('cb'), { scope: 'scoped' });
      expect(await child.get(token)).toEqual(['c2', 'ca1', 'cb1', 'p1', 'pa1', 'pb7', 'pc5']);
      expect(await parent.get(token)).toEqual(['p1', 'pa1', 'pb8', 'pc6']);

      child.bindFactory(token, createGetString('cc'), { scope: 'transient' });
      expect(await child.get(token)).toEqual(['c2', 'ca1', 'cb2', 'cc1', 'p1', 'pa1', 'pb9', 'pc7']);
      expect(await parent.get(token)).toEqual(['p1', 'pa1', 'pb10', 'pc8']);
    });
  });

  describe('other mechanics', () => {
    it('Trying to resolve non-provided token', async () => {
      expect.assertions(2);

      const container = createBaseContainer();
      const token = createToken<number>('value');
      try {
        await container.get(token);
      } catch (e) {
        expect(e.message).toEqual('Token "value" is not provided, stack: value');
        expect(e.name).toEqual('ResolverError');
      }
    });
  });
});
