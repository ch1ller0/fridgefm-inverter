import type { NOT_FOUND_SYMBOL } from '../injectable';
import type { TodoAny } from '../util.types';
import type { Container } from '../container.types';
import type { Token } from '../token.types';

export type Storage = {
  bindValue: Container.Constructor['bindValue'];
  bindFactory: Container.Constructor['bindFactory'];
  get: <T extends TodoAny>(token: Token.Instance<T>, stack: Container.Stack) => Promise<T> | typeof NOT_FOUND_SYMBOL;
};
