import { declareContainer, injectable } from '../../../index';
import { providers, ROOT_TOKEN, HADNLER_TOKEN } from '../index';

describe('integration:calc-app', () => {
  const createHandlerInstance = () =>
    declareContainer({
      providers: [...providers, injectable({ provide: ROOT_TOKEN, useFactory: () => {} })],
    }).get(HADNLER_TOKEN);

  it('basic command chain', () => {
    const handler = createHandlerInstance();
    expect(handler('current', [])).toEqual(0);
    expect(handler('multiply', [17, 27])).toEqual(0);
    expect(handler('plus', [2]));
    expect(handler('multiply', [17, 27])).toEqual(918);
    expect(handler('minus', [300])).toEqual(618);
    expect(handler('divide', [3, 2])).toEqual(103);
    expect(handler('minus', [3])).toEqual(100);
    expect(() => {
      handler('bibka', [110]);
    }).toThrowError('Command bibka not found, use one of: "current,clear,plus,minus,multiply,divide"');
    expect(handler('clear', [3])).toEqual(0);
    expect(handler('plus', [100])).toEqual(100);
    expect(handler('divide', [0, 1])).toEqual(Infinity);
  });
});
