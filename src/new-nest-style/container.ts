import { NOT_FOUND_SYMBOL } from './injectable';
import { ResolverError } from './errors';
import type { TodoAny } from './util.types';
import type { Container } from './container.types';
import type { Helper } from './injectable.types';
import type { Token } from './token.types';

const unwrapCfg = <T>(
  cfg: Helper.CfgTuple[0],
): {
  token: Token.Instance<T>;
  optional: boolean;
} => {
  if ('token' in cfg) {
    return cfg;
  }
  return { token: cfg, optional: false };
};

export const createContainer = (parent?: Container.Constructor): Container.Constructor => {
  const values = new Map<symbol, unknown>();
  const factories = new Map<symbol, () => Promise<unknown>>();
  const multiFactories = new Map<symbol, (() => Promise<unknown>)[]>();

  const resolveSingle = (token: Token.AnyInstance) => {
    if (token.multi) {
      const multies = multiFactories.get(token.symbol);
      if (!!multies) {
        return Promise.all(multies.map((s) => s())) as Promise<Token.Provide<TodoAny>>;
      }
    }

    const valueRecord = values.get(token.symbol) as Token.Provide<TodoAny>;
    if (!!valueRecord) {
      return Promise.resolve(values.get(token.symbol));
    }
    const factoryRecord = factories.get(token.symbol);
    if (typeof factoryRecord !== 'undefined') {
      return factoryRecord();
    }
    if (token.defaultValue) {
      return Promise.resolve(token.defaultValue);
    }

    return NOT_FOUND_SYMBOL;
  };

  return {
    resolveBatch: <I extends Helper.CfgTuple>(tokens?: I): Promise<Helper.ResolvedDeps<I>> => {
      if (typeof tokens === 'undefined') {
        // @ts-ignore
        return Promise.resolve([]);
      }

      // @ts-ignore
      return Promise.all(
        tokens.map((cfg) => {
          const { token, optional } = unwrapCfg(cfg);
          const promiseFound = resolveSingle(token);
          if (promiseFound === NOT_FOUND_SYMBOL) {
            if (!!parent) {
              return parent.resolveBatch([token]);
            }
            if (optional) {
              return Promise.resolve(undefined);
            }
            throw new ResolverError(`Token not registered: "${token.symbol.description}"`, []);
          }
          return promiseFound;
        }),
      );
    },
    bindValue: ({ symbol, multi }, value) => {
      if (!!multi) {
        multiFactories.set(
          symbol,
          (multiFactories.get(symbol) || []).concat(() => Promise.resolve(value)),
        );
      } else {
        values.set(symbol, value);
      }
      factories.delete(symbol);
    },
    bindFactory: ({ symbol, multi }, fn) => {
      if (!!multi) {
        multiFactories.set(symbol, (multiFactories.get(symbol) || []).concat(fn));
      } else {
        factories.set(symbol, fn);
      }
      values.delete(symbol);
    },
    parent,
  };
};
