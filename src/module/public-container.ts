import { createContainer } from '../base/container';
import { bindExposedTokens } from './exposed-tokens';

import type { PublicContainer } from './public-container.types';
import type { Injectable } from '../base/injectable.types';
import type { Module } from './module.types';

export const declareContainer = ({
  providers: topLevelProvider = [],
  modules = [],
  events,
}: PublicContainer.Configuration): PublicContainer.Instance => {
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

  events?.containerStart?.();

  const container = createContainer();
  const allProviders = [...moduleProviders, ...topLevelProvider];
  allProviders.forEach((singleP) => {
    singleP(container)();
  });

  bindExposedTokens(container);

  events?.containerReady?.();

  return { get: container.resolveSingle };
};
