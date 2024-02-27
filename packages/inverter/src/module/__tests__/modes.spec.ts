import { createToken, createContainer, injectable, modifyToken } from '../../index';

const V1 = createToken<string>('async');
const V_MULTI = modifyToken.multi(createToken<string>('multi-async'));
const ROOT = createToken<string>('root');

const providers = [
  injectable({ provide: V1, useFactory: () => 'v1' }),
  injectable({ provide: V_MULTI, useFactory: () => 'v2' }),
  injectable({ provide: V_MULTI, useFactory: () => 'v3' }),
  injectable({
    provide: ROOT,
    // @TODO it should not let me get awaited values, but rather real ones
    useFactory: (asyncValue, asyncMulti) => {
      return [asyncValue, ...asyncMulti, 'root'].join('|');
      //   return Promise.all([asyncValue, ...asyncMulti]).then((values) => {
      //     return [...values, 'root'].join('|');
      //   });
    },
    inject: [V1, V_MULTI] as const,
  }),
];

describe('different modes', () => {
  it('async mode', async () => {
    const container = createContainer({ providers });
    const finalValue = container.get(ROOT);

    expect(finalValue.then).toBeDefined();
    expect(await finalValue).toEqual('v1|v2|v3|root');
  });

  it('sync mode', () => {
    const container = createContainer({ providers, mode: 'sync' });

    const finalValue = container.get(ROOT);
    expect(finalValue.then).toBeUndefined();
  });
});
