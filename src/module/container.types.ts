import type { Container } from '../base/base-container.types';
import type { InjectableDeclaration } from './provider.types';
import type { TodoAny } from '../base/util.types';
import type { ModuleDeclaration } from './module.types';

export type ContainerConfiguration = {
  modules?: ModuleDeclaration[];
  providers: InjectableDeclaration<TodoAny>[];
  parent?: Container;
  events?: ContainerEvents;
};

export type ContainerEvents = {
  /**
   * Event for when provider is resolved
   */
  providerResolveEnd?: (provider: InjectableDeclaration) => void;
  /**
   * Event for when provider is been registered
   */
  providerRegistered?: (provider: InjectableDeclaration) => void;
  /**
   * Event for when module is been registered
   */
  moduleRegistered?: (mod: ModuleDeclaration, parent: string) => void;
  /**
   * Event for when the container has started
   */
  containerStart?: () => void;
  /**
   * Event for when container is ready
   */
  containerReady?: () => void;
};
