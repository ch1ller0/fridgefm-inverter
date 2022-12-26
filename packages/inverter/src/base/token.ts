import { TokenViolationError } from './errors';
import type { Token } from './token.types';

/**
 * Method for creating tokens that get bound to providers later
 * @param description string literal describing your tokeen purpose
 */
export const createToken = <T>(description: string): Token.Instance<T> => ({ symbol: Symbol(description) });

/**
 * Set of token modifier functions
 */
export const modifyToken = {
  /**
   * Modifier for providing value that will be used as default if not provided.
   */
  defaultValue: <T, A extends Token.Instance<T>>(token: A, value: T) => {
    if (typeof token.defaultValue !== 'undefined') {
      throw new TokenViolationError(`Token "${token.symbol.description}" already has default value`, token);
    }

    return {
      ...token,
      symbol: Symbol(`${token.symbol.description}:__default__`),
      defaultValue: value,
    } as const;
  },
  /**
   * Modifier for making a token multiple. That means that they dont shadow each other but instead are passed as an array of `A[]`.
   * However they still need to be provided in a single manner as just `A`.
   */
  multi: <T extends Token.AnyInstance>(token: T) => {
    if (token.multi) {
      throw new TokenViolationError(`Token "${token.symbol.description}" is already multi`, token);
    }

    return {
      ...token,
      symbol: Symbol(`${token.symbol.description}:__multi__`),
      multi: true as const,
      defaultValue: (typeof token.defaultValue === 'undefined' ? [] : [token.defaultValue]) as Token.Provide<T>[],
    } as const;
  },
} as const;
