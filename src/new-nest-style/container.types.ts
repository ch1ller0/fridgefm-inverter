import type { Helper } from './injectable.types';
import type { Token } from './token.types';

export namespace Container {
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
    bindValue: <T extends Token.Instance<unknown>>(token: T, value: Token.Provide<T>) => void;
    /**
     * Binds a factory which is run on each token injection
     */
    bindFactory: <T extends Token.Instance<unknown>>(token: T, fn: () => Promise<Token.Provide<T>>) => void;
    /**
     * Method to retrieve resolved dependencies. By deafult also searches for implementation in parents
     */
    resolveBatch: <I extends Helper.CfgTuple>(tokens?: I) => Promise<Helper.ResolvedDeps<I>>;
    /**
     * The referral to the parent container if any
     */
    parent?: Constructor;
  };
}
