import { createToken } from './token';
import type { Container, Resolver } from './base-container.types';
import type { Token } from './token.types';

/** @internal */
export const INTERNAL_TOKENS = {
  CONTAINER: createToken<Container>('inverter:container'),
  PARENT_CONTAINER: createToken<Container>('inverter:parent-container'),
  RESOLVER: createToken<Resolver>('inverter:resolver'),
};
/** @internal */
export const NOT_FOUND_SYMBOL = Symbol();
/** @internal */
export const DEFAULT_SCOPE = 'scoped';
/** @internal */
export const isInternalToken = <T>(token: Token<T>): boolean =>
  Object.values(INTERNAL_TOKENS).some((x) => x.symbol === token.symbol);
