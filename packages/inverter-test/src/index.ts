import { createContainer, injectable } from '@fridgefm/inverter';
import type { PublicContainer, Injectable, Token, _Helper } from '@fridgefm/inverter';

type TestingModuleInstance = {
  overrideProvider: <
    T extends Token.Instance<unknown> = Token.Instance<unknown>,
    D extends _Helper.CfgTuple = _Helper.CfgTuple,
  >(
    a: Injectable.Args<T, D>,
  ) => TestingModuleInstance;
  compile: () => PublicContainer.Instance;
};

const createTestingContainer = (cfg: PublicContainer.Configuration) => {
  const finalProviders = [...(cfg.providers || [])];
  const instance: TestingModuleInstance = {
    overrideProvider: <
      T extends Token.Instance<unknown> = Token.Instance<unknown>,
      D extends _Helper.CfgTuple = _Helper.CfgTuple,
    >(
      a: Injectable.Args<T, D>,
    ) => createTestingContainer({ ...cfg, providers: finalProviders.concat(injectable(a)) }),
    compile: () => createContainer({ modules: cfg.modules, providers: finalProviders }),
  };

  return instance;
};

export const Test = {
  createTestingContainer,
};
