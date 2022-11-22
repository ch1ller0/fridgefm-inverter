import type { NOT_FOUND_SYMBOL } from './internals';
import type { Token, TokenDecProvide, TokenProvide } from './token.types';
import type { TodoAny } from './util.types';
import type { FactoryOptions } from '../module/provider.types';

/**
 * Dependency container.
 */
export type Container = {
  /**
   * Binds a value for the token
   */
  bindValue<T extends Token<unknown> = Token<unknown>>(token: T, value: TokenProvide<T>): void;
  /**
   * Binds a factory for the token.
   */
  bindFactory<T extends Token<unknown> = Token<unknown>>(
    token: T,
    factory: (container: Container) => TokenProvide<T>,
    options?: FactoryOptions,
  ): void;
  /**
   * Binds an async factory for the token. It always has a 'singleton' scope.
   */
  bindAsyncFactory<T extends Token<unknown> = Token<unknown>>(
    token: T,
    factory: (container: Container) => Promise<TokenProvide<T>>,
  ): void;
  /**
   * Checks if the token is registered in the container hierarchy.
   */
  hasToken(token: Token<unknown>): boolean;
  /**
   * Returns a resolved value by the token, or throws a ResolverError if token not provided.
   */
  get<A extends Token<TodoAny>>(token: A): Promise<TokenProvide<A>>;
  /**
   * Returns a resolved value by the token, or return NOT_FOUND_SYMBOL in case the token is not provided.
   */
  resolve<A extends Token<TodoAny>>(token: A): Promise<TokenDecProvide<A>> | typeof NOT_FOUND_SYMBOL;
};

/** @internal */
export type FactoryContext<T> = {
  factory: (container: Container) => T;
  options?: FactoryOptions;
};
export type MultiRecord<T> =
  | {
      factory: (container: Container) => T;
      scope?: FactoryOptions['scope'];
    }
  | { value: T };
/** @internal */
export type ValuesMap = Map<symbol, TodoAny>;
/** @internal */
export type FactoriesMap = Map<symbol, FactoryContext<TodoAny>>;
/** @internal */
export type MultiesMap = Map<symbol, MultiRecord<TodoAny>[]>;
/** @internal */
export type Resolver = <T>(token: Token<T>, origin: Container) => T | typeof NOT_FOUND_SYMBOL;
