import { NOT_FOUND_SYMBOL } from './injectable';
import { TokenNotProvidedError, CyclicDepError } from './errors';
import { createStorage } from './storage/index';
import type { Token } from './token.types';
import type { Container } from './container.types';
import type { Helper } from './injectable.types';

const unwrapCfg = <T>(
  cfg: Helper.CfgElement<T>,
): {
  token: Token.Instance<T>;
  optional: boolean;
} => {
  if ('token' in cfg) {
    return cfg;
  }
  return { token: cfg, optional: false };
};

export const createBaseContainer = (parent?: Container.Constructor): Container.Constructor => {
  const storage = createStorage();

  const instance: Container.Constructor = {
    binders: {
      bindValue: (a) => storage.bindValue(a),
      bindFactory: (a) => storage.bindFactory(a),
    },
    resolveSingle: <I extends Helper.CfgElement>(
      cfg: I,
      stack: Container.Stack = new Set(),
    ): Helper.ResolvedDepSingle<I> => {
      const { token, optional } = unwrapCfg(cfg);
      if (stack.has(token)) {
        throw new CyclicDepError([...stack, token].map((s) => s.symbol));
      }

      const resolvedValue = storage.get(token, stack);
      if (resolvedValue === NOT_FOUND_SYMBOL) {
        if (typeof parent !== 'undefined') {
          // always search in the parent container, it is an expected behaviour by definition
          return parent.resolveSingle(cfg);
        }
      } else {
        stack.delete(token);
        return resolvedValue;
      }

      if (typeof token.defaultValue !== 'undefined') {
        return token.defaultValue;
      }
      if (!!optional) {
        // @ts-expect-error it is fine
        return undefined;
      }

      throw new TokenNotProvidedError([...stack, token].map((s) => s.symbol));
    },
    resolveMany: <I extends Helper.CfgTuple>(cfgs?: I, stack?: Container.Stack): Helper.ResolvedDepTuple<I> => {
      if (typeof cfgs === 'undefined') {
        return [] as Helper.ResolvedDepTuple<I>;
      }
      // @ts-expect-error the type is even wider
      return cfgs.map((cfg) => instance.resolveSingle(cfg, stack));
    },
    parent,
  };

  return instance;
};
