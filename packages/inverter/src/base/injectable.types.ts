import type { Token } from './token.types';
import type { TodoAny } from './util.types';
import type { Container } from './container.types';

export namespace Helper {
  type CfgSingleOptional<T> = { token: T; optional: true };
  type CfgSingleAll<T> = T | CfgSingleOptional<T>;

  type CfgProvide<T> = T extends CfgSingleAll<infer A> & { optional: true }
    ? A extends Token.Instance<infer B> & { multi: true }
      ? B[]
      : A extends Token.Instance<infer B>
        ? B | undefined
        : never
    : T extends CfgSingleAll<infer A>
      ? A extends Token.Instance<infer B> & { multi: true }
        ? B[]
        : A extends Token.Instance<infer B>
          ? B
          : never
      : never;

  /**
   * Tuple of passed config deps for a provider
   */
  export type CfgTuple = readonly [...ReadonlyArray<CfgSingleAll<Token.Instance<TodoAny>>>];
  export type CfgElement<T extends TodoAny = TodoAny> = CfgSingleAll<Token.Instance<T>>;
  /**
   * Tuple of token declaration provided value types
   */
  export type ResolvedDepSingle<T extends CfgSingleAll<TodoAny>> = CfgProvide<T>;
  export type ResolvedDepTuple<T extends CfgTuple> = {
    +readonly [Index in keyof T]: ResolvedDepSingle<T[Index]>;
  };
}

/**
 * Options for factory binding.
 * `scope` types:
 *   - `scoped` **This is the default**. - Value is created and cached by the container which starts resolving.
 *   - `singleton` - Value is created and cached by the parent container if present.
 *   - `transient` - Value is recreated every time it is injected.
 */
type Scope = 'singleton' | 'scoped' | 'transient';

namespace ProviderConfig {
  export type Value<T extends Token.Instance<unknown>> = {
    useFactory?: never;
    scope?: never;
    inject?: never;
    /**
     * Type of injection which saves the provided value in the container it was registered in.
     */
    useValue: Token.Provide<T>;
  };
  export type EmptyFactory<T extends Token.Instance<unknown>> = {
    /**
     * Type of injection which runs the factory with empty dependencies and caches it based on the `scope` value.
     */
    useFactory: () => Token.Provide<T>;
    scope?: Scope;
    inject?: never;
    useValue?: never;
  };
  export type DependingFactory<T extends Token.Instance<unknown>, D extends Helper.CfgTuple = Helper.CfgTuple> = {
    /**
     * Type of injection which runs the factory with dependencies and caches it based on the `scope` value.
     */
    useFactory: (...deps: Helper.ResolvedDepTuple<D>) => Token.Provide<T>;
    scope?: Scope;
    inject: D;
    useValue?: never;
  };
}

export namespace Injectable {
  /**
   * Args for the injectable method
   */
  export type Args<
    T extends Token.Instance<unknown> = Token.Instance<unknown>,
    D extends Helper.CfgTuple = Helper.CfgTuple,
  > = { provide: T } & (
    | ProviderConfig.Value<T>
    | ProviderConfig.EmptyFactory<T>
    | ProviderConfig.DependingFactory<T, D>
  );

  /**
   * This is the return type of the injectable function.
   * It is an instructionon how to bind a provider to the passed container
   */
  export type Instance = (cont: Container.Constructor) => () => void;
}
