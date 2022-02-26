import type { ModuleDeclaration, ModuleConfig, ExtensionMap } from './module.types';
import type { InjectableDeclaration } from './provider.types';

export const declareModule = <E extends ExtensionMap>(dec: ModuleConfig<E>): ModuleDeclaration<E> => {
  const extensionObject = Object.entries(dec.extend || {}).reduce((acc, cur) => {
    const [key, ext] = cur;
    return {
      ...acc,
      [key]: (...args: Parameters<typeof ext>) => {
        const providers = ext(...args);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return createModule(providers);
      },
    };
  }, {});

  const createModule = (additionalProviders: InjectableDeclaration[]) =>
    ({
      _config: {
        name: dec.name,
        providers: [...dec.providers, ...additionalProviders],
        imports: dec.imports || [],
      },
      // @TODO add check for duplicating modules with different version
      _symbol: Symbol(dec.name),
      ...extensionObject,
    } as ModuleDeclaration<E>);
  return createModule([]);
};

// @TODO add support for dynamic modules (i.e. forRoot method that injects some more Providers)
