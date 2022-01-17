import type { ToksTuple } from '../base/token.types';
import type { ProviderDeclaration } from './provider.types';

export const injectable = <P, Deps extends ToksTuple>(dec: ProviderDeclaration<P, Deps>) => dec;
