/* eslint-disable @typescript-eslint/no-use-before-define */
import { isInternalToken, INTERNAL_TOKENS, NOT_FOUND_SYMBOL, DEFAULT_SCOPE } from './internals';

import type { Container, ValuesMap, FactoriesMap, MultiesMap, FactoryContext } from './container.types';
import type { Token, TokenProvide } from './token.types';
import type { FactoryOptions } from '../module/provider.types';
import type { TodoAny } from './util.types';

/**
 * Creates a base container where each token and provider have to be manually binded to each other
 */
export const createBaseContainer = (parentContainer?: Container): Container => {
  const values: ValuesMap = new Map<symbol, TodoAny>();
  const factories: FactoriesMap = new Map<symbol, FactoryContext<TodoAny>>();
  const multies: MultiesMap = new Map<symbol, FactoryContext<TodoAny>[]>();

  const container: Container = {
    bindValue<T>(token: Token<T>, value: T): void {
      if (isInternalToken(token)) {
        return;
      }

      if (token.multi) {
        const prevMulties = multies.get(token.symbol) || [];
        multies.set(token.symbol, [...prevMulties, { value }]);
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

      if (token.multi) {
        const prevMulties = multies.get(token.symbol) || [];
        multies.set(token.symbol, [...prevMulties, { factory, scope: options?.scope }]);
        return;
      }

      factories.set(token.symbol, { factory, options });
    },
    hasToken(token: Token<unknown>): boolean {
      return values.has(token.symbol) || factories.has(token.symbol) || (parentContainer?.hasToken(token) ?? false);
    },
    get<A extends Token<TodoAny>>(token: A): TokenProvide<A> | undefined {
      const value = resolver(token, container);
      if (value !== NOT_FOUND_SYMBOL) {
        return value;
      }

      if (token.optionalValue) {
        return token.optionalValue;
      }

      return undefined;
    },
    resolve<A extends Token<TodoAny>>(token: A): TokenProvide<A> | typeof NOT_FOUND_SYMBOL {
      const value = resolver(token, container);
      if (value !== NOT_FOUND_SYMBOL) {
        return value;
      }

      if (token.optionalValue) {
        return token.optionalValue;
      }

      return NOT_FOUND_SYMBOL;
    },
  };

  function resolver<T>(token: Token<T>, origin: Container): T | T[] | typeof NOT_FOUND_SYMBOL {
    if (token.multi) {
      const findInParent = () => {
        const parentResolver = parentContainer?.get(INTERNAL_TOKENS.RESOLVER);
        if (parentResolver) {
          const resolved = parentResolver(token, origin);
          return Array.isArray(resolved) ? resolved : ([] as T[]);
        }
        return [] as T[];
      };
      const multiFactories = multies.get(token.symbol);

      if (typeof multiFactories === 'undefined') {
        return findInParent();
      }

      const resolved = multiFactories.map((multiRecord, index) => {
        if ('value' in multiRecord) {
          return multiRecord.value;
        }

        const scope = multiRecord.scope || DEFAULT_SCOPE;
        if (scope === 'singleton') {
          // if it is a singleton - cache it
          const value = multiRecord.factory(container);
          multiFactories[index] = { value };
          return value;
        }

        return multiRecord.factory(container);
      });

      return [...resolved, ...findInParent()];
    }

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
