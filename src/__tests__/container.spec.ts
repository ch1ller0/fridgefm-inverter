import { createToken } from '../base/token';
import { createBaseContainer } from '../base/container';

describe('createBaseContainer', () => {
  describe('values', () => {
    it('bind value', () => {
      const container = createBaseContainer();
      const token = createToken('value1');
      container.bindValue(token, 1);
      container.bindValue(token, 2);
      expect(container.get(token)).toEqual(2);
    });

    it('optional value token', () => {
      const container = createBaseContainer();
      const token = createToken('optionalV1', {
        optionalValue: 1,
      });
      expect(container.get(token)).toEqual(1);
      container.bindValue(token, 2);
      expect(container.get(token)).toEqual(2);
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
      const token = createToken('optionalF1', {
        optionalValue: 1,
      });
      expect(container.get(token)).toEqual(1);
      container.bindFactory(token, () => 2);
      expect(container.get(token)).toEqual(2);
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
});
