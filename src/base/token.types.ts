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
  optionalValue?: T;
};

export type Token<T> = { symbol: symbol } & TokenOptions<T>;
export type TokenDeclarationOpt<T> = { token: Token<T>; optional: true };
export type TokenDeclaration<T> = Token<T> | TokenDeclarationOpt<T>;
export type ToksTuple = readonly [...ReadonlyArray<TokenDeclaration<TodoAny>>];
export type TokenProvide<T> = T extends Token<infer A>
  ? A
  : T extends TokenDeclarationOpt<infer A>
  ? A | undefined
  : never;
export type TokensProvide<DepToks extends ToksTuple> = {
  +readonly [Index in keyof DepToks]: TokenProvide<DepToks[Index]>;
};
