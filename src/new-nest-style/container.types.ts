import type { Helper } from './injectable.types';
import type { Token } from './token.types';

export namespace Container {
  export type Stack = Set<Token.AnyInstance>;
  /**
   * This is a public interface of the container
   */
  // export type Instance = {
  //   resolve: <A extends Token.Instance<TodoAny>>(token: A) => Promise<Token.Provide<A>> | typeof NOT_FOUND_SYMBOL;
  // };

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
      injKey: symbol;
    }) => void;
    /**
     * Method to retrieve resolved dependencies. By deafult also searches for implementation in parents
     */
    // resolveBatch: <I extends Helper.CfgTuple>(
    //   tokens?: I,
    //   /**
    //    * @internal
    //    */
    //   _requestChain?: Token.AnyInstance[],
    // ) => Promise<Helper.ResolvedDeps<I>>;
    /**
     * collectDependencies
     */
    resolveMany: <I extends Helper.CfgTuple>(cfgs?: I, stack?: Stack) => Promise<Helper.ResolvedDepTuple<I>>;
    /**
     * Returns resolved value.
     */
    resolveSingle: <I extends Helper.CfgElement>(cfg: I, stack?: Stack) => Promise<Helper.ResolvedDepSingle<I>>;
    /**
     * The referral to the parent container if any
     */
    parent?: Constructor;
  };
}
