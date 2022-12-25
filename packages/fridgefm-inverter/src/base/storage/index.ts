import { singleStorageFactory } from './single';
import { multiStorageFactory } from './multi';
import type { Token } from '../token.types';
import type { Storage } from './storage.types';

export const createStorage = (): Storage => {
  const singleStorage = singleStorageFactory();
  const multiStorage = multiStorageFactory();
  const selectStorage = (token: Token.AnyInstance) => (!!token.multi ? multiStorage : singleStorage);

  return {
    get: (token, stack) => selectStorage(token).get(token, stack),
    bindValue: (a) => selectStorage(a.token).bindValue(a),
    bindFactory: (a) => selectStorage(a.token).bindFactory(a),
  };
};
