import type { Token, TokenDecTuple, TokensDeclarationProvide, TokenProvide } from '../base/token.types';

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

export type ProviderConfig<T extends Token<unknown> = Token<unknown>, DepToks extends TokenDecTuple = TokenDecTuple> =
  | {
      provide: T;
    } & (
      | {
          useFactory: (...deps: TokensDeclarationProvide<DepToks>) => TokenProvide<T>;
          scope?: FactoryOptions['scope'];
          inject: DepToks;
          useValue?: never;
        }
      | {
          useFactory: () => TokenProvide<T>;
          scope?: FactoryOptions['scope'];
          inject?: never;
          useValue?: never;
        }
      | {
          useFactory?: never;
          scope?: never;
          inject?: never;
          useValue: TokenProvide<T>;
        }
    );

/**
 * Helper type to force the use of injectable method
 */
export type InjectableDeclaration<
  T extends Token<unknown> = Token<unknown>,
  DepToks extends TokenDecTuple = TokenDecTuple,
> = ProviderConfig<Token<T>, DepToks> & {
  /**
   * Provider creation is available only via "injectable" function
   * @example
   * import { injectable } from '@fridgefm/inverter';
   * import { MY_TOKEN } from '../tokens':
   * const myAwesomeProvider = injectable({
   *   provide: MY_TOKEN,
   *   useValue: ['a', 'b'],
   * });
   */
  _brand: 'injectable';
};
