import { createBaseContainer } from '../base/base-container';
import { CyclicDepError, ResolverError } from '../base/errors';
import { createToken } from '../base/token';
import { NOT_FOUND_SYMBOL } from '../base/internals';

import type { ContainerConfiguration, ContainerEvents } from './container.types';
import type { InjectableDeclaration } from './provider.types';
import type { TodoAny } from '../base/util.types';
import type { Token, TokenDec } from '../base/token.types';
import type { ModuleDeclaration } from './module.types';

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

const orderModuleProviders = (modules: ModuleDeclaration[], events?: ContainerEvents): InjectableDeclaration[] => {
  const uniqProviders = new Set<InjectableDeclaration>();
  const traverseModules = (importedModules: ModuleDeclaration[], parentName: string) => {
    importedModules?.forEach((moduleDec) => {
      const { providers, imports = [], name } = moduleDec.__internals;
      traverseModules(imports, name);
      events?.moduleRegistered?.(moduleDec, parentName);
      providers.forEach((providerDec) => {
        if (uniqProviders.has(providerDec)) {
          // this ensures the correct resolve order - the latest added provider is set for resolve (see tests for additional info)
          uniqProviders.delete(providerDec);
        }
        uniqProviders.add(providerDec);
        events?.providerRegistered?.(providerDec);
      });
    });
  };
  traverseModules(modules, 'Container');

  return Array.from(uniqProviders.values());
};

/**
 * Token for creating child containers, an injectable should be passed as the root of this container
 */
export const CHILD_DI_FACTORY_TOKEN =
  createToken<<A>(childProvider: InjectableDeclaration<Token<A>>) => () => A>('inverter:child-di-factory');

export const declareContainer = ({ providers = [], modules = [], parent, events }: ContainerConfiguration) => {
  events?.containerStart?.();

  const container = createBaseContainer(parent);
  const resolvingTokens = new Set<Token<TodoAny>>(); // for cycle dep check
  const allProviders = [...orderModuleProviders(modules, events), ...providers];

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
        events,
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
              throw new CyclicDepError([provide, ...Array.from(resolvingTokens)]);
            }
          });
          const resolvedDeps = inject?.map((tokenDeclaration) => {
            const { token, optional } = extractDeclaration(tokenDeclaration);
            // mark current resolving dep
            resolvingTokens.add(token);
            const resolvedValue = ctx.resolve(token);
            // delete it after it is resolved
            resolvingTokens.delete(token);

            if (resolvedValue === NOT_FOUND_SYMBOL) {
              if (optional) {
                return undefined;
              }
              traverseProviders(injectableDep, [provide]);
            }

            return resolvedValue;
          });
          events?.providerResolveEnd?.(injectableDep);
          return useFactory(...(resolvedDeps || []));
        },
        { scope },
      );
    } else {
      events?.providerResolveEnd?.(injectableDep);
      container.bindValue(provide, useValue);
    }
  });

  events?.containerReady?.();

  return container;
};
