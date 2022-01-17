import type { TodoAny } from './util.types';
export type TokenOptions<T> = {
  /**
   * Token is provided by several providers and they are passed as an array
   * @todo
   */
  multi?: true;
  /**
   * Fallback to this value if token not provided
   */
  optionalValue?: T; // means that the token is optional and if not provided resolves to undefined
};

export type Token<T> = {
  symbol: symbol;
  type?: T; // Anchor for Typescript type inference.
  optionalValue?: T;
};

export type ToksTuple = readonly [...ReadonlyArray<Token<TodoAny>>];
export type TokenProvide<T> = T extends Token<infer A> ? A : never;
export type TokensProvide<DepToks extends ToksTuple> = {
  +readonly [Index in keyof DepToks]: TokenProvide<DepToks[Index]>;
};
// export type TokenProvide<T extends Token<unknown>> = T['type'];
