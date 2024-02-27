import { NOT_FOUND_SYMBOL } from '../injectable';
import type { Storage } from './storage.types';
import type { TodoAny } from '../util.types';
import type { Container } from '../container.types';

type Item<T> = { key: symbol } & (
  | {
      func: (stack: Container.Stack) => T;
    }
  | {
      value: T;
    }
);

export const multiStorageFactory = (): Storage => {
  const multies = new Map<symbol, Item<TodoAny>[]>();

  return {
    bindValue: ({ token, value, injKey }) => {
      const prevMulti = multies.get(token.symbol) || [];
      // if we already have the same injection key and it was func before that means,
      // we should replace it for the sake of caching
      const alreadyRegistered = prevMulti.findIndex((s) => s.key === injKey && 'func' in s);

      if (alreadyRegistered === -1) {
        multies.set(token.symbol, prevMulti.concat({ key: injKey, value }));
      } else {
        prevMulti[alreadyRegistered] = { key: injKey, value };
        multies.set(token.symbol, prevMulti);
      }
    },
    bindFactory: ({ token, func, injKey }) => {
      const prevMulti = multies.get(token.symbol) || [];
      multies.set(token.symbol, prevMulti.concat({ key: injKey, func }));
    },
    // @ts-expect-error this is fine
    get: (token, stack) => {
      const items = multies.get(token.symbol);
      if (typeof items !== 'undefined') {
        return items.map((s) => ('func' in s ? s.func(stack) : s.value));
      }

      return NOT_FOUND_SYMBOL;
    },
  };
};
