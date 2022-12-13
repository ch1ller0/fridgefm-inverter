import { NOT_FOUND_SYMBOL } from '../injectable';
import type { Storage } from './storage.types';
import type { TodoAny } from '../util.types';
import type { Container } from '../container.types';

export const singleStorageFactory = (): Storage => {
  const singleValues = new Map<symbol, TodoAny>();
  const singleFactories = new Map<symbol, (stack: Container.Stack) => Promise<TodoAny>>();

  return {
    bindValue: ({ token, value }) => {
      singleValues.set(token.symbol, value);
      singleFactories.delete(token.symbol);
    },
    bindFactory: ({ token, func }) => {
      singleFactories.set(token.symbol, func);
      singleValues.delete(token.symbol);
    },
    get: (token, stack) => {
      const hasValueRecord = singleValues.has(token.symbol);
      const valueRecord = singleValues.get(token.symbol);
      if (hasValueRecord && typeof valueRecord !== 'undefined') {
        return Promise.resolve(valueRecord);
      }

      const hasFactoryRecord = singleFactories.has(token.symbol);
      const factoryRecord = singleFactories.get(token.symbol);
      if (hasFactoryRecord && typeof factoryRecord !== 'undefined') {
        return factoryRecord(stack);
      }

      return NOT_FOUND_SYMBOL;
    },
  };
};
