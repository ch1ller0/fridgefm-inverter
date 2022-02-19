import type { ProviderDeclaration } from './provider.types';
export type ModuleDeclaration = {
  name: string;
  providers: ProviderDeclaration[];
  imports?: ModuleDeclaration[];
};
