import type { ProviderDeclaration } from './provider.types';
export type ModuleDeclaration = {
  providers: ProviderDeclaration[];
  imports?: ModuleDeclaration[];
};
