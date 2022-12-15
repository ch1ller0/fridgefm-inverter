import { createToken } from '../base/token';
import { createContainer } from '../base/container';
import type { Token } from '../base/token.types';
import type { Injectable } from '../base/injectable.types';
import type { Container } from '../base/container.types';
/**
 * Token for creating child containers, an injectable should be passed as the root of this container
 */
const CHILD_DI_FACTORY =
  createToken<<A>(childProvider: Injectable.Instance, childToken: Token.Instance<A>) => () => Promise<A>>(
    'inverter:child-di-factory',
  );

export const bindExposedTokens = (parentContainer: Container.Constructor) => {
  parentContainer.bindValue({
    token: CHILD_DI_FACTORY,
    injKey: Symbol('from-parent'),
    // @ts-ignore
    value: (provider, token) => {
      const childContainer = createContainer(parentContainer);

      provider(childContainer)();
      // before we can start creating child di first should check that everything is correctly provided
      // yes, this is a pretty costly operation but we better do it once at start rather than get runtime errors
      return () => childContainer.resolveSingle(token);
    },
  });
};

export const exposedTokens = {
  CHILD_DI_FACTORY,
};
