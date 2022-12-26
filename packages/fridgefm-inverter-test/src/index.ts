import { createContainer, injectable } from '@fridgefm/inverter';
import type { PublicContainer, Injectable } from '@fridgefm/inverter';

type TestingModuleInstance = {
  overrideProvider: (a: Injectable.Args) => TestingModuleInstance;
  compile: () => PublicContainer.Instance;
};

const createTestingContainer = (cfg: PublicContainer.Configuration) => {
  const finalProviders = [...(cfg.providers || [])];
  const instance: TestingModuleInstance = {
    overrideProvider: (a: Injectable.Args) => {
      const newProvider = injectable(a);
      finalProviders.push(newProvider);
      return instance;
    },
    compile: () =>
      createContainer({
        modules: cfg.modules,
        providers: finalProviders,
      }),
  };

  return instance;
};

export const Test = {
  createTestingContainer,
};
