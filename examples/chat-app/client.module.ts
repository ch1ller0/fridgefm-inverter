import rl from 'readline';
import { stdin as input, stdout as output } from 'process';
// eslint-disable-next-line import/no-extraneous-dependencies
import { WebSocket } from 'ws';
import { createModule, createToken, injectable } from '../../src/index';
import { LoggerModule } from '../shared/logger.module';
import { randomString } from '../shared/utils';
import { ChatModule } from './chat.module';
import type { ServerMessage } from './message.types';

const { LOGGER_CREATE } = LoggerModule.exports;
const { CHAT_WRITE } = ChatModule.exports;
const UNIQUE_ID = createToken<string>('client:id');
const CLIENT_INIT = createToken<() => void>('client:init');
const HOST = createToken<string>('client:host');
const USER_INPUT = createToken<(ask: string) => Promise<{ answer: string }>>('client:ask');
// it is pretty strange that port token is here, but the overall architecture could be better
// in reality it would be some sort of a configuration module
const PORT = createToken<number>('client:port');

export const ClientModule = createModule({
  name: 'ClientModule',
  imports: [ChatModule],
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
  exports: {
    CLIENT_INIT,
    UNIQUE_ID,
    PORT,
  },
});
