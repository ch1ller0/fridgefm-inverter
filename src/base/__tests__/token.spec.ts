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

    it('basic defaultValue -> has corresponding fields', () => {
      const tokenWithDefault = modifyToken.defaultValue(token, 1);
      expect(tokenWithDefault).toEqual({ symbol: expect.any(Symbol), defaultValue: 1 });
      expect(tokenWithDefault.symbol).not.toEqual(token.symbol);
      expect(tokenWithDefault.symbol.description).toEqual(`${name}:__default__`);
    });

    it('basic multi -> has corresponding fields', () => {
      const multiToken = modifyToken.multi(token);
      expect(multiToken).toEqual({ symbol: expect.any(Symbol), multi: true, defaultValue: [] });
      expect(multiToken.symbol).not.toEqual(token.symbol);
      expect(multiToken.symbol.description).toEqual(`${name}:__multi__`);
    });

    describe('combination', () => {
      it('double default -> fails', () => {
        const tokenWithDefault = modifyToken.defaultValue(token, 2);
        expect(() => {
          modifyToken.defaultValue(tokenWithDefault, 1);
        }).toThrowError('already has default value');
      });

      it('double multi -> fails', () => {
        const multiToken = modifyToken.multi(token);
        expect(() => {
          modifyToken.multi(multiToken);
        }).toThrowError('is already multi');
      });

      it('making multi token default -> fails', () => {
        const multiToken = modifyToken.multi(token);
        expect(() => {
          modifyToken.defaultValue(multiToken, 1);
        }).toThrowError('already has default value');
      });

      it('making default token multi -> does not fail', () => {
        const tokenWithDefault = modifyToken.defaultValue(token, 5);
        const multiTokenWithDefault = modifyToken.multi(tokenWithDefault);
        expect(multiTokenWithDefault).toEqual({ symbol: expect.any(Symbol), defaultValue: [5], multi: true });
      });
    });
  });
});
