import { injectable } from '../../index';
import { randomString } from '../utils';
import { CLIENT_TOKEN, STORE_TOKEN, GET_ID_TOKEN, ID_LENGTH_TOKEN, CLIENT_LOGGER_TOKEN } from './tokens';

// this provider is exported separately because it is used within the child di on a server
export const clientProvider = injectable({
  provide: CLIENT_TOKEN,
  useFactory: (store, id, logger) => {
    store.increaseFor(id, 1);
    logger('increased');

    return { id, count: store.getStateFor(id) };
  },
  inject: [STORE_TOKEN, GET_ID_TOKEN, CLIENT_LOGGER_TOKEN] as const,
});

export const clientModule = [
  injectable({
    provide: CLIENT_LOGGER_TOKEN,
    scope: 'scoped', // it recreates on each request
    useFactory: (userId) => (message) => {
      // eslint-disable-next-line no-console
      console.log({ userId, message });
    },
    inject: [GET_ID_TOKEN] as const,
  }),
  injectable({
    provide: GET_ID_TOKEN,
    useFactory: (len) => randomString().slice(0, len),
    // it recreates on each reequest but stays the same within it
    // try to change it to transient and it will differ from id in logger above
    scope: 'scoped',
    inject: [ID_LENGTH_TOKEN] as const,
  }),
  injectable({
    provide: ID_LENGTH_TOKEN,
    useValue: 8,
  }),
];
