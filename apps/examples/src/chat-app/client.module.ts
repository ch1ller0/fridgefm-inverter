import rl from 'readline';
import crypto from 'crypto';
import { stdin as input, stdout as output } from 'process';
import { WebSocket } from 'ws';
import { createModule, createToken, injectable, modifyToken } from '@fridgefm/inverter';
import { LoggerModule, NetworkModule } from '../shared';
import { ChatModule } from './chat.module';
import type { ServerMessage } from './message.types';

const { LOGGER_CREATE } = LoggerModule.exports;
const { CHAT_WRITE } = ChatModule.exports;
const { NET_SERVICE } = NetworkModule.exports;
const CLIENT_ID = createToken<string>('client:id');
const CLIENT_INIT = createToken<() => void>('client:init');
const USER_INPUT = createToken<(ask: string) => Promise<{ answer: string }>>('client:ask');
const PORT = modifyToken.defaultValue(createToken<number>('client:port'), 3000);
const REMOTE_HOST = createToken<string>('client:remoteHost');

export const ClientModule = createModule({
  name: 'ClientModule',
  imports: [ChatModule],
  providers: [
    injectable({
      provide: CLIENT_ID,
      useFactory: () => crypto.randomBytes(8).toString('hex').slice(8),
      scope: 'scoped',
    }),
    injectable({
      provide: CLIENT_INIT,
      inject: [
        PORT,
        LOGGER_CREATE,
        USER_INPUT,
        CHAT_WRITE,
        NET_SERVICE,
        { token: REMOTE_HOST, optional: true },
      ] as const,
      useFactory: (port, createLogger, lineRead, chatWrite, netService, remoteHost) => {
        const logger = createLogger('client');
        const internalNetworkHost = netService.getInternalInterface()?.address;
        const host = remoteHost || internalNetworkHost || '127.0.0.1';
        const serverUrl = `ws://${host}:${port}`;

        return () => {
          const client = new WebSocket(serverUrl);

          return new Promise((resolve, reject) => {
            client.on('error', (e) => reject(e));
            client.on('open', () => {
              logger.info(
                `Successfully connected to the ${host === internalNetworkHost ? 'local server' : 'remote server'}`,
              );
              logger.info({ serverUrl, localServer: host === internalNetworkHost });
              logger.info('Type any message and all other clients will see your message');
            });
            client.on('message', (raw: string) => {
              const parsed = JSON.parse(raw) as ServerMessage;
              chatWrite(parsed);
              resolve(undefined);
            });
            client.on('close', () => {
              logger.error('Server has closed, exiting...');
              process.exit(1);
            });
          }).then(() => {
            const recursiveAsk = () =>
              lineRead('').then(({ answer }) => {
                client.send(JSON.stringify({ type: 'message', items: [answer] }));
                recursiveAsk();
              });
            recursiveAsk();
          });
        };
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
    configure: (a: { remoteHost?: string; port?: number }) => [
      ...(a.remoteHost ? [injectable({ provide: REMOTE_HOST, useValue: a.remoteHost })] : []),
      ...(a.port ? [injectable({ provide: PORT, useValue: a.port })] : []),
    ],
  },
  exports: {
    CLIENT_INIT,
    CLIENT_ID,
    PORT,
    REMOTE_HOST,
  },
});
