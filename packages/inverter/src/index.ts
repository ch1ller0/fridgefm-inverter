export { createContainer } from './module/public-container';
export { injectable } from './base/injectable';
export { createToken, modifyToken } from './base/token';
export { createModule } from './module/module';
export { exportedTokens as internalTokens } from './module/internals';

export type { PublicContainer } from './module/public-container.types';
export type { Token } from './base/token.types';
export type { Injectable, Helper as _Helper } from './base/injectable.types';

/**
 * 1 Add dependency stack
 * 1 Add cyclic dep checkers
 * 1 Fix multi
 * 1 Add modules
 * 1 Add support for creating different scopes
 * 1 Add exports field for modules    <-- you are here
 * 1 Add edge cases
 * 1 Add testing module
 * 1 Add container events
 */
