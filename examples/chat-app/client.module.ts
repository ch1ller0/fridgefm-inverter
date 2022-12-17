import rl from 'readline';
import { stdin as input, stdout as output } from 'process';
// eslint-disable-next-line import/no-extraneous-dependencies
import { WebSocket } from 'ws';
import { createModule, createToken, injectable } from '../../src/index';
import { LOGGER_CREATE } from '../shared/logger.tokens';
import { randomString } from '../shared/utils';
import { PORT } from './root.tokens';
import { CHAT_WRITE } from './chat.module';
import type { ServerMessage } from './message.types';

export const UNIQUE_ID = createToken<string>('client:id');
export const CLIENT_INIT = createToken<() => void>('client:init');
export const HOST = createToken<string>('client:host');
const USER_INPUT = createToken<(ask: string) => Promise<{ answer: string }>>('client:ask');

export const ClientModule = createModule({
  name: 'ClientModule',
  providers: [
    injectable({
      provide: UNIQUE_ID,
      useFactory: () => randomString().slice(8),
      scope: 'scoped',
    }),
    injectable({
      provide: CLIENT_INIT,
      inject: [PORT, LOGGER_CREATE, USER_INPUT, CHAT_WRITE] as const,
      useFactory: (port, createLogger, lineRead, chatWrite) => () => {
        const client = new WebSocket(`ws://127.0.0.1:${port}`);
        const logger = createLogger('client');

        return new Promise((resolve) => {
          client.on('open', (a) => {
            logger.info('Successfully connected to the server');
            logger.info('Type any message and all other clients will see your message');
            resolve(undefined);
          });
          client.on('close', () => {
            logger.error('Server has closed, exiting...');
            process.exit(1);
          });
        })
          .then(() => {
            return new Promise((resolve) => {
              client.on('message', (raw: string) => {
                const parsed = JSON.parse(raw) as ServerMessage;
                chatWrite(parsed);
                resolve(undefined);
              });
            });
          })
          .then(() => {
            logger.info('Initialized new client');

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
  extend: {
    configure: (a: { host: string }) => [
      injectable({
        provide: HOST,
        useValue: a.host,
      }),
    ],
  },
});
