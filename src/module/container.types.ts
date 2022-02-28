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
  resolvedProvider?: (provider: InjectableDeclaration) => void;
  regProvider?: (provider: InjectableDeclaration) => void;
  regModule?: (mod: ModuleDeclaration) => void;
  containerReady?: () => void;
};
