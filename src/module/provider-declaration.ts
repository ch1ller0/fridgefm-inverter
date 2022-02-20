import type { TokenDecTuple } from '../base/token.types';
import type { ProviderConfig, InjectableDeclaration } from './provider.types';

export const injectable = <P, Deps extends TokenDecTuple>(dec: ProviderConfig<P, Deps>) =>
  dec as InjectableDeclaration<P, Deps>;
