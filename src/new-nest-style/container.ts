import { NOT_FOUND_SYMBOL } from './injectable';
import { TokenNotProvidedError, CyclicDepError } from './errors';
import { singleStorageFactory } from './storage/single';
import { multiStorageFactory } from './storage/multi';
import type { Container } from './container.types';
import type { Helper } from './injectable.types';
import type { Token } from './token.types';

const unwrapCfg = <T>(cfg: Helper.CfgElement<T>): { token: Token.Instance<T>; optional: boolean } => {
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
          return parent.resolveSingle(cfg, stack);
        }
      } else {
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
    resolveMany: <I extends Helper.CfgTuple>(
      cfgs?: I,
      stack?: Container.Stack,
    ): Promise<Helper.ResolvedDepTuple<I>> => {
      if (typeof cfgs === 'undefined') {
        // @ts-ignore
        return Promise.resolve([]);
      }
      // @ts-ignore
      return Promise.all(cfgs.map((cfg) => instance.resolveSingle(cfg, stack)));
    },
    bindValue: ({ token, value, injKey }) =>
      (!!token.multi ? multiStorage : singleStorage).bindValue({ token, value, injKey }),
    bindFactory: ({ token, func, injKey }) =>
      (!!token.multi ? multiStorage : singleStorage).bindFactory({ token, func, injKey }),
    parent,
  };

  return instance;
};
