import type { ToksTuple } from '../base/token.types';
import type { ProviderDeclaration, InjectableDeclaration } from './provider.types';

export const injectable = <P, Deps extends ToksTuple>(dec: ProviderDeclaration<P, Deps>) =>
  dec as InjectableDeclaration<P, Deps>;
