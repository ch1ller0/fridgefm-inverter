import type { Container } from './container.types';
import type { Token } from './token.types';
import type { Injectable, Helper } from './injectable.types';

export const NOT_FOUND_SYMBOL = Symbol('__NOT_FOUND_SYMBOL__');

export const injectable = <T extends Token.Instance<unknown>, D extends Helper.CfgTuple>(
  args: Injectable.Args<T, D>,
): Injectable.Instance => {
  // unique injection key which is used to separate different providers in the container
  const injKey = Symbol();

  return (container) => {
    if (typeof args.useValue !== 'undefined') {
      const { useValue, provide } = args;
      return () => {
        container.binders.bindValue({ token: provide, value: useValue, injKey });
      };
    }

    if (typeof args.useFactory !== 'undefined') {
      const { useFactory, provide, scope = 'scoped', inject } = args;
      if (!!container.parent && scope === 'singleton' && !provide.multi) {
        // shortcut here - we dont want to bind factories again because it will override already cached values for parent
        return () => {};
      }

      const resolveMany = <I extends Helper.CfgTuple>(
        cfgs?: I,
        stack?: Container.Stack,
      ): Helper.ResolvedDepTuple<I> => {
        if (typeof cfgs === 'undefined') {
          return [];
        }
        return cfgs.map((cfg) => container.resolveSingle(cfg, stack));
      };

      if (scope === 'transient') {
        return () => {
          // run factory on each injection and recollect deps on global level
          container.binders.bindFactory({
            token: provide,
            injKey,
            func: (stack) => {
              stack.add(provide);
              const resolvedDeps = resolveMany(inject, stack);
              return useFactory(...resolvedDeps);
            },
          });
        };
      }

      return () => {
        container.binders.bindFactory({
          token: provide,
          injKey,
          func: (stack) => {
            stack.add(provide);
            const resolvedDeps = resolveMany(inject, stack);
            const value = useFactory(...resolvedDeps);
            container.binders.bindValue({ token: provide, value, injKey });
            return value;
          },
        });
      };
    }

    throw new Error('Incorrect args passed to injectable factory');
  };
};
