import type { Token } from './token.types';
import type { TodoAny } from './util.types';

/**
 * Method for creating tokens that get bound to providers later
 * @param description string literal describing your tokeen purpose
 * @todo Add readonly modifier
 */
export const createToken = <T>(description: string): Token<T> => ({ symbol: Symbol(description) });

export const modifyToken = {
  /**
   * Modifier for providing value that will be used as default if not provided
   */
  optionalValue: <T, A extends Token<T>>(token: A, value: T) => ({ ...token, optionalValue: value }),
  /**
   * Modifier for making a token multiple - that means that they dont
   * shadow each other but instead are passed as an array
   */
  multi: <A extends Token<TodoAny>>(token: A) => ({ ...token, multi: true as const }),
} as const;
