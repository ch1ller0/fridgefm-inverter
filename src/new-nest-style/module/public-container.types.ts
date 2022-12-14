import type { Injectable } from '../base/injectable.types';
import type { Container } from '../base/container.types';
import type { Module } from './module.types';

export namespace PublicContainer {
  export type Events = {
    /**
     * Event for when provider is resolved
     */
    providerResolveEnd?: (provider: Injectable.Instance) => void;
    /**
     * Event for when provider is been registered
     */
    providerRegistered?: (provider: Injectable.Instance) => void;
    /**
     * Event for when module is been registered
     */
    moduleRegistered?: (mod: Module.Instance, parent: string) => void;
    /**
     * Event for when the container has started
     */
    containerStart?: () => void;
    /**
     * Event for when container is ready
     */
    containerReady?: () => void;
  };

  export type Configuration = {
    modules?: Module.Instance[];
    providers?: Injectable.Instance[];
    events?: Events;
  };

  export type Instance = {
    get: Container.Constructor['resolveSingle'];
  };
}
