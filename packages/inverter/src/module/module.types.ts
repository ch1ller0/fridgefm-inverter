import type { TodoAny, EmptyObj, NonNullableUnknown } from '../base/util.types';
import type { Injectable } from '../base/injectable.types';
import type { Token } from '../base/token.types';

export namespace Module {
  export type Extension = (...args: TodoAny) => Injectable.Instance[];
  export type ExtensionMap = Record<string, Extension>;
  export type Exports = Record<string, Token.AnyInstance>;

  export type Config<Ext extends ExtensionMap, Exp extends Exports = EmptyObj> = {
    name: string;
    providers: Injectable.Instance[];
    imports?: Instance[];
    extend?: Ext;
    exports?: Exp;
  };

  type Internal<Ext extends ExtensionMap = EmptyObj> = {
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

  export type Instance<
    Ext extends ExtensionMap = NonNullableUnknown,
    Exp extends Exports = NonNullableUnknown,
  > = Internal<Ext> & {
    +readonly [Index in keyof Ext]: (...args: Parameters<Ext[Index]>) => Instance<Ext>;
  } & {
    exports: Exp;
  };
}
