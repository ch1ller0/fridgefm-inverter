import { createContainer } from '../container';
import { createToken } from '../token';
import { injectable } from '../injectable';

const delay = (to: number) => new Promise((res) => setTimeout(res, to));

describe('resolver', () => {
  it('really long chain', async () => {
    const mockFactory = jest.fn((prev) => Promise.resolve().then(() => prev + 2));
    const container = createContainer();
    const tokens = new Array(500).fill(undefined).map((_, i) => createToken<number>(`tok${i}`));
    const providers = tokens.map((tok, index) =>
      index === tokens.length - 1
        ? injectable({ provide: tok, useFactory: () => Promise.resolve().then(() => 2) })
        : injectable({ provide: tok, useFactory: mockFactory, inject: [tokens[index + 1]] }),
    );

    providers.forEach((prov) => {
      prov(container)();
    });

    const res1 = await container.resolveSingle(tokens[0]);
    expect(mockFactory).toHaveBeenCalledTimes(tokens.length - 1);
    expect(res1).toEqual(1000);
    const res2 = await container.resolveSingle(tokens[0]);
    expect(res2).toEqual(1000);
    expect(mockFactory).toHaveBeenCalledTimes(tokens.length - 1);
  });

  it('failing dependency -> the whole chain fails', async () => {
    expect.assertions(1);
    const container = createContainer();
    const t1 = createToken<number>('tok-1');
    const t2 = createToken<number>('tok-2');
    const t3 = createToken<number>('tok-3');

    injectable({ provide: t3, useFactory: (prev) => prev + 10, inject: [t2] })(container)();
    injectable({ provide: t2, useFactory: (prev) => prev + 10, inject: [t1] })(container)();
    injectable({ provide: t1, useFactory: () => delay(20).then(() => Promise.reject(new Error('Bibka'))) })(
      container,
    )();

    try {
      await container.resolveSingle(t3);
    } catch (e) {
      expect(e.message).toEqual('Bibka');
    }
  });

  describe('different trees', () => {
    describe('diamonds', () => {
      const troot = createToken<number>('tok-root');
      const t1 = createToken<number>('tok1');
      const t2 = createToken<number>('tok2');
      const t3 = createToken<number>('tok3');

      it('diamond dependency', async () => {
        const container = createContainer();
        injectable({ provide: troot, useFactory: (v1, v2) => v1 + v2, inject: [t1, t2] })(container)();
        injectable({ provide: t1, useFactory: (v3) => v3 + 1, inject: [t3] })(container)();
        injectable({ provide: t2, useFactory: (v3) => v3 + 10, inject: [t3] })(container)();
        injectable({ provide: t3, useFactory: () => 100 })(container)();

        const vroot = await container.resolveSingle(troot);
        expect(vroot).toEqual(211);
        const v1 = await container.resolveSingle(t1);
        expect(v1).toEqual(101);
      });

      it('diamond cyclic dependency', async () => {
        const container = createContainer();
        injectable({ provide: troot, useFactory: (v1, v2) => v1 + v2, inject: [t1, t2] })(container)();
        injectable({ provide: t1, useFactory: (v3) => v3 + 1, inject: [t3] })(container)();
        injectable({ provide: t2, useFactory: (v3) => v3 + 10, inject: [t3] })(container)();
        injectable({ provide: t3, useFactory: (v1d) => v1d + 10, inject: [t1] })(container)();

        try {
          await container.resolveSingle(troot);
        } catch (e) {
          expect(e.message).toEqual(`Cyclic dependency detected for token: "tok1",
  stack: "tok-root" -> "tok1" -> "tok3" -> "tok1"`);
        }
      });
    });
  });

  describe('hard violations', () => {
    it('fail with good trace when token not provided', async () => {
      // expect.assertions(3);
      const mockFactory = jest.fn((prev) => delay(10).then(() => prev + 2));
      const container = createContainer();
      const tokens = new Array(10).fill(undefined).map((_, i) => createToken<number>(`tok${i}`));
      const providers = tokens.map((tok, index) => {
        const nextToken = tokens[index + 1];
        return nextToken
          ? injectable({ provide: tok, useFactory: mockFactory, inject: [nextToken] })
          : injectable({ provide: tok, useFactory: () => 100 });
      });

      providers.forEach((prov, index) => {
        // provied everything except for the middle token
        if (index !== tokens.length / 2) {
          prov(container)();
        }
      });

      try {
        await container.resolveSingle(tokens[0]);
      } catch (e) {
        // anything that depends on the middle token is failing
        expect(e.message).toEqual(`Token \"tok5\" was not provided,
  stack: \"tok0\" -> \"tok1\" -> \"tok2\" -> \"tok3\" -> \"tok4\" -> \"tok5\"`);
      }

      try {
        await container.resolveSingle(tokens[4]);
      } catch (e) {
        // anything that depends on the middle token is failing
        // @TODO however the stack is incorrect, should be only tok4 -> tok5
        expect(e.message).toEqual(`Token \"tok5\" was not provided,
  stack: \"tok0\" -> \"tok1\" -> \"tok2\" -> \"tok3\" -> \"tok4\" -> \"tok5\"`);
      }

      // however for the rest tokens it works ok
      const res = await Promise.all([
        container.resolveSingle(tokens[tokens.length - 1]),
        container.resolveSingle(tokens[tokens.length - 2]),
        container.resolveSingle(tokens[tokens.length - 3]),
      ]);
      expect(res).toEqual([100, 102, 104]);
    });

    it('recursive -> fails with dep stack', async () => {
      const mockFactory = jest.fn((prev) => Promise.resolve().then(() => prev + 2));
      const container = createContainer();
      const tokens = new Array(5).fill(undefined).map((_, i) => createToken<number>(`tok${i}`));
      const providers = tokens.map((tok, index) =>
        index === tokens.length - 1
          ? injectable({ provide: tok, useFactory: (first) => first + 2, inject: [tokens[0]] })
          : injectable({ provide: tok, useFactory: mockFactory, inject: [tokens[index + 1]] }),
      );

      providers.forEach((prov) => {
        prov(container)();
      });

      try {
        await container.resolveSingle(tokens[0]);
      } catch (e) {
        expect(e.message).toEqual(`Cyclic dependency detected for token: "tok0",
  stack: "tok0" -> "tok1" -> "tok2" -> "tok3" -> "tok4" -> "tok0"`);
      }

      try {
        await container.resolveSingle(tokens[3]);
      } catch (e) {
        expect(e.message).toEqual(`Cyclic dependency detected for token: "tok3",
  stack: "tok3" -> "tok4" -> "tok0" -> "tok1" -> "tok2" -> "tok3"`);
      }
    });
  });
});
