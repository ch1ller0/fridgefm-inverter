import type { TodoAny } from './util.types';
/**
 * Regular token type providing value T.
 */
export type Token<T> = { symbol: symbol; type?: T; optionalValue?: T; multi?: true };
/**
 * Regular token provided value type
 */
export type TokenProvide<T> = T extends Token<infer A> ? A : unknown;
/**
 * Token declaration type. This is the interface tokens are declared in inject field
 */
export type TokenDec<T> = T | { token: T; optional: true };
/**
 * Token declaration provided value type. It takes into account the optionality and multiness of a token
 */
export type TokenDecProvide<T> = T extends TokenDec<infer A> & { optional: true }
  ? A extends Token<infer B> & { multi: true }
    ? B[]
    : A extends Token<infer B>
    ? B | undefined
    : never
  : T extends TokenDec<infer A>
  ? A extends Token<infer B> & { multi: true }
    ? B[]
    : A extends Token<infer B>
    ? B
    : never
  : never;
/**
 * Tuple of token declarations.
 */
export type TokenDecTuple = readonly [...ReadonlyArray<TokenDec<Token<TodoAny>>>];
/**
 * Tuple of token declaration provided value types
 */
export type TokensDeclarationProvide<DepToks extends TokenDecTuple> = {
  +readonly [Index in keyof DepToks]: TokenDecProvide<DepToks[Index]>;
};
