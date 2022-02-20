import type { ModuleDeclaration, ModuleConfig } from './module.types';

export const declareModule = (dec: ModuleConfig): ModuleDeclaration =>
  ({
    name: dec.name,
    providers: dec.providers,
    imports: dec.imports || [],
    // @TODO add check for duplicating modules with different version
    symbol: Symbol(dec.name),
  } as ModuleDeclaration);
// @TODO add support for dynamic modules (i.e. forRoot method that injects some more Providers)
