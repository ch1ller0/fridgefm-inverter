import type { Injectable } from '../base/injectable.types';
import type { Module } from './module.types';

export const createModule = <Ext extends Module.ExtensionMap, Exp extends Module.Exports>(
  dec: Module.Config<Ext, Exp>,
): Module.Instance<Ext, Exp> => {
  const symbol = Symbol(dec.name);

  const createExtensionObject = (providers: Injectable.Instance[]) => {
    return Object.entries(dec.extend || {}).reduce((acc, cur) => {
      const [key, ext] = cur;
      return {
        ...acc,
        [key]: (...args: Parameters<Module.Extension>) => {
          const additionalProviders = ext(...args);
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          return createInternalModule(providers.concat(additionalProviders));
        },
      };
    }, {});
  };

  const createInternalModule = (providers: Injectable.Instance[]) =>
    ({
      __internals: {
        providers,
        name: dec.name,
        imports: dec.imports || [],
        symbol: symbol,
      },
      // @TODO add check for duplicating modules with different version
      ...createExtensionObject(providers),
      exports: dec.exports,
    } as Module.Instance<Ext, Exp>);

  return createInternalModule(dec.providers);
};
