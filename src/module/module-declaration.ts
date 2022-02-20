import type { ModuleDeclaration, ModuleConfig } from './module.types';

export const declareModule = (dec: ModuleConfig): ModuleDeclaration =>
  ({
    name: dec.name,
    providers: dec.providers,
    imports: dec.imports || [],
    symbol: Symbol(dec.name),
  } as ModuleDeclaration);
