import rl from 'readline';
import { stdin as input, stdout as output } from 'process';
// eslint-disable-next-line import/no-extraneous-dependencies
import { WebSocket, type RawData } from 'ws';
import { createModule, createToken, injectable } from '../../src/index';
import { LOGGER_CREATE } from '../shared/logger.module';
import { PORT } from './root.tokens';
import { CHAT_WRITE } from './chat.module';

export const CLIENT_INIT = createToken<() => void>('client:init');
const USER_INPUT = createToken<(ask: string) => Promise<{ answer: string }>>('client:ask');

export const ClientModule = createModule({
  name: 'ClientModule',
  providers: [
    injectable({
      provide: CLIENT_INIT,
      inject: [PORT, LOGGER_CREATE, USER_INPUT, CHAT_WRITE] as const,
      useFactory: (port, createLogger, lineRead, chatWrite) => () => {
        const client = new WebSocket(`ws://127.0.0.1:${port}`);
        const logger = createLogger('client');
        logger.info('Initialized new client');

        return new Promise((resolve) => {
          client.on('open', () => {
            logger.info('Successfully connected to the server');
            resolve(undefined);
          });
        })
          .then(() => {
            return new Promise((resolve) => {
              client.on('message', (raw: RawData) => {
                // @ts-ignore
                const parsed = JSON.parse(raw);
                if (parsed?.type === 'restoreChat') {
                  parsed.items.forEach((item) => chatWrite(item));
                  resolve(undefined);
                }
                if (parsed?.type === 'message') {
                  parsed.items.forEach((item) => chatWrite(item));
                }
              });
            });
          })
          .then(() => {
            const recursiveAsk = () =>
              lineRead('').then(({ answer }) => {
                client.send(JSON.stringify({ type: 'message', items: [answer] }));
                recursiveAsk();
              });
            recursiveAsk();
          });
      },
    }),
    injectable({
      provide: USER_INPUT,
      useFactory: () => {
        const readline = rl.createInterface({ input, output });

        return (ask: string) =>
          new Promise<{ answer: string }>((resolve) => {
            readline.question(ask, (answer) => {
              resolve({ answer });
            });
          });
      },
    }),
  ],
});
