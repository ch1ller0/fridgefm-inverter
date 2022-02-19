import type { TokenDecTuple } from '../base/token.types';
import type { ProviderDeclaration, InjectableDeclaration } from './provider.types';

export const injectable = <P, Deps extends TokenDecTuple>(dec: ProviderDeclaration<P, Deps>) =>
  dec as InjectableDeclaration<P, Deps>;
