import type { Token, TokenDecTuple, TokensDeclarationProvide } from '../base/token.types';

export type FactoryOptions = {
  /**
   * Options for factory binding.
   * `scope` types:
   *   - `singleton` - **This is the default**. The value is created and cached by the container which registered the factory.
   *   - `scoped` - The value is created and cached by the container which starts resolving.
   *   - `transient` - The value is created every time it is resolved.
   */
  scope?: 'singleton' | 'scoped' | 'transient';
};

export type ProviderDeclaration<P = unknown, DepToks extends TokenDecTuple = TokenDecTuple> = {
  provide: Token<P>;
  useFactory?: (...deps: TokensDeclarationProvide<DepToks>) => P;
  useValue?: P;
  inject?: DepToks;
  scope?: FactoryOptions['scope'];
};

/**
 * Helper type to force the use of injectable method
 */
export type InjectableDeclaration<P = unknown, DepToks extends TokenDecTuple = TokenDecTuple> = ProviderDeclaration<
  P,
  DepToks
> & { _brand: 'injectable' };
