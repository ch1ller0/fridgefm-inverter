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

const traverseProvidersFactory = (providers: InjectableDeclaration<TodoAny, ToksTuple>[]) => {
  const traverseProviders = (provider: InjectableDeclaration<TodoAny, ToksTuple>, stack: Token<TodoAny>[]) => {
    provider.inject?.forEach((dec) => {
      const { token, optional } = extractDeclaration(dec);
      const provided = providers.find((x) => x.provide === token);
      stack.push(token);

      if (typeof provided === 'undefined') {
        if (optional) {
          return;
        }
        throw new ResolverError(stack);
      }

      traverseProviders(provided, stack);
    });
  };

  return traverseProviders;
};
/**
 * Token for creating scoped providers, each dependency for this provider with different scope will behave different:
 * - 'singleton' dependencies are singleton for parent container scope
 * - 'scoped' dependencies are singleton for each child container
 * - 'transient' dependencies are never the same
 */
export const CHILD_DI_FACTORY_TOKEN =
  createToken<<T>(childProvider: InjectableDeclaration<T, ToksTuple>) => () => T>('inverter:child-di-factory');

export const declareContainer = ({ providers, parent }: Configuration) => {
  const container = createBaseContainer(parent);
  const resolvingTokens = new Set<Token<TodoAny>>(); // for cycle dep check
  const traverseProviders = traverseProvidersFactory(providers);

  container.bindValue(CHILD_DI_FACTORY_TOKEN, (childProvider) => {
    // before we can use child di first should check that everything is correctly provided
    // yes, this is a pretty costly operation but we better do it once at start rather than get runtime errors
    traverseProviders(childProvider, [childProvider.provide]);
    return () => declareContainer({ parent: container, providers: [childProvider] }).get(childProvider.provide);
  });

  providers.forEach((injectableDep) => {
    const { inject, provide, useFactory, useValue, scope } = injectableDep;

    if (typeof useFactory !== 'undefined') {
      container.bindFactory(
        provide,
        (ctx) => {
          inject?.forEach((tokenDeclaration) => {
            // check if there is a cycle
            if (resolvingTokens.has(extractDeclaration(tokenDeclaration).token)) {
              throw new CyclicDepError([...Array.from(resolvingTokens).reverse(), provide]);
            }
          });
          const resolvedDeps = inject?.map((tokenDeclaration) => {
            const { token, optional } = extractDeclaration(tokenDeclaration);

            // mark current reesolving dep
            resolvingTokens.add(token);
            const resolvedValue = ctx.resolve(token);

            if (resolvedValue === NOT_FOUND_SYMBOL) {
              if (optional) {
                return undefined;
              }
              traverseProviders(injectableDep, [injectableDep.provide]);
            }

            return resolvedValue;
          });
          // unmark injected deps
          inject?.forEach((tokenDeclaration) => {
            resolvingTokens.delete(extractDeclaration(tokenDeclaration).token);
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
