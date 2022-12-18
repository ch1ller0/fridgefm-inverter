import type { TodoAny } from '../base/util.types';
import type { Injectable } from '../base/injectable.types';

export namespace Module {
  export type Extension = (...args: TodoAny) => Injectable.Instance[];
  export type ExtensionMap = Record<string, Extension>;
  export type Exports = Record<string, unknown>;

  export type Config<Ext extends ExtensionMap, Exp extends Exports = {}> = {
    name: string;
    providers: Injectable.Instance[];
    imports?: Instance[];
    extend?: Ext;
    exports?: Exp;
  };

  type Internal<Ext extends ExtensionMap = {}> = {
    /**
     * @internal
     */
    __internals: Config<Ext> & {
      /**
       * @internal
       */
      symbol: symbol;
      /**
       * @internal
       * Module creation is available only via "createModule" function
       * @example
       * import { createModule } from '@fridgefm/inverter';
       * import { anotherAwesomeModule } from '../modules':
       * const myAwesomeModule = createModule({
       *   name: 'my-awesome-module',
       *   providers: [provider1, provider2],
       *   imports: [anotherAwesomeModule],
       * });
       */
      _brand: 'createModule';
    };
  };

  export type Instance<Ext extends ExtensionMap = {}, Exp extends Exports = {}> = Internal<Ext> & {
    +readonly [Index in keyof Ext]: (...args: Parameters<Ext[Index]>) => Instance<Ext>;
  } & {
    exports: Exp;
  };
}
