import { NOT_FOUND_SYMBOL } from './injectable';
import { TokenNotProvidedError, CyclicDepError } from './errors';
import type { TodoAny } from './util.types';
import type { Container } from './container.types';
import type { Helper } from './injectable.types';
import type { Token } from './token.types';

const unwrapCfg = <T>(cfg: Helper.CfgElement): { token: Token.Instance<T>; optional: boolean } => {
  if ('token' in cfg) {
    return cfg;
  }
  return { token: cfg, optional: false };
};

export const createContainer = (parent?: Container.Constructor): Container.Constructor => {
  const singleValues = new Map<symbol, TodoAny>();
  const singleFactories = new Map<symbol, (stack: Container.Stack) => Promise<TodoAny>>();
  const multiValues = new Map<symbol, TodoAny[]>();
  const multiFactories = new Map<symbol, ((stack: Container.Stack) => Promise<TodoAny>)[]>();

  const runRecord = <T extends TodoAny>(
    token: Token.Instance<T>,
    stack: Container.Stack,
  ): Promise<T> | typeof NOT_FOUND_SYMBOL => {
    // if (token.multi) {
    //   const multies = multiFactories.get(token.symbol);
    //   if (!!multies) {
    //     return Promise.all(multies.map((s) => s()));
    //   }
    // }
    const valueRecord = singleValues.get(token.symbol);
    if (!!valueRecord) {
      return Promise.resolve(valueRecord);
    }

    const factoryRecord = singleFactories.get(token.symbol);
    if (typeof factoryRecord !== 'undefined') {
      return factoryRecord(stack);
    }

    return NOT_FOUND_SYMBOL;
  };

  const instance: Container.Constructor = {
    // setDependencies: (forToken: Token.AnyInstance, cfgs?: Helper.CfgTuple = []) => {
    //   dependencyTree.set(
    //     forToken.symbol,
    //     cfgs?.reduce((acc, cur) => {
    //       const { token, optional } = unwrapCfg(cur);
    //       return optional ? acc : acc.add(token.symbol);
    //     }, new Set<symbol>()),
    //   );
    // },
    resolveSingle: <I extends Helper.CfgElement>(
      cfg: I,
      stack: Container.Stack = new Set(),
    ): Promise<Helper.ResolvedDepSingle<I>> => {
      const { token, optional } = unwrapCfg(cfg);
      if (stack.has(token)) {
        throw new CyclicDepError([...stack, token].map((s) => s.symbol));
      }

      const promiseFound = runRecord(token, stack);

      if (promiseFound === NOT_FOUND_SYMBOL) {
        if (typeof parent !== 'undefined') {
          // always search in the parent container, it is an expected behaviour by definition
          return parent.resolveSingle(cfg, stack);
        }
      } else {
        return promiseFound;
      }

      if (typeof token.defaultValue !== 'undefined') {
        // @ts-ignore
        return Promise.resolve(token.defaultValue);
      }
      if (optional) {
        // @ts-ignore
        return Promise.resolve(undefined);
      }

      return Promise.reject(new TokenNotProvidedError([...stack, token].map((s) => s.symbol)));
    },
    _resolveMany: (cfgs, stack) => {
      if (typeof cfgs === 'undefined') {
        return Promise.resolve([]);
      }
      return Promise.all(cfgs.map((cfg) => instance.resolveSingle(cfg, stack)));
    },
    bindValue: ({ symbol, multi }, value) => {
      if (!!multi) {
        const prevValues = multiValues.get(symbol) || [];
        multiValues.set(symbol, prevValues.concat(value));
        // multiFactories.set(
        //   symbol,
        //   prevValues.concat(() => Promise.resolve(value)),
        // );
      } else {
        singleValues.set(symbol, value);
        singleFactories.delete(symbol);
      }
    },
    bindFactory: ({ symbol, multi }, fn) => {
      if (!!multi) {
        multiFactories.set(symbol, (multiFactories.get(symbol) || []).concat(fn));
      } else {
        singleFactories.set(symbol, fn);
        singleValues.delete(symbol);
      }
    },
    parent,
  };

  return instance;
};
