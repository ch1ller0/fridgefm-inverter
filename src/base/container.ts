/* eslint-disable @typescript-eslint/no-use-before-define */
import { ResolverError } from './errors';
import { isInternalToken, INTERNAL_TOKENS, NOT_FOUND_SYMBOL, DEFAULT_SCOPE } from './internals';

import type { Container, ValuesMap, FactoriesMap, FactoryContext } from './container.types';
import type { Token } from './token.types';
import type { FactoryOptions } from '../module/provider.types';
import type { TodoAny } from './util.types';

/**
 * Creates a base container where each token and provider have to be manually binded to each other
 */
export const createBaseContainer = (parentContainer?: Container): Container => {
  const values: ValuesMap = new Map<symbol, TodoAny>();
  const factories: FactoriesMap = new Map<symbol, FactoryContext<TodoAny>>();

  const container: Container = {
    bindValue<T>(token: Token<T>, value: T): void {
      if (isInternalToken(token)) {
        return;
      }

      if (factories.has(token.symbol)) {
        factories.delete(token.symbol);
      }

      values.set(token.symbol, value);
    },
    bindFactory<T>(token: Token<T>, factory: (container: Container) => T, options?: FactoryOptions): void {
      if (isInternalToken(token)) {
        return;
      }

      if (values.has(token.symbol)) {
        values.delete(token.symbol);
      }

      factories.set(token.symbol, { factory, options });
    },
    hasToken(token: Token<unknown>): boolean {
      return values.has(token.symbol) || factories.has(token.symbol) || (parentContainer?.hasToken(token) ?? false);
    },
    get<T>(token: Token<T>): T | undefined {
      const value = resolver(token, container);
      if (value !== NOT_FOUND_SYMBOL) {
        return value;
      }

      if (token.optionalValue) {
        return token.optionalValue;
      }

      return undefined;
    },
    resolve<T>(token: Token<T>): T {
      const value = resolver(token, container);
      if (value !== NOT_FOUND_SYMBOL) {
        return value;
      }

      if (token.optionalValue) {
        return token.optionalValue;
      }

      throw new ResolverError(`Token "${token.symbol.description ?? ''}" is not provided`);
    },
  };

  function resolver<T>(token: Token<T>, origin: Container): T | typeof NOT_FOUND_SYMBOL {
    const arrivedValue = values.get(token.symbol);
    const hasValue = arrivedValue !== undefined || values.has(token.symbol);

    if (hasValue && origin === container) {
      return arrivedValue;
    }

    const factoryContext = factories.get(token.symbol);

    if (factoryContext) {
      const scope = factoryContext.options?.scope || DEFAULT_SCOPE;

      switch (scope) {
        case 'singleton': {
          if (hasValue) {
            return arrivedValue;
          } else if (parentContainer?.hasToken(token)) {
            break;
          } else {
            // Cache the value in the same container where the factory is registered.
            const value = factoryContext.factory(container);
            container.bindValue(token, value);
            return value;
          }
        }

        case 'scoped': {
          // Create a value within the origin container and cache it.
          const value = factoryContext.factory(origin);
          origin.bindValue(token, value);

          return value;
        }

        case 'transient': {
          // Create a value within the origin container and don't cache it.
          return factoryContext.factory(origin);
        }
      }
    }

    if (hasValue) {
      return arrivedValue;
    }

    const parentResolver = parentContainer?.get(INTERNAL_TOKENS.RESOLVER);
    if (parentResolver) {
      return parentResolver(token, origin);
    }

    return NOT_FOUND_SYMBOL;
  }

  const bindInternalTokens = () => {
    values.set(INTERNAL_TOKENS.CONTAINER.symbol, container);
    values.set(INTERNAL_TOKENS.RESOLVER.symbol, resolver);
    values.set(INTERNAL_TOKENS.FACTORIES_MAP.symbol, factories);

    if (parentContainer) {
      values.set(INTERNAL_TOKENS.PARENT_CONTAINER.symbol, parentContainer);
    }
  };

  bindInternalTokens();
  return container;
};
