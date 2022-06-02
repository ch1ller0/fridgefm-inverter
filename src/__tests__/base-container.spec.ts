import { createToken, modifyToken } from '../base/token';
import { createBaseContainer } from '../base/base-container';
const { optionalValue, multi } = modifyToken;

const createGetString = (prefix: string) => {
  let counter = 0;
  return () => {
    counter++;
    return prefix + counter.toString();
  };
};

describe('createBaseContainer', () => {
  describe('values', () => {
    it('bind value', () => {
      const container = createBaseContainer();
      const token = createToken<number>('value1');
      container.bindValue(token, 1);
      container.bindValue(token, 2);
      expect(container.get(token)).toEqual(2);
    });

    it('optional value token', () => {
      const container = createBaseContainer();
      const token = optionalValue(createToken<number>('optionalV1'), 1);
      expect(container.get(token)).toEqual(1);
      container.bindValue(token, 2);
      expect(container.get(token)).toEqual(2);
    });

    it('multi value token', () => {
      const container = createBaseContainer();
      const multiValueToken = multi(createToken<number>('multivalue'));
      container.bindValue(multiValueToken, 1);
      expect(container.get(multiValueToken)).toEqual([1]);
      container.bindValue(multiValueToken, 2);
      expect(container.get(multiValueToken)).toEqual([1, 2]);
    });
  });

  describe('factories', () => {
    it('bind factory', () => {
      const container = createBaseContainer();
      const token = createToken('factory1');
      container.bindFactory(token, () => 1);
      container.bindFactory(token, () => 2);
      expect(container.get(token)).toEqual(2);
    });

    it('optional factory token', () => {
      const container = createBaseContainer();
      const token = optionalValue(createToken<number>('optionalF1'), 1);
      expect(container.get(token)).toEqual(1);
      container.bindFactory(token, () => 2);
      expect(container.get(token)).toEqual(2);
    });

    it('multi factory token', () => {
      const container = createBaseContainer();
      const multiValueToken = multi(createToken<number>('multivalue'));
      container.bindFactory(multiValueToken, () => 1);
      expect(container.get(multiValueToken)).toEqual([1]);
      container.bindFactory(multiValueToken, () => 2);
      expect(container.get(multiValueToken)).toEqual([1, 2]);
    });

    it('values and factories shadow each other', () => {
      const container = createBaseContainer();
      const token = createToken('value1');
      container.bindValue(token, 1);
      container.bindFactory(token, () => 2);
      expect(container.get(token)).toEqual(2);
      container.bindValue(token, 3);
      expect(container.get(token)).toEqual(3);
    });

    it('scope - singleton', () => {
      const parentContainer = createBaseContainer();
      const container = createBaseContainer(parentContainer);
      const token = createToken('factory');
      let called = 0;
      parentContainer.bindFactory(
        token,
        () => {
          called += 1;
          return called;
        },
        { scope: 'singleton' },
      );
      const v1 = container.get(token);
      const v2 = container.get(token);
      expect(v1).toEqual(1);
      expect(v2).toEqual(1);
      expect(called).toEqual(1); // executed once - only for the parent
    });

    it('scope - transient', () => {
      const parentContainer = createBaseContainer();
      const container = createBaseContainer(parentContainer);
      const token = createToken('factory');
      let called = 0;
      parentContainer.bindFactory(
        token,
        () => {
          called += 1;
          return called;
        },
        { scope: 'transient' },
      );
      const v1 = parentContainer.get(token);
      const v2 = container.get(token);
      const v3 = container.get(token);
      expect(v1).toEqual(1);
      expect(v2).toEqual(2);
      expect(v3).toEqual(3);
      expect(called).toEqual(3); // transient mode calls on each get
    });

    it('scope - scoped single', () => {
      const parentContainer = createBaseContainer();
      const container = createBaseContainer(parentContainer);
      const token = createToken('factory');
      let called = 0;
      const fn = () => {
        called += 1;
        return called;
      };
      parentContainer.bindFactory(token, fn);
      container.bindFactory(token, fn, { scope: 'scoped' });
      expect(parentContainer.get(token)).toEqual(1);
      expect(container.get(token)).toEqual(2);
      expect(container.get(token)).toEqual(2);
      container.get(token);
      expect(called).toEqual(2); // executed factory twice - for the container and its parent
    });

    it('scope - scoped multiple', () => {
      const parentContainer = createBaseContainer();
      const container1 = createBaseContainer(parentContainer);
      const container2 = createBaseContainer(parentContainer);
      const token = createToken('factory');
      parentContainer.bindFactory(token, () => 0);
      container1.bindFactory(token, () => 1, { scope: 'scoped' });
      container2.bindFactory(token, () => 2, { scope: 'scoped' });

      expect(parentContainer.get(token)).toEqual(0);
      expect(container1.get(token)).toEqual(1);
      expect(container2.get(token)).toEqual(2); // each container has different factory
    });
  });

  describe('multi providers', () => {
    it('multi different providers type', () => {
      const container = createBaseContainer();
      const token = multi(createToken('smth'));
      expect(container.get(token)).toEqual([]);
      container.bindValue(token, 1);
      expect(container.get(token)).toEqual([1]);
      container.bindFactory(token, () => 2);
      expect(container.get(token)).toEqual([1, 2]);
      container.bindValue(token, 3);
      expect(container.get(token)).toEqual([1, 2, 3]);
    });

    it('multi different providers type with childs', () => {
      // I am not pretty sure that everything works fine here
      const parent = createBaseContainer();
      const child = createBaseContainer(parent);
      const token = multi(createToken<string>('smth'));

      parent.bindValue(token, 'p1');
      expect(child.get(token)).toEqual(['p1']);
      expect(parent.get(token)).toEqual(['p1']);

      child.bindValue(token, 'c2');
      expect(child.get(token)).toEqual(['c2', 'p1']);
      expect(parent.get(token)).toEqual(['p1']);

      parent.bindFactory(token, createGetString('pa'), { scope: 'singleton' });
      expect(child.get(token)).toEqual(['c2', 'p1', 'pa1']);
      expect(parent.get(token)).toEqual(['p1', 'pa1']);

      parent.bindFactory(token, createGetString('pb'), { scope: 'scoped' });
      expect(child.get(token)).toEqual(['c2', 'p1', 'pa1', 'pb1']);
      expect(parent.get(token)).toEqual(['p1', 'pa1', 'pb2']);

      parent.bindFactory(token, createGetString('pc'), { scope: 'transient' });
      expect(child.get(token)).toEqual(['c2', 'p1', 'pa1', 'pb3', 'pc1']);
      expect(parent.get(token)).toEqual(['p1', 'pa1', 'pb4', 'pc2']); // pb bumped up

      child.bindFactory(token, createGetString('ca'), { scope: 'singleton' });
      expect(child.get(token)).toEqual(['c2', 'ca1', 'p1', 'pa1', 'pb5', 'pc3']);
      expect(parent.get(token)).toEqual(['p1', 'pa1', 'pb6', 'pc4']);

      child.bindFactory(token, createGetString('cb'), { scope: 'scoped' });
      expect(child.get(token)).toEqual(['c2', 'ca1', 'cb1', 'p1', 'pa1', 'pb7', 'pc5']);
      expect(parent.get(token)).toEqual(['p1', 'pa1', 'pb8', 'pc6']);

      child.bindFactory(token, createGetString('cc'), { scope: 'transient' });
      expect(child.get(token)).toEqual(['c2', 'ca1', 'cb2', 'cc1', 'p1', 'pa1', 'pb9', 'pc7']);
      expect(parent.get(token)).toEqual(['p1', 'pa1', 'pb10', 'pc8']);
    });
  });

  describe('other mechanics', () => {
    it('Trying to resolve non-provided token', () => {
      const container = createBaseContainer();
      const token = createToken<number>('value');
      expect(() => {
        container.get(token);
      }).toThrowError('Token "value" is not provided, stack: value');
    });
  });
});
