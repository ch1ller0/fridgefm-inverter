export { declareContainer, CHILD_DI_FACTORY_TOKEN } from './module/container-declaration';
export { injectable } from './module/provider-declaration';
export { declareModule } from './module/module-declaration';
export { createToken, modifyToken } from './base/token';
// export only types that might be used by external code
export type { TokenProvide, TokenDecProvide, TokensDeclarationProvide } from './base/token.types';
export type { ContainerConfiguration } from './module/container-declaration';
export type { ModuleConfig } from './module/module.types';
export type { ProviderConfig } from './module/provider.types';
