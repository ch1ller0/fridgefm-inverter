import { injectable } from '../injectable';
import { createToken } from '../token';
import type { Container } from '../container.types';

const createFakeContainer = (parent?: Container.Constructor) => ({
  parent,
  bindValue: jest.fn(),
  bindFactory: jest.fn(),
  resolveBatch: jest.fn(() => Promise.resolve([1]) as Promise<any>),
});

const parentContainer = createFakeContainer();
const childContainer = createFakeContainer(parentContainer);

const token1 = createToken<number>('num-1');
const token2 = createToken<number>('num-2');

describe.skip('injectable', () => {
  describe('type/useValue', () => {
    it('container/root', async () => {
      await injectable({ provide: token1, useValue: 99 })(parentContainer);
      // everything was cached by the root container because he has no parent
      expect(parentContainer.bindValue).toHaveBeenCalledTimes(1);
      expect(parentContainer.bindValue).toHaveBeenLastCalledWith(token1, 99);
      expect(parentContainer.bindFactory).toHaveBeenCalledTimes(0);
      expect(parentContainer.resolve).toHaveBeenCalledTimes(0);
    });

    it('container/child', async () => {
      await injectable({ provide: token1, useValue: 99 })(childContainer);
      // child container did not receive any values
      expect(childContainer.bindValue).toHaveBeenCalledTimes(0);
      expect(childContainer.bindFactory).toHaveBeenCalledTimes(0);
      expect(childContainer.resolve).toHaveBeenCalledTimes(0);
      // it was cached in its parent
      expect(parentContainer.bindValue).toHaveBeenCalledTimes(1);
      expect(parentContainer.bindValue).toHaveBeenLastCalledWith(token1, 99);
      expect(parentContainer.bindFactory).toHaveBeenCalledTimes(0);
    });
  });

  describe('type/useFactory', () => {
    describe('scope/transient', () => {
      describe('container/root', () => {
        it('deps/no', async () => {
          injectable({ provide: token1, useFactory: () => Math.random(), scope: 'transient' })(parentContainer);

          expect(parentContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(parentContainer.bindFactory).toHaveBeenCalledTimes(1);
          expect(parentContainer.bindFactory).toHaveBeenLastCalledWith(token1, expect.any(Function));
          const bindedFactory = parentContainer.bindFactory.mock.calls[0][1];
          const values = await Promise.all([bindedFactory(), bindedFactory()]);
          expect(parentContainer.resolve).toHaveBeenCalledTimes(0);
          // expect values to be different because the factory is transient
          expect(values[0]).not.toEqual(values[1]);
          expect(values[0]).toBeGreaterThan(0);
          expect(values[1]).toBeGreaterThan(0);
        });

        it('deps/some', async () => {
          parentContainer.resolve.mockImplementation(() => Promise.resolve(Math.random()));

          await injectable({
            provide: token1,
            useFactory: (v2) => v2 - 1,
            scope: 'transient',
            inject: [token2] as const,
          })(parentContainer);

          expect(parentContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(parentContainer.bindFactory).toHaveBeenCalledTimes(1);
          expect(parentContainer.bindFactory).toHaveBeenLastCalledWith(token1, expect.any(Function));
          expect(parentContainer.resolve).toHaveBeenCalledTimes(0);
          const bindedFactory = parentContainer.bindFactory.mock.calls[0][1];
          const values = await Promise.all([bindedFactory(), bindedFactory()]);
          // expect all values to be different because our dep is called transiently
          expect(values[0]).not.toEqual(values[1]);
          expect(values[0]).toBeLessThan(0);
          expect(values[1]).toBeLessThan(0);
          expect(parentContainer.resolve).toHaveBeenCalledTimes(2);
          expect(parentContainer.resolve).toHaveBeenLastCalledWith(token2);
        });
      });

      describe('container/child', () => {
        it('deps/no', async () => {
          await injectable({ provide: token1, useFactory: () => Math.random(), scope: 'transient' })(childContainer);

          // binded on the parent level
          expect(parentContainer.bindFactory).toHaveBeenCalledTimes(1);
          expect(parentContainer.bindFactory).toHaveBeenLastCalledWith(token1, expect.any(Function));
          expect(parentContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(childContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(childContainer.bindFactory).toHaveBeenCalledTimes(0);
          expect(childContainer.resolve).toHaveBeenCalledTimes(0);

          const bindedFactory = parentContainer.bindFactory.mock.calls[0][1];
          const values = await Promise.all([bindedFactory(), bindedFactory()]);
          expect(childContainer.resolve).toHaveBeenCalledTimes(0);
          expect(parentContainer.resolve).toHaveBeenCalledTimes(0);
          // expect values to be different because the factory is transient
          expect(values[0]).not.toEqual(values[1]);
          expect(values[0]).toBeGreaterThan(0);
          expect(values[1]).toBeGreaterThan(0);
        });

        it('deps/some', async () => {
          childContainer.resolve.mockImplementation(() => Promise.resolve(Math.random()));

          await injectable({
            provide: token1,
            useFactory: (v2) => v2 - 1,
            scope: 'transient',
            inject: [token2] as const,
          })(childContainer);

          // binded on the parent level
          expect(parentContainer.bindFactory).toHaveBeenCalledTimes(1);
          expect(parentContainer.bindFactory).toHaveBeenLastCalledWith(token1, expect.any(Function));
          expect(parentContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(parentContainer.resolve).toHaveBeenCalledTimes(0);
          expect(childContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(childContainer.bindFactory).toHaveBeenCalledTimes(0);
          expect(childContainer.resolve).toHaveBeenCalledTimes(0);

          const bindedFactory = parentContainer.bindFactory.mock.calls[0][1];
          const values = await Promise.all([bindedFactory(), bindedFactory()]);
          expect(parentContainer.resolve).toHaveBeenCalledTimes(0);
          // event though the value is binded on the parent level, it still uses resolved deps from child
          expect(childContainer.resolve).toHaveBeenCalledTimes(2);
          // expect values to be different because the factory is transient
          expect(values[0]).not.toEqual(values[1]);
          expect(values[0]).toBeLessThan(0);
          expect(values[1]).toBeLessThan(0);
        });
      });
    });

    describe('scope/scoped', () => {
      describe('container/root', () => {
        it.only('deps/no', async () => {
          await injectable({ provide: token1, useFactory: () => Math.random(), scope: 'scoped' })(parentContainer);

          expect(parentContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(parentContainer.bindFactory).toHaveBeenCalledTimes(1);
          expect(parentContainer.bindFactory).toHaveBeenLastCalledWith(token1, expect.any(Function));
          const bindedFactory = parentContainer.bindFactory.mock.calls[0][1];
          const values = await Promise.all([bindedFactory(), bindedFactory()]);
          console.log(bindedFactory);

          expect(parentContainer.resolve).toHaveBeenCalledTimes(0);
          // expect values to be different because the factory is scoped
          expect(values[0]).not.toEqual(values[1]);
          expect(values[0]).toBeGreaterThan(0);
          expect(values[1]).toBeGreaterThan(0);
        });
        it.todo('deps/some');
      });

      describe('container/child', () => {
        it.todo('deps/no');
        it.todo('deps/some');
      });
    });

    describe('scope/singleton', () => {
      describe('container/root', () => {
        it.todo('deps/no');
        it.todo('deps/some');
      });

      describe('container/child', () => {
        it.todo('deps/no');
        it.todo('deps/some');
      });
    });
  });
});
