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
          scoped: container,
          transient: container.parent || container,
        } as const
      )[scope];

      if (scope === 'transient') {
        return () => {
          // run factory on each injection and recollect deps on global level
          binderContainer.bindFactory(provide, async () => {
            const resolvedDeps = await container.resolveBatch(inject);
            return useFactory(...resolvedDeps);
          });
        };
      }

      return () => {
        binderContainer.bindFactory(provide, async () => {
          const resolvedDeps = await container.resolveBatch(inject);
          const cached = useFactory(...resolvedDeps);
          binderContainer.bindValue(provide, cached);
          return cached;
        });
      };
    }

    throw new Error('How did you get here');
  };
