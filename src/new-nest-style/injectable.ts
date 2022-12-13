import type { Token } from './token.types';
import type { Injectable, Helper } from './injectable.types';

export const NOT_FOUND_SYMBOL = Symbol('__NOT_FOUND_SYMBOL__');

export const injectable = <T extends Token.Instance<unknown>, D extends Helper.CfgTuple>(
  args: Injectable.SyncArgs<T, D>,
): Injectable.Instance => {
  // unique injection key which is used to separate different providers in the container
  const injKey = Symbol(Math.random().toString().slice(2));

  return (container) => {
    if (typeof args.useValue !== 'undefined') {
      const { useValue, provide } = args;
      return () => {
        container.bindValue({ token: provide, value: useValue, injKey });
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
          binderContainer.bindFactory({
            token: provide,
            func: (stack) => {
              stack.add(provide);
              return container.resolveMany(inject, stack).then((resolvedDeps) => useFactory(...resolvedDeps));
            },
            injKey,
          });
        };
      }

      return () => {
        binderContainer.bindFactory({
          token: provide,
          func: (stack) => {
            stack.add(provide);

            return container.resolveMany(inject, stack).then(async (resolvedDeps) => {
              const cachedValue = await useFactory(...resolvedDeps);
              binderContainer.bindValue({ token: provide, value: cachedValue, injKey });
              return cachedValue;
            });
          },
          injKey,
        });
      };
    }

    throw new Error('How did you get here');
  };
};
