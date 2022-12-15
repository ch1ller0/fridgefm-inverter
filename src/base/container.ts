import { NOT_FOUND_SYMBOL } from './injectable';
import { TokenNotProvidedError, CyclicDepError } from './errors';
import { singleStorageFactory } from './storage/single';
import { multiStorageFactory } from './storage/multi';
import type { Container } from './container.types';
import type { Helper } from './injectable.types';

const unwrapCfg = <T>(cfg: Helper.CfgElement<T>) => {
  if ('token' in cfg) {
    return cfg;
  }
  return { token: cfg, optional: false };
};

export const createContainer = (parent?: Container.Constructor): Container.Constructor => {
  const singleStorage = singleStorageFactory();
  const multiStorage = multiStorageFactory();
  const instance: Container.Constructor = {
    resolveSingle: <I extends Helper.CfgElement>(
      cfg: I,
      stack: Container.Stack = new Set(),
    ): Promise<Helper.ResolvedDepSingle<I>> => {
      const { token, optional } = unwrapCfg(cfg);
      if (stack.has(token)) {
        throw new CyclicDepError([...stack, token].map((s) => s.symbol));
      }

      const promiseFound = (!!token.multi ? multiStorage : singleStorage).get(token, stack);
      if (promiseFound === NOT_FOUND_SYMBOL) {
        if (typeof parent !== 'undefined') {
          // always search in the parent container, it is an expected behaviour by definition
          return parent.resolveSingle(cfg);
        }
      } else {
        stack.delete(token);
        return promiseFound;
      }

      if (typeof token.defaultValue !== 'undefined') {
        return Promise.resolve(token.defaultValue);
      }
      if (!!optional) {
        // @ts-ignore
        return Promise.resolve(undefined);
      }

      return Promise.reject(new TokenNotProvidedError([...stack, token].map((s) => s.symbol)));
    },
    bindValue: ({ token, ...rest }) => (!!token.multi ? multiStorage : singleStorage).bindValue({ token, ...rest }),
    bindFactory: ({ token, ...rest }) => (!!token.multi ? multiStorage : singleStorage).bindFactory({ token, ...rest }),
    parent,
  };

  return instance;
};
