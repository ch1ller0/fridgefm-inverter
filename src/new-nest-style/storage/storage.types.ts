import type { NOT_FOUND_SYMBOL } from '../injectable';
import type { Helper } from '../injectable.types';
import type { TodoAny } from '../util.types';
import type { Container } from '../container.types';
import type { Token } from '../token.types';

/**
 * This is an interface for a mini-container that is supposed to hold its own values
 */
export type Storage = {
  bindValue: Container.Constructor['bindValue'];
  bindFactory: Container.Constructor['bindFactory'];
  get: <I extends Token.Instance<TodoAny>>(
    token: I,
    stack: Container.Stack,
  ) => Promise<Helper.ResolvedDepSingle<I>> | typeof NOT_FOUND_SYMBOL;
};
