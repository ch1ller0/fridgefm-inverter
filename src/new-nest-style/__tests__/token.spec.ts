import { createToken, modifyToken } from '../token';

describe('tokens', () => {
  describe('createToken', () => {
    it('creates instance with symbol field', () => {
      const name = Math.random().toString().slice(2);
      const token = createToken<unknown>(name);
      expect(token).toEqual({ symbol: expect.any(Symbol) });
      expect(token.symbol.description).toEqual(name);
    });
  });

  describe('modifyToken', () => {
    const name = Math.random().toString().slice(2);
    const token = createToken<number>(name);

    it('optionalValue', () => {
      const optionalToken = modifyToken.optionalValue(token, 1);
      expect(optionalToken).toEqual({ symbol: expect.any(Symbol), optionalValue: 1 });
      expect(optionalToken.symbol).toEqual(token.symbol);
      expect(optionalToken.symbol.description).toEqual(name);
    });

    it('multi', () => {
      const multiToken = modifyToken.multi(token);
      expect(multiToken).toEqual({ symbol: expect.any(Symbol), multi: true });
      expect(multiToken.symbol).toEqual(token.symbol);
      expect(multiToken.symbol.description).toEqual(name);
    });

    it('combination', () => {
      const TIMES = 100;
      const modifiedToken = new Array(TIMES)
        .fill(undefined)
        .map((_, i) => i)
        .reduce((acc, cur) => {
          const MODIFIERS = [(t) => modifyToken.multi(t), (t) => modifyToken.optionalValue(t, cur)];
          const modifierIndex = cur % MODIFIERS.length;
          return MODIFIERS[modifierIndex](acc);
        }, token);
      expect(modifiedToken).toEqual({
        symbol: expect.any(Symbol),
        multi: true,
        optionalValue: TIMES - 1,
      });
      expect(modifiedToken.symbol).toEqual(token.symbol);
      expect(modifiedToken.symbol.description).toEqual(name);
    });
  });
});
