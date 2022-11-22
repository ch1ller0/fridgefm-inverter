import type { TodoAny } from './util.types';

export namespace Token {
  /**
   * Instance of a created token.
   */
  export type Instance<T> = { symbol: symbol; type?: T; optionalValue?: T; multi?: true };
  type AnyInstance = Instance<TodoAny>;
  /**
   * Type to be provided by the tken instance. Used to reverse the expected type from the token instance
   */
  export type Provide<T extends AnyInstance> = T extends Instance<infer A> ? A : never;
}
