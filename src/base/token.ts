import type { Token, TokenOptions } from './token.types';

export const createToken = <T>(description: string, opts?: TokenOptions<T>): Token<T> => ({
  symbol: Symbol(description),
  optionalValue: opts?.optionalValue,
});
