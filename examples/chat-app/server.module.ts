// eslint-disable-next-line import/no-extraneous-dependencies
import { WebSocketServer, type WebSocket } from 'ws';
import { createModule, createToken, injectable, createChildContainer, type TokenProvide } from '../../src/index';
import { LoggerModule } from '../shared/logger.module';
import { NetworkModule } from '../shared/network.module';
import { ChatModule } from './chat.module';
import { ClientModule } from './client.module';
import { rootContainer } from './index';
import type { ServerMessage, ClientMessage } from './message.types';
type Session = {
  push: (m: ServerMessage) => void;
  pushOther: (m: ServerMessage) => void;
  id: string;
};

const { CHAT_STORE } = ChatModule.exports;
const { CLIENT_ID, PORT } = ClientModule.exports;
const { LOGGER_CREATE, LOGGER_GLOBAL } = LoggerModule.exports;
const { NET_SERVICE } = NetworkModule.exports;
const SERVER_INIT = createToken<() => Promise<WebSocketServer>>('server:init');
const SESSION_ROOT = createToken<Session>('server:session:root');
const SESSION_ALL = createToken<Set<Session>>('server:session:all');
const SCOPED_WS = createToken<WebSocket>('server:scoped:ws');
const SCOPED_LOGGER = createToken<TokenProvide<typeof LOGGER_GLOBAL>>('server:scoped:logger');

export const ServerModule = createModule({
  name: 'ServerModule',
  imports: [ClientModule, ChatModule],
  providers: [
    injectable({
      provide: SCOPED_LOGGER,
      useFactory: (id, createLogger) => createLogger(id),
      inject: [CLIENT_ID, LOGGER_CREATE] as const,
    }),
    injectable({ provide: SESSION_ALL, useValue: new Set<Session>() }),
    injectable({
      provide: SESSION_ROOT,
      useFactory: (scopedLogger, ws, id, allSessions, chatStore) => {
        const newSession: Session = {
          push: (a) => {
            ws.send(JSON.stringify(a));
          },
          pushOther: (a) => {
            const allExceptMe = [...allSessions.values()].filter((s) => s.id !== id);
            allExceptMe.forEach((s) => s.push(a));
          },
          id,
        };

        ws.on('close', () => {
          allSessions.delete(newSession);
          newSession.pushOther({ type: 'clientActivity', connected: false, id });
          scopedLogger.warn('[User disconnected]');
          return;
        });

        ws.on('message', (raw: string) => {
          const parsed = JSON.parse(raw) as ClientMessage;
          if (parsed.type === 'message') {
            const fromatted = chatStore.pushMessages(parsed.items, id);
            newSession.pushOther({ type: 'message', items: fromatted });
            scopedLogger.info(fromatted[0].chatMessage);
            return;
          }
        });

        scopedLogger.info('[User connected]');
        // we add only newSession object but not the entire ws object - benefit from using child containers
        allSessions.add(newSession);
        newSession.pushOther({ type: 'clientActivity', connected: true, id });
        newSession.push({ type: 'restoreChat', items: chatStore.allMessages() });

        return newSession;
      },
      inject: [SCOPED_LOGGER, SCOPED_WS, CLIENT_ID, SESSION_ALL, CHAT_STORE] as const,
    }),
    injectable({
      provide: SERVER_INIT,
      inject: [PORT, LOGGER_CREATE, NET_SERVICE] as const,
      useFactory: (port, createLogger, netService) => () =>
        new Promise((resolve, reject) => {
          const logger = createLogger('server');
          const host = netService.findInterface({ family: 'IPv4', type: 'en0' })?.address;
          const server = new WebSocketServer({ port, host });

          server.on('connection', (ws) => {
            return createChildContainer(rootContainer, {
              providers: [injectable({ provide: SCOPED_WS, useValue: ws })],
            }).get(SESSION_ROOT);
          });

          server.on('listening', () => {
            logger.info(`Websocket server has successfully started on: "ws://${host}:${port}"`);
            logger.info(
              `
Create a new terminal tab and run the same script there and it will generate the chat client.
Do not close this tab! This is a server. 
You can create as many clients as you want by simply repeating the steps above
You can also change the "remoteHost" property to "${host}" in "examples/chat-app/index.ts" on a 
machine from your local network and connect to this server remotely`,
            );
            resolve(server);
          });

          server.on('error', (e) => reject(e));
        }),
    }),
  ],
  exports: { SERVER_INIT },
});
