import type { TokenDecTuple, Token } from '../base/token.types';
import type { ProviderConfig, InjectableDeclaration } from './provider.types';

export const injectable = <P extends Token<unknown>, Deps extends TokenDecTuple>(dec: ProviderConfig<P, Deps>) =>
  // @ts-ignore
  dec as InjectableDeclaration<P, Deps>;
