import debug from 'debug';
import { createBaseContainer } from '../base/container';
import { CyclicDepError, ResolverError } from '../base/errors';
import { createToken } from '../base/token';
import { NOT_FOUND_SYMBOL } from '../base/internals';

import type { InjectableDeclaration } from './provider.types';
import type { TodoAny } from '../base/util.types';
import type { Container } from '../base/container.types';
import type { Token, TokenDec } from '../base/token.types';
import type { ModuleDeclaration } from './module.types';

export type ContainerConfiguration = {
  modules?: ModuleDeclaration[];
  providers: InjectableDeclaration<TodoAny>[];
  parent?: Container;
};

// @TODO move it to debug package for tree shaking and ability to add to a bundle only on-demand
const logger = {
  resolvedToken: (token: Token<TodoAny>) => {
    debug('fridgefm-inverter')('Resolved token', token.symbol.description);
  },
};

const extractDeclaration = <T>(
  tokenDeclaration: TokenDec<Token<T>>,
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

const orderModuleProviders = (modules?: ModuleDeclaration[]): InjectableDeclaration[] => {
  const innerProviders: InjectableDeclaration[] = [];
  const traverseModules = (importedModules?: ModuleDeclaration[]) => {
    importedModules?.forEach((moduleDec) => {
      const { providers, imports = [] } = moduleDec._config;
      traverseModules(imports);
      providers.forEach((providerDec) => {
        innerProviders.push(providerDec);
      });
      // console.log(`resolved module: ${name}`);
    });
  };
  traverseModules(modules);

  return innerProviders;
};

/**
 * Token for creating child containers, an injectable should be passed as the root of this container
 */
export const CHILD_DI_FACTORY_TOKEN =
  createToken<<A>(childProvider: InjectableDeclaration<A>) => () => A>('inverter:child-di-factory');

export const declareContainer = ({ providers, modules, parent }: ContainerConfiguration) => {
  const container = createBaseContainer(parent);
  const resolvingTokens = new Set<Token<TodoAny>>(); // for cycle dep check
  const allProviders = [...orderModuleProviders(modules), ...providers];
  const traverseProviders = (provider: InjectableDeclaration<TodoAny>, stack: Token<TodoAny>[]) => {
    provider.inject?.forEach((dec) => {
      const { token, optional } = extractDeclaration(dec);
      const provided = allProviders.find((x) => x.provide === token);
      stack.push(token);

      if (typeof provided === 'undefined') {
        if (optional || typeof token.optionalValue !== 'undefined') {
          return;
        }
        throw new ResolverError(stack);
      }

      traverseProviders(provided, stack);
    });
  };

  // @ts-ignore
  container.bindValue(CHILD_DI_FACTORY_TOKEN, (childProvider) => {
    // before we can start creating child di first should check that everything is correctly provided
    // yes, this is a pretty costly operation but we better do it once at start rather than get runtime errors
    traverseProviders(childProvider, [childProvider.provide]);
    return () =>
      declareContainer({
        parent: container,
        providers: [childProvider],
      }).get(childProvider.provide);
  });

  allProviders.forEach((injectableDep) => {
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
