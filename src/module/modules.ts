import debug from 'debug';
import { createBaseContainer } from '../base/container';
import { CyclicDepError, ResolverError } from '../base/errors';
import { createToken } from '../base/token';
import { NOT_FOUND_SYMBOL } from '../base/internals';

import type { InjectableDeclaration } from './provider.types';
import type { TodoAny } from '../base/util.types';
import type { Container } from '../base/container.types';
import type { ToksTuple, Token, TokenDeclaration } from '../base/token.types';

type Configuration = {
  /**
   * @todo
   */
  modules?: unknown[];
  providers: InjectableDeclaration<TodoAny, ToksTuple>[];
  parent?: Container;
};

const logger = {
  resolvedToken: (token: Token<TodoAny>) => {
    debug('fridgefm-inverter')('Resolved token', token.symbol.description);
  },
};

const extractDeclaration = <T>(
  tokenDeclaration: TokenDeclaration<T>,
): {
  token: Token<T>;
  optional: boolean;
} => {
  if ('token' in tokenDeclaration) {
    return tokenDeclaration;
  }
  return {
    token: tokenDeclaration,
    optional: false,
  };
};

/**
 * Token for creating scoped providers, each dependency for this provider with different scope will behave different:
 * - 'singleton' dependencies are singleton for parent container scope
 * - 'scoped' dependencies are singleton for each child container
 * - 'transient' dependencies are never the same
 */
export const CHILD_DI_FACTORY_TOKEN =
  createToken<<T>(childProvider: InjectableDeclaration<T, ToksTuple>) => T>('inverter:child-di-factory');

export const declareContainer = ({ providers, parent }: Configuration) => {
  const container = createBaseContainer(parent);
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
          inject?.forEach((tokenDeclaration) => {
            const { token } = extractDeclaration(tokenDeclaration);
            if (resolvingTokens.has(token)) {
              throw new CyclicDepError([...Array.from(resolvingTokens).reverse(), provide]);
            }
          });
          const resolvedDeps = inject?.map((tokenDeclaration) => {
            const { token, optional } = extractDeclaration(tokenDeclaration);

            resolvingTokens.add(token);
            const resolvedValue = ctx.resolve(token);

            if (resolvedValue === NOT_FOUND_SYMBOL && !optional) {
              throw new ResolverError([...Array.from(resolvingTokens)]);
            }

            return resolvedValue;
          });
          inject?.forEach((tokenDeclaration) => {
            const { token } = extractDeclaration(tokenDeclaration);

            resolvingTokens.delete(token);
          });
          logger.resolvedToken(provide);

          return useFactory(...(resolvedDeps || []));
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
