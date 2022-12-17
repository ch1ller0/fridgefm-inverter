import { createContainer } from '../base/container';
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

export const declareContainer = (cfg: PublicContainer.Configuration): PublicContainer.Instance => {
  const container = createContainer();
  const selfProviders = constructProviders(cfg);
  cfg.events?.containerStart?.();

  selfProviders.forEach((singleP) => {
    singleP(container)();
  });

  cfg.events?.containerReady?.();

  return {
    get: container.resolveSingle,
    __providers: selfProviders,
    __constructor: container,
  };
};

export const declareChildContainer = (
  parent: PublicContainer.Instance,
  cfg: PublicContainer.Configuration = {},
): PublicContainer.Instance => {
  const container = createContainer(parent.__constructor);
  cfg.events?.containerStart?.();

  const selfProviders = constructProviders({ providers: cfg.providers, modules: cfg.modules, events: cfg.events });
  parent.__providers.forEach((prov) => {
    prov(container)();
  });
  selfProviders.forEach((prov) => {
    prov(container)();
  });
  cfg.events?.containerReady?.();

  return {
    get: container.resolveSingle,
    __providers: parent.__providers,
    __constructor: container,
  };
};
