import { NOT_FOUND_SYMBOL } from '../injectable';
import type { Storage } from './storage.types';
import type { TodoAny } from '../util.types';
import type { Container } from '../container.types';

export const singleStorageFactory = (): Storage => {
  const values = new Map<symbol, Promise<TodoAny>>();
  const factories = new Map<symbol, (stack: Container.Stack) => Promise<TodoAny>>();

  return {
    bindValue: ({ token, value }) => {
      values.set(token.symbol, value);
      factories.delete(token.symbol);
    },
    bindFactory: ({ token, func }) => {
      factories.set(token.symbol, func);
      values.delete(token.symbol);
    },
    get: (token, stack) => {
      const hasValueRecord = values.has(token.symbol);
      const valueRecord = values.get(token.symbol);
      if (hasValueRecord && typeof valueRecord !== 'undefined') {
        return valueRecord;
      }

      const hasFactoryRecord = factories.has(token.symbol);
      const factoryRecord = factories.get(token.symbol);
      if (hasFactoryRecord && typeof factoryRecord !== 'undefined') {
        return factoryRecord(stack);
      }

      return NOT_FOUND_SYMBOL;
    },
  };
};
