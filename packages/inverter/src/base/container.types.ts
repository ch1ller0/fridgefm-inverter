import type { Storage } from './storage/storage.types';
import type { Helper } from './injectable.types';
import type { Token } from './token.types';

export namespace Container {
  /**
   * Stackof tokens which is passed while resolving the dependant factories
   */
  export type Stack = Set<Token.AnyInstance>;
  /**
   * This type is used to pass it to the injectable instance
   */
  export type Constructor = {
    /**
     * Returns resolved value associated with a token
     */
    resolveSingle: <I extends Helper.CfgElement>(cfg: I, stack?: Stack) => Helper.ResolvedDepSingle<I>;
    /**
     * Returns resolved values associated with tokens
     */
    resolveMany: <I extends Helper.CfgTuple>(cfgs?: I, stack?: Stack) => Helper.ResolvedDepTuple<I>;
    /**
     * The referral to the parent container if any
     */
    parent?: Constructor;
    /**
     * Binding methods
     */
    binders: Pick<Storage, 'bindFactory' | 'bindValue'>;
  };
}
