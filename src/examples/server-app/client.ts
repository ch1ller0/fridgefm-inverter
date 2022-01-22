import { injectable } from '../../index';
import { randomString } from '../utils';
import {
  CLIENT_ROOT_TOKEN,
  STORE_TOKEN,
  GET_ID_TOKEN,
  ID_LENGTH_TOKEN,
  CLIENT_LOGGER_TOKEN,
  LOGGER_TOKEN,
  ON_REQUEST_TOKEN,
} from './tokens';

// this provider is exported separately because it is used within the child di on a server
export const clientRootProvider = injectable({
  provide: CLIENT_ROOT_TOKEN,
  useFactory: (store, id, logger, onRequest) => {
    store.increaseFor(id, 1);
    logger('increased');
    const info = { id, count: store.getStateFor(id) };
    onRequest.forEach((s) => {
      s(info);
    });

    return info;
  },
  inject: [STORE_TOKEN, GET_ID_TOKEN, CLIENT_LOGGER_TOKEN, { token: ON_REQUEST_TOKEN, optional: true }] as const,
});

export const clientModule = [
  // injectable({
  //   provide: ON_REQUEST_TOKEN,
  //   useValue: (info) => {
  //     console.log('got info', info);
  //   },
  // }),
  injectable({
    provide: CLIENT_LOGGER_TOKEN,
    scope: 'scoped', // it recreates on each request
    useFactory: (logger, userId) => (message) => {
      // eslint-disable-next-line no-console
      logger?.log({ userId, message });
    },
    inject: [{ token: LOGGER_TOKEN, optional: true }, GET_ID_TOKEN] as const,
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
