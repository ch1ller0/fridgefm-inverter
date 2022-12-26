import type { Module } from './module.types';

export const createModule = <Ext extends Module.ExtensionMap, Exp extends Module.Exports>(
  dec: Module.Config<Ext, Exp>,
): Module.Instance<Ext, Exp> => {
  const symbol = Symbol(dec.name);
  let allProviders = dec.providers;
  const extensionObject = Object.entries(dec.extend || {}).reduce((acc, cur) => {
    const [key, ext] = cur;
    return {
      ...acc,
      [key]: (...args: Parameters<Module.Extension>) => {
        const providers = ext(...args);
        allProviders = allProviders.concat(providers);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return createInternalModule();
      },
    };
  }, {});

  const createInternalModule = () =>
    ({
      __internals: {
        name: dec.name,
        providers: allProviders,
        imports: dec.imports || [],
        symbol: symbol,
      },
      // @TODO add check for duplicating modules with different version
      ...extensionObject,
      exports: dec.exports,
    } as Module.Instance<Ext, Exp>);

  return createInternalModule();
};
