export { declareContainer } from './module/public-container';
export { injectable } from './base/injectable';
export { createToken, modifyToken } from './base/token';
export { createModule } from './module/module';
export { exposedTokens } from './module/exposed-tokens';

import type { PublicContainer } from './module/public-container.types';
import type { Token } from './base/token.types';

type ContainerConfig = PublicContainer.Configuration;
type TokenProvide<A extends Token.AnyInstance> = Token.Provide<A>;
export type { ContainerConfig, TokenProvide };

/**
 * 1 Add dependency stack
 * 1 Add cyclic dep checkers
 * 1 Fix multi
 * 1 Add modules
 * 1 Add support for creating different scopes    <-- you are here
 * 1 Add edge cases
 * 1 Add events which show the resolving of the modules
 * 1 Add exports field for modules
 * 1 Add testing module
 * 1 Add container events
 */
