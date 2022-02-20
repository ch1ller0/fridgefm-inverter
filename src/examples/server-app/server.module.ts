// eslint-disable-next-line import/no-extraneous-dependencies
import fastify from 'fastify';
import { declareModule, createToken, injectable, modifyToken } from '../../index';

export const ROOT_TOKEN = createToken<void>('root');
export const STORE_TOKEN = createToken<{
  getStateFor: (key: string) => number;
  increaseFor: (key: string, count: number) => void;
  getAll: () => Record<string, number>;
}>('store');
export const CONTROLLER_TOKEN = modifyToken.optionalValue(
  createToken<() => Promise<{ id: string; count: number }>>('controller'),
  () => Promise.resolve({ id: 'ok', count: 0 }),
);

export const ServerModule = declareModule({
  name: 'ServerModule',
  providers: [
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
  ],
});
