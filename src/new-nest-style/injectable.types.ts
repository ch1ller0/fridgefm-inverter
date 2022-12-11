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
  export type CfgElement = CfgSingleAll<Token.Instance<TodoAny>>;
  export type CfgTuple = readonly [...ReadonlyArray<CfgElement>];
  /**
   * Tuple of token declaration provided value types
   */
  export type ResolvedDepSingle<T extends CfgElement> = Awaited<CfgProvide<T>>;
  export type ResolvedDepTuple<T extends CfgTuple> = {
    +readonly [Index in keyof T]: ResolvedDepSingle<T[Index]>;
  };
}

export namespace Factory {
  export type Options = {
    /**
     * Options for factory binding.
     * `scope` types:
     *   - `singleton` - **This is the default**. Value is created and cached by the parent container if present.
     *   - `scoped` - Value is created and cached by the container which starts resolving.
     *   - `transient` - Value is recreated every time it is injected.
     */
    scope?: 'singleton' | 'scoped' | 'transient';
  };
}

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
    scope?: Factory.Options['scope'];
    inject?: never;
    useValue?: never;
  };
  export type DependingFactory<T extends Token.Instance<unknown>, D extends Helper.CfgTuple = Helper.CfgTuple> = {
    /**
     * Type of injection which runs the factory with dependencies and caches it based on the `scope` value.
     */
    useFactory: (...deps: Helper.ResolvedDepTuple<D>) => Token.Provide<T>;
    scope?: Factory.Options['scope'];
    inject: D;
    useValue?: never;
  };
  export type AsyncEmptyFactory<T extends Token.Instance<unknown>> = {
    useFactory: () => Promise<Token.Provide<T>>;
    // scope?: Exclude<Factory.Options['scope'], 'transient'>;
    scope?: Factory.Options['scope'];
    inject?: never;
    useValue?: never;
  };
  export type AsyncDependingFactory<T extends Token.Instance<unknown>, D extends Helper.CfgTuple = Helper.CfgTuple> = {
    useFactory: (...deps: Helper.ResolvedDepTuple<D>) => Promise<Token.Provide<T>>;
    scope?: Factory.Options['scope'];
    // scope?: Exclude<Factory.Options['scope'], 'transient'>;
    inject: D;
    useValue?: never;
  };
}

export namespace Injectable {
  /**
   * Args for a sync injectable method
   */
  export type SyncArgs<
    T extends Token.Instance<unknown> = Token.Instance<unknown>,
    D extends Helper.CfgTuple = Helper.CfgTuple,
  > = { provide: T } & (
    | ProviderConfig.Value<T>
    | ProviderConfig.EmptyFactory<T>
    | ProviderConfig.DependingFactory<T, D>
    | ProviderConfig.AsyncEmptyFactory<T>
    | ProviderConfig.AsyncDependingFactory<T, D>
  );

  /**
   * Args for async injectable method
   */
  export type AsyncArgs<
    T extends Token.Instance<unknown> = Token.Instance<unknown>,
    D extends Helper.CfgTuple = Helper.CfgTuple,
  > = { provide: T } & (ProviderConfig.AsyncEmptyFactory<T> | ProviderConfig.AsyncDependingFactory<T, D>);

  /**
   * This is the return type of the injectable function.
   * It is an instructionon how to bind a provider to the passed container
   */
  export type Instance = (cont: Container.Constructor) => () => void;
}
