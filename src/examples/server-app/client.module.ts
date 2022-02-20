import { declareModule, injectable, CHILD_DI_FACTORY_TOKEN, createToken, modifyToken } from '../../index';
import { randomString } from '../utils';
import { STORE_TOKEN, LOGGER_TOKEN, CONTROLLER_TOKEN } from './server.module';

export const CLIENT_ROOT_TOKEN = createToken<{ id: string }>('client-root');
export const CLIENT_LOGGER_TOKEN = createToken<(message: string) => void>('client-logger');
export const GET_ID_TOKEN = createToken<string>('get-id');
export const ID_LENGTH_TOKEN = createToken<number>('id-length');
export const ON_REQUEST_TOKEN = modifyToken.multi(
  createToken<(info: { id: string; count: number }) => number>('on-request-multi'),
);

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

export const ClientModule = declareModule({
  name: 'ClientModule',
  providers: [
    injectable({
      provide: CONTROLLER_TOKEN,
      scope: 'singleton',
      inject: [CHILD_DI_FACTORY_TOKEN, { token: LOGGER_TOKEN, optional: true }, STORE_TOKEN] as const,
      useFactory: (childDiFactory, logger, store) => {
        // it is important to call a factory before return
        const clientRoot = childDiFactory(clientRootProvider);

        return () => {
          const userInfo = clientRoot();
          logger?.log('server-store', store.getAll());
          return Promise.resolve(userInfo);
        };
      },
    }),
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
  ],
});
