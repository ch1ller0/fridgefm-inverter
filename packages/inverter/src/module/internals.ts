import { createToken } from '../base/token';
import { injectable } from '../base/injectable';
import type { PublicContainer } from './public-container.types';

const INTERNAL_CONTAINER = createToken<PublicContainer.Instance>('__internal:container');

export const createInternalProviders = (cont: PublicContainer.Instance) => [
  injectable({
    provide: INTERNAL_CONTAINER,
    useValue: cont,
  }),
];

/**
 * Only exported tokens
 */
export const exportedTokens = {
  /**
   * Current's scope container
   * @experimental
   */
  SELF_CONTAINER: INTERNAL_CONTAINER,
};
