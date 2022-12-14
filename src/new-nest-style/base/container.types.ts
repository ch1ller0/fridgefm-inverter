import type { Helper } from './injectable.types';
import type { Token } from './token.types';

export namespace Container {
  /**
   * Stackof tokens which is passed while resolving the dependant factories
   */
  export type Stack = Set<Token.AnyInstance>;
  /**
   * This is used to separate different implementations on the same token
   */
  export type InjectionKey = symbol;
  /**
   * This type is used to pass it to the injectable instance
   */
  export type Constructor = {
    /**
     * Caches the provided value inside the container
     */
    bindValue: <T extends Token.Instance<unknown>>(a: { token: T; value: Token.Provide<T>; injKey: symbol }) => void;
    /**
     * Binds a factory which is run on each token injection
     */
    bindFactory: <T extends Token.Instance<unknown>>(a: {
      token: T;
      func: (stack: Set<Token.AnyInstance>) => Promise<Token.Provide<T>>;
      injKey: InjectionKey;
    }) => void;
    /**
     * Returns resolved value associated with a token
     */
    resolveSingle: <I extends Helper.CfgElement>(cfg: I, stack?: Stack) => Promise<Helper.ResolvedDepSingle<I>>;
    /**
     * collectDependencies
     */
    resolveMany: <I extends Helper.CfgTuple>(cfgs?: I, stack?: Stack) => Promise<Helper.ResolvedDepTuple<I>>;
    /**
     * The referral to the parent container if any
     */
    parent?: Constructor;
  };
}
