import debug from 'debug';
import { createSoftContainer } from '../base/container';
import { CyclicDepError } from '../base/errors';
import { createToken } from '../base/token';

import type { ProviderDeclaration } from './provider.types';
import type { TodoAny } from '../base/util.types';
import type { Container } from '../base/container.types';
import type { ToksTuple, Token } from '../base/token.types';

type Configuration = {
  /**
   * @todo
   */
  modules?: unknown[];
  providers: ProviderDeclaration<TodoAny, ToksTuple>[];
  parent?: Container;
};

const logger = {
  resolvedToken: (token: Token<TodoAny>) => {
    debug('fridgefm-inverter')('Resolved token', token.symbol.description);
  },
};

/**
 * Token for creating scoped providers, each dependency for this provider with different scope will behave different:
 * - 'singleton' dependencies are singleton for parent container scope
 * - 'scoped' dependencies are singleton for each child container
 * - 'transient' dependencies are never the same
 */
export const CHILD_DI_FACTORY_TOKEN =
  createToken<<T>(childProvider: ProviderDeclaration<T, ToksTuple>) => T>('inverter:child-di-factory');

export const declareContainer = ({ providers, parent }: Configuration) => {
  const container = createSoftContainer(parent);
  const resolvingTokens = new Set<Token<TodoAny>>(); // for cycle dep check

  container.bindValue(CHILD_DI_FACTORY_TOKEN, (childProvider) =>
    declareContainer({
      parent: container,
      providers: [childProvider],
    }).get(childProvider.provide),
  );

  providers.forEach((injectableDep) => {
    const { inject, provide, useFactory, useValue, scope } = injectableDep;

    if (typeof useFactory !== 'undefined') {
      container.bindFactory(
        provide,
        (ctx) => {
          if (!!inject) {
            inject.forEach((tok) => {
              if (resolvingTokens.has(tok)) {
                const depStack = Array.from(resolvingTokens);
                throw new CyclicDepError([...depStack.reverse(), provide]);
              }
            });
            const resolvedDeps = inject?.map((x) => {
              resolvingTokens.add(x);
              return ctx.resolve(x);
            });
            inject.forEach((tok) => {
              resolvingTokens.delete(tok);
            });
            logger.resolvedToken(provide);

            return useFactory(...resolvedDeps);
          }
          logger.resolvedToken(provide);

          return useFactory([]);
        },
        { scope },
      );
    } else {
      logger.resolvedToken(provide);

      container.bindValue(provide, useValue);
    }
  });

  return container;
};
