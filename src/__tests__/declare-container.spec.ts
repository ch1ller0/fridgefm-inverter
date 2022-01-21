import { createToken } from '../base/token';
import { injectable } from '../module/provider';
import { declareContainer } from '../module/modules';

describe('declareContainer', () => {
  it('simple chain', () => {
    const v1token = createToken<{ a: number; b: number }>('value1');
    const v2token = createToken<{ a: number; c: number }>('value2');
    const f1token = createToken<{ a: number; b: number; c: number }>('factory1');
    const f2token = createToken<{ a: number; b: number; c: number }>('factory2');
    const v1provider = injectable({ provide: v1token, useValue: { a: 1, b: 2 } });
    const v2provider = injectable({ provide: v2token, useValue: { a: 2, c: 3 } });
    const f1provider = injectable({
      provide: f1token,
      inject: [v1token, v2token] as const,
      useFactory: (v1, v2) => ({
        a: v1.a + v2.a,
        b: v1.b + 10,
        c: v2.c + 20,
      }),
    });
    const f2provider = injectable({
      provide: f2token,
      inject: [f1token] as const,
      useFactory: (v1) => ({
        a: v1.a + 10,
        b: v1.b + 20,
        c: v1.c + 30,
      }),
    });
    const providers = [v1provider, v2provider, f1provider, f2provider];

    const cont1 = declareContainer({ providers });
    expect(cont1.get(f1token)).toEqual({ a: 3, b: 12, c: 23 });
    expect(cont1.get(f2token)).toEqual({ a: 13, b: 32, c: 53 });

    const cont2 = declareContainer({ providers: providers.reverse() });
    expect(cont2.get(f1token)).toEqual({ a: 3, b: 12, c: 23 });
    expect(cont2.get(f2token)).toEqual({ a: 13, b: 32, c: 53 });
  });

  it.todo('parent container');

  it('cyclic dependency', () => {
    expect.assertions(2);
    const f1token = createToken<{ a: number }>('1');
    const f2token = createToken<{ a: number }>('2');
    const f3token = createToken<{ a: number }>('3');

    const f1prov = injectable({
      provide: f1token,
      inject: [f2token] as const,
      useFactory: (value) => ({ a: value.a }),
    });
    const f2prov = injectable({
      provide: f2token,
      inject: [f3token] as const,
      useFactory: (value) => ({ a: value.a }),
    });
    const f3prov = injectable({
      provide: f3token,
      inject: [f1token] as const,
      useFactory: (value) => ({ a: value.a }),
    });
    const container = declareContainer({ providers: [f1prov, f2prov, f3prov] });

    try {
      container.get(f3token);
    } catch (e) {
      expect(e.message).toEqual('Cyclic dependency for token: 3, stack: 3 -> 2 -> 1 -> 3');
      expect(e.depStack).toEqual([f3token, f2token, f1token, f3token]);
    }
  });

  it('token not provided', () => {
    expect.assertions(2);
    const f1token = createToken<{ a: number }>('1');
    const f2token = createToken<{ a: number }>('2');
    const f3token = createToken<{ a: number }>('3');

    const f1prov = injectable({
      provide: f1token,
      inject: [f2token] as const,
      useFactory: (value) => ({ a: value.a }),
    });
    const f2prov = injectable({
      provide: f2token,
      inject: [f3token] as const,
      useFactory: (value) => ({ a: value.a }),
    });
    const container = declareContainer({ providers: [f1prov, f2prov] });

    try {
      container.get(f1token);
    } catch (e) {
      // @TODO does not take root into account, should fix this
      expect(e.message).toEqual('Token "3" is not provided, stack: 2 -> 3');
      expect(e.depStack).toEqual([f2token, f3token]);
    }
  });
});
