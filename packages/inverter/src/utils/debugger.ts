/* eslint-disable no-console */
import { declareContainer } from '../module/container-declaration';
import type { ContainerConfiguration } from '../module/container.types';
import type { InjectableDeclaration } from '../module/provider.types';
import type { ModuleDeclaration } from '../module/module.types';

/**
 * This is a basic wrapper to debug the resolving process of your cointainer
 */
export const debugContainer = (containerCfg: ContainerConfiguration) => {
  const timings = { containerStart: 0, containerReady: 0 };
  const container = declareContainer({
    ...containerCfg,
    events: {
      providerResolveEnd: (provider: InjectableDeclaration) => {
        console.log('Token resolved', {
          desc: provider.provide.symbol.description,
          type: provider.useFactory ? 'factory' : 'value',
        });
        containerCfg.events?.providerResolveEnd?.(provider);
      },
      providerRegistered: (provider: InjectableDeclaration) => {
        console.log('Provider registered', {
          desc: provider.provide.symbol.description,
          type: provider.useFactory ? 'factory' : 'value',
        });
        containerCfg.events?.providerRegistered?.(provider);
      },
      moduleRegistered: (mod: ModuleDeclaration, parent: string) => {
        console.log('Module Registered', { desc: mod.__internals.name, parent });
        containerCfg.events?.moduleRegistered?.(mod, parent);
      },
      containerReady: () => {
        timings.containerReady = Date.now();
        const durationMs = timings.containerReady - timings.containerStart;
        console.log(`Container is ready in ${durationMs}ms`);
        containerCfg.events?.containerReady?.();
      },
      containerStart: () => {
        timings.containerStart = Date.now();
      },
    },
  });

  return { container };
};
