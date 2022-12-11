import { injectable } from '../injectable';
import { createToken } from '../token';
import { createContainer } from '../container';
import type { Container } from '../container.types';

const rootContainer = createContainer();
const childContainer = createContainer(rootContainer);

const token1 = createToken<number>('num-1');
const token2 = createToken<number>('num-2');

describe('injectable', () => {
  describe('type/useValue', () => {
    it('container/root', async () => {
      injectable({ provide: token1, useValue: 99 })(rootContainer)();
      // everything was cached by the root container because he has no parent
      expect(rootContainer.bindValue).toHaveBeenCalledTimes(1);
      expect(rootContainer.bindValue).toHaveBeenLastCalledWith(token1, 99);
      expect(rootContainer.bindFactory).toHaveBeenCalledTimes(0);
      expect(rootContainer.resolveBatch).toHaveBeenCalledTimes(0);
    });

    it('container/child', async () => {
      injectable({ provide: token1, useValue: 99 })(childContainer)();
      // child container received all the values
      expect(childContainer.bindValue).toHaveBeenCalledTimes(1);
      expect(childContainer.bindValue).toHaveBeenLastCalledWith(token1, 99);
      expect(childContainer.bindFactory).toHaveBeenCalledTimes(0);
      expect(childContainer.resolveBatch).toHaveBeenCalledTimes(0);
      // it was not cached in its parent
      expect(rootContainer.bindValue).toHaveBeenCalledTimes(0);
      expect(rootContainer.bindFactory).toHaveBeenCalledTimes(0);
      expect(rootContainer.resolveBatch).toHaveBeenCalledTimes(0);
    });
  });

  describe('type/useFactory', () => {
    describe('scope/transient', () => {
      describe('container/root', () => {
        it('deps/no', async () => {
          injectable({ provide: token1, useFactory: () => Math.random(), scope: 'transient' })(rootContainer)();
          const first = await rootContainer.resolveSingle(token1);
          const second = await rootContainer.resolveSingle(token1);

          expect(first).toEqual(expect.any(Number));
          expect(second).toEqual(expect.any(Number));
          expect(first).not.toEqual(second);
        });

        it('deps/some', async () => {
          rootContainer.resolveBatch.mockImplementation(() => Promise.resolve([Math.random()]));
          injectable({
            provide: token1,
            useFactory: (v2) => v2 - 1,
            scope: 'transient',
            inject: [token2] as const,
          })(rootContainer)();

          expect(rootContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(rootContainer.bindFactory).toHaveBeenCalledTimes(1);
          expect(rootContainer.bindFactory).toHaveBeenLastCalledWith(token1, expect.any(Function));
          expect(rootContainer.resolveBatch).toHaveBeenCalledTimes(0);
          const bindedFactory = rootContainer.bindFactory.mock.calls[0][1];
          const values = await Promise.all([bindedFactory(), bindedFactory()]);
          // expect all values to be different because our dep is called transiently
          expect(values[0]).not.toEqual(values[1]);
          expect(values[0]).toBeLessThan(0);
          expect(values[1]).toBeLessThan(0);
          expect(rootContainer.resolveBatch).toHaveBeenCalledTimes(2);
          expect(rootContainer.resolveBatch).toHaveBeenLastCalledWith([token2]);
        });
      });

      describe('container/child', () => {
        it('deps/no', async () => {
          injectable({ provide: token1, useFactory: () => Math.random(), scope: 'transient' })(childContainer)();

          // binded on the parent level
          expect(rootContainer.bindFactory).toHaveBeenCalledTimes(1);
          expect(rootContainer.bindFactory).toHaveBeenLastCalledWith(token1, expect.any(Function));
          expect(rootContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(childContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(childContainer.bindFactory).toHaveBeenCalledTimes(0);
          expect(childContainer.resolveBatch).toHaveBeenCalledTimes(0);

          const bindedFactory = rootContainer.bindFactory.mock.calls[0][1];
          const values = await Promise.all([bindedFactory(), bindedFactory()]);
          expect(childContainer.resolveBatch).toHaveBeenCalledTimes(2);
          expect(rootContainer.resolveBatch).toHaveBeenCalledTimes(0);
          // expect values to be different because the factory is transient
          expect(values[0]).not.toEqual(values[1]);
          expect(values[0]).toBeGreaterThan(0);
          expect(values[1]).toBeGreaterThan(0);
        });

        it('deps/some', async () => {
          childContainer.resolveBatch.mockImplementation(() => Promise.resolve([Math.random()]));
          injectable({
            provide: token1,
            useFactory: (v2) => v2 - 1,
            scope: 'transient',
            inject: [token2] as const,
          })(childContainer)();

          // binded on the parent level
          expect(rootContainer.bindFactory).toHaveBeenCalledTimes(1);
          expect(rootContainer.bindFactory).toHaveBeenLastCalledWith(token1, expect.any(Function));
          expect(rootContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(rootContainer.resolveBatch).toHaveBeenCalledTimes(0);
          expect(childContainer.bindValue).toHaveBeenCalledTimes(0);
          expect(childContainer.bindFactory).toHaveBeenCalledTimes(0);
          expect(childContainer.resolveBatch).toHaveBeenCalledTimes(0);

          const bindedFactory = rootContainer.bindFactory.mock.calls[0][1];
          const values = await Promise.all([bindedFactory(), bindedFactory()]);
          expect(rootContainer.resolveBatch).toHaveBeenCalledTimes(0);
          // event though the value is binded on the parent level, it still uses resolved deps from child
          expect(childContainer.resolveBatch).toHaveBeenCalledTimes(2);
          // expect values to be different because the factory is transient
          expect(values[0]).not.toEqual(values[1]);
          expect(values[0]).toBeLessThan(0);
          expect(values[1]).toBeLessThan(0);
        });
      });
    });

    describe('scope/scoped', () => {
      describe('container/root', () => {
        it('deps/no', async () => {
          injectable({ provide: token1, useFactory: () => Math.random(), scope: 'scoped' })(rootContainer)();
          const [first, second] = await Promise.all([
            rootContainer.resolveSingle(token1),
            rootContainer.resolveSingle(token1),
          ]);
          // @TODO it might become a problem one day
          // if we resolve them simultaneously, they are equal because the resolver is async, but creating a promise is sync
          expect(first).not.toEqual(second);
          // however if we have set the value
          const [third, fourth] = await Promise.all([
            rootContainer.resolveSingle(token1),
            rootContainer.resolveSingle(token1),
          ]);
          expect(third).toEqual(second);
          expect(fourth).toEqual(second);
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
