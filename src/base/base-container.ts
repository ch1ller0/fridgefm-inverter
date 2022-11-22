/* eslint-disable @typescript-eslint/no-use-before-define */
import { isInternalToken, INTERNAL_TOKENS, NOT_FOUND_SYMBOL, DEFAULT_SCOPE } from './internals';
import { ResolverError } from './errors';

import type { Container, ValuesMap, FactoriesMap, MultiesMap, FactoryContext } from './base-container.types';
import type { Token } from './token.types';
import type { TodoAny } from './util.types';

/**
 * Creates a base container where each token and provider have to be manually binded to each other
 */
export const createBaseContainer = (parentContainer?: Container): Container => {
  const values: ValuesMap = new Map<symbol, TodoAny>();
  const factories: FactoriesMap = new Map<symbol, FactoryContext<TodoAny>>();
  const multies: MultiesMap = new Map<symbol, FactoryContext<TodoAny>[]>();

  const container: Container = {
    bindValue(token, value) {
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
    bindFactory(token, factory, options) {
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
    bindAsyncFactory(token, factory) {
      if (isInternalToken(token)) {
        return;
      }

      if (values.has(token.symbol)) {
        values.delete(token.symbol);
      }

      if (token.multi) {
        const prevMulties = multies.get(token.symbol) || [];
        multies.set(token.symbol, [...prevMulties, { factory, scope: 'singleton' }]);
        return;
      }

      factories.set(token.symbol, { factory, options: { scope: 'singleton' } });
    },
    hasToken(token) {
      return values.has(token.symbol) || factories.has(token.symbol) || (parentContainer?.hasToken(token) ?? false);
    },
    async get(token) {
      const value = await resolver(token, container);
      if (value !== NOT_FOUND_SYMBOL) {
        return value;
      }

      if (token.optionalValue) {
        return token.optionalValue;
      }

      throw new ResolverError([token]);
    },
    async resolve(token) {
      const value = await resolver(token, container);
      if (value !== NOT_FOUND_SYMBOL) {
        return value;
      }

      if (token.optionalValue) {
        return token.optionalValue;
      }

      return NOT_FOUND_SYMBOL;
    },
  };

  async function resolver<T>(token: Token<T>, origin: Container): Promise<T | T[] | typeof NOT_FOUND_SYMBOL> {
    if (token.multi) {
      const findInParent = async () => {
        const parentResolver = await parentContainer?.get(INTERNAL_TOKENS.RESOLVER);
        if (parentResolver) {
          const resolved = await parentResolver(token, origin);
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

      return findInParent().then((resolvedFromParent) => [...resolved, ...resolvedFromParent]);
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

    const parentResolver = await parentContainer?.get(INTERNAL_TOKENS.RESOLVER);
    if (parentResolver) {
      return parentResolver(token, origin);
    }

    return Promise.resolve(NOT_FOUND_SYMBOL);
  }

  const bindInternalTokens = () => {
    values.set(INTERNAL_TOKENS.CONTAINER.symbol, container);
    values.set(INTERNAL_TOKENS.RESOLVER.symbol, resolver);

    if (parentContainer) {
      values.set(INTERNAL_TOKENS.PARENT_CONTAINER.symbol, parentContainer);
    }
  };

  bindInternalTokens();
  return container;
};
