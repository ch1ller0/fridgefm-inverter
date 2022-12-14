import type { TodoAny } from '../base/util.types';
import type { Injectable } from '../base/injectable.types';

export type Extension = (...args: TodoAny) => Injectable.Instance[];
export type ExtensionMap = Record<string, Extension>;

export type ModuleConfig<E extends ExtensionMap> = {
  name: string;
  providers: Injectable.Instance[];
  imports?: ModuleDeclaration[];
  extend?: E;
};

export type ModuleDeclaration<E extends ExtensionMap = {}> = {
  /**
   * @internal
   */
  __internals: ModuleConfig<E> & {
    /**
     * @internal
     */
    symbol: symbol;
    /**
     * @internal
     * Module creation is available only via "declareModule" function
     * @example
     * import { declareModule } from '@fridgefm/inverter';
     * import { anotherAwesomeModule } from '../modules':
     * const myAwesomeModule = declareModule({
     *   name: 'my-awesome-module',
     *   providers: [provider1, provider2],
     *   imports: [anotherAwesomeModule],
     * });
     */
    _brand: 'declareModule';
  };
} & {
  +readonly [Index in keyof E]: (...args: Parameters<E[Index]>) => ModuleDeclaration<E>;
};
