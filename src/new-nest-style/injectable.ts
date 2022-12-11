import type { Token } from './token.types';
import type { Injectable, Helper } from './injectable.types';

export const NOT_FOUND_SYMBOL = Symbol('__NOT_FOUND_SYMBOL__');

export const injectable =
  <T extends Token.Instance<unknown>, D extends Helper.CfgTuple>(
    args: Injectable.SyncArgs<T, D>,
  ): Injectable.Instance =>
  (container) => {
    if (typeof args.useValue !== 'undefined') {
      const { useValue, provide } = args;
      return () => {
        container.bindValue(provide, useValue);
      };
    }

    if (typeof args.useFactory !== 'undefined') {
      const { useFactory, provide, scope = 'singleton', inject } = args;
      const binderContainer = (
        {
          singleton: container.parent || container,
          transient: container.parent || container,
          scoped: container,
        } as const
      )[scope];

      if (scope === 'transient') {
        return () => {
          // run factory on each injection and recollect deps on global level
          binderContainer.bindFactory(provide, (stack) => {
            stack.add(provide);
            return container._resolveMany(inject, stack).then((resolvedDeps) => useFactory(...resolvedDeps));
          });
        };
      }

      return () => {
        binderContainer.bindFactory(provide, (stack) => {
          stack.add(provide);

          return container._resolveMany(inject, stack).then((resolvedDeps) => {
            const cachedValue = useFactory(...resolvedDeps);
            // @ts-ignore
            binderContainer.bindValue(provide, cachedValue);
            return cachedValue;
          });
        });
      };
    }

    throw new Error('How did you get here');
  };
