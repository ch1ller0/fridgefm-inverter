import type { ProviderDepsDec, Token } from '../base/token.types';
import type { ProviderConfig, InjectableDeclaration } from './provider.types';

export const injectable = <P extends Token<unknown>, Deps extends ProviderDepsDec>(dec: ProviderConfig<P, Deps>) =>
  dec as InjectableDeclaration<P, Deps>;
