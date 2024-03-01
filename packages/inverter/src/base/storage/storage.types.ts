import type { NOT_FOUND_SYMBOL } from '../injectable';
import type { Helper } from '../injectable.types';
import type { Container } from '../container.types';
import type { Token } from '../token.types';

/**
 * This is used to separate different implementations on the same token
 */
type InjectionKey = symbol;

/**
 * This is an interface for a mini-container that is supposed to hold its own values
 */
export type Storage = {
  /**
   * Caches the provided value inside the container
   */
  bindValue: <T extends Token.Instance<unknown>>(a: {
    token: T;
    value: Token.Provide<T>;
    injKey: InjectionKey;
  }) => void;
  /**
   * Binds a factory which is run on each token injection
   */
  bindFactory: <T extends Token.Instance<unknown>>(a: {
    token: T;
    func: (stack: Set<Token.AnyInstance>) => Token.Provide<T>;
    injKey: InjectionKey;
  }) => void;
  get: <I extends Token.AnyInstance>(
    token: I,
    stack: Container.Stack,
  ) => Helper.ResolvedDepSingle<I> | typeof NOT_FOUND_SYMBOL;
};
