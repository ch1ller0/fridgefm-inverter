import type { TodoAny } from './util.types';
/**
 * Regular token type providing value T.
 */
export type Token<T> = { symbol: symbol; type?: T; optionalValue?: T; multi?: true };
/**
 * Regular token provided value type
 */
export type TokenProvide<T extends Token<TodoAny>> = T extends Token<infer A> ? A : never;
/**
 * Token declaration type. This is the interface tokens are declared in deps field
 */
export type TokenDec<T extends Token<TodoAny>> = T | { token: T; optional: true };
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
 * Record of token declarations.
 */
export type ProviderDepsDec = Record<string, TokenDec<Token<TodoAny>>>;

/**
 * Record of token declaration provided value types
 */
export type TokensDeclarationProvide<DepToks extends ProviderDepsDec> = {
  readonly [Key in keyof DepToks]: TokenDecProvide<DepToks[Key]>;
};
