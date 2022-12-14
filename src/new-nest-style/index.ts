export { declareContainer } from './module/public-container';
export { injectable } from './base/injectable';
export { createToken, modifyToken } from './base/token';
export { createModule } from './module/module';

import type { PublicContainer } from './module/public-container.types';
type ContainerConfig = PublicContainer.Configuration;
export type { ContainerConfig };

/**
 * 1 Add dependency stack
 * 1 Add cyclic dep checkers
 * 1 Fix multi
 * 1 Add modules
 * 1 Add edge cases    <-- you are here
 * 1 Add support for creating different scopes
 * 1 Add testing module
 * 1 Add container events
 */
