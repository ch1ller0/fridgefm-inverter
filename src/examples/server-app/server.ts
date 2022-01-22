// eslint-disable-next-line import/no-extraneous-dependencies
import fastify from 'fastify';
import { injectable, CHILD_DI_FACTORY_TOKEN } from '../../index';
import { clientRootProvider } from './client';
import { ROOT_TOKEN, CONTROLLER_TOKEN, STORE_TOKEN, LOGGER_TOKEN } from './tokens';

export const serverModule = [
  injectable({
    provide: ROOT_TOKEN,
    inject: [CONTROLLER_TOKEN] as const,
    useFactory: (handler) => {
      const app = fastify({ logger: true });

      app.get('/', handler);

      const start = async () => {
        try {
          await app.listen(3000);
        } catch (err) {
          app.log.error(err);
          process.exit(1);
        }
      };
      start();
    },
  }),
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
  // injectable({
  //   provide: LOGGER_TOKEN,
  //   useValue: { log: console.log },
  // }),
  injectable({
    provide: STORE_TOKEN,
    useFactory: () => {
      const state = new Map<string, number>();

      return {
        getStateFor: (key: string) => state.get(key),
        increaseFor: (key: string, count: number) => {
          const prevState = state.get(key) || 0;
          const newState = prevState + count;
          state.set(key, newState);
        },
        getAll: () => Object.fromEntries(state),
      };
    },
  }),
];
