import { declareContainer } from '../module/container-declaration';
import type { ContainerConfiguration } from '../module/container.types';
import type { InjectableDeclaration } from '../module/provider.types';
import type { ModuleDeclaration } from '../module/module.types';

export const debugContainer = (containerCfg: ContainerConfiguration) => {
  const container = declareContainer({
    ...containerCfg,
    events: {
      resolvedProvider: (provider: InjectableDeclaration) => {
        console.log('resolved-token', {
          desc: provider.provide.symbol.description,
          type: provider.useFactory ? 'factory' : 'value',
        });
      },
      regProvider: (provider: InjectableDeclaration) => {
        console.log('reg-provider', {
          desc: provider.provide.symbol.description,
          type: provider.useFactory ? 'factory' : 'value',
        });
      },
      regModule: (mod: ModuleDeclaration) => {
        console.log('reg-module', { desc: mod.__internals.name });
      },
      containerReady: () => {
        console.log('container-ready');
      },
    },
  });

  return { container };
};
