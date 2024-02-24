import { createBaseContainer } from '../base/container';
import { createInternalProviders } from './internals';
import type { PublicContainer } from './public-container.types';
import type { Injectable } from '../base/injectable.types';
import type { Module } from './module.types';

const constructProviders = ({
  providers: topLevelProvider = [],
  modules = [],
  events,
}: PublicContainer.Configuration) => {
  const uniqProviders = new Set<Injectable.Instance>();
  const traverseModules = (importedModules: Module.Instance[], parentName: string) => {
    importedModules?.forEach((moduleDec) => {
      const { providers, imports = [], name } = moduleDec.__internals;
      providers.forEach((provi) => {
        uniqProviders.add(provi);
      });
      traverseModules(imports, name);
      events?.moduleRegistered?.(moduleDec, parentName);
    });
  };

  traverseModules(modules, 'ContainerRoot');
  const moduleProviders = Array.from(uniqProviders.values());

  return [...moduleProviders, ...topLevelProvider];
};

export const createContainer = (
  cfg: PublicContainer.Configuration,
  parent?: PublicContainer.Instance,
): PublicContainer.Instance => {
  cfg.events?.containerStart?.();
  const container = createBaseContainer(parent?.__constructor);
  const selfProviders = constructProviders(cfg);
  const instance = {
    get: container.resolveSingle,
    __providers: selfProviders,
    __constructor: container,
  };
  const allProviders = [...(parent?.__providers ?? []), ...selfProviders, ...createInternalProviders(instance)];

  allProviders.forEach((singleP) => singleP(container)());

  cfg.events?.containerReady?.();

  return instance;
};

/**
 * @deprecated
 * use createContainer with a second argument instead
 */
export const createChildContainer = (
  parent: PublicContainer.Instance,
  cfg: PublicContainer.Configuration = {},
): PublicContainer.Instance => createContainer(cfg, parent);
