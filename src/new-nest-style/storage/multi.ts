import { NOT_FOUND_SYMBOL } from '../injectable';
import type { Storage } from './storage.types';
import type { TodoAny } from '../util.types';
import type { Container } from '../container.types';

export const multiStorageFactory = (): Storage => {
  const multiFactories = new Map<symbol, ((stack: Container.Stack) => Promise<TodoAny>)[]>();

  return {
    bindValue: ({ token, value, injKey }) => {
      const prevMulti = multiFactories.get(token.symbol) || [];
      const fn = () => Promise.resolve(value);
      multiFactories.set(token.symbol, prevMulti.concat(fn));
    },
    bindFactory: ({ token, func, injKey }) => {
      const prevMulti = multiFactories.get(token.symbol) || [];
      multiFactories.set(token.symbol, prevMulti.concat(func));
    },
    get: (token, stack) => {
      const multies = multiFactories.get(token.symbol);
      if (!!multies) {
        // @ts-ignore
        return Promise.all(multies.map((s) => s(stack)));
      }

      return NOT_FOUND_SYMBOL;
    },
  };
};
