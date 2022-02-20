import type { ModuleDeclaration, Module } from './module.types';

export const declareModule = (dec: ModuleDeclaration): Module =>
  ({
    name: dec.name,
    providers: dec.providers,
    imports: dec.imports || [],
    symbol: Symbol(dec.name),
  } as Module);
