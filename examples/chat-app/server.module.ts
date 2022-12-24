// eslint-disable-next-line import/no-extraneous-dependencies
import { WebSocketServer, type WebSocket } from 'ws';
import {
  createModule,
  createToken,
  injectable,
  createChildContainer,
  internalTokens,
  type TokenProvide,
} from '../../src/index';
import { LoggerModule } from '../shared/logger.module';
import { ChatModule } from './chat.module';
import { ClientModule } from './client.module';

import type { ServerMessage, ClientMessage } from './message.types';
type Session = {
  push: (m: ServerMessage) => void;
  pushOther: (m: ServerMessage) => void;
  id: string;
};

const { CHAT_STORE } = ChatModule.exports;
const { UNIQUE_ID } = ClientModule.exports;
const { LOGGER_CREATE, LOGGER_GLOBAL } = LoggerModule.exports;
const { PORT } = ClientModule.exports;
const SERVER_INIT = createToken<() => void>('server:init');
const SESSION_ROOT = createToken<Session>('server:session:root');
const SESSION_ALL = createToken<Set<Session>>('server:session:all');
const REQUEST_WS = createToken<WebSocket>('request:ws');
const LOGGER_SCOPED = createToken<TokenProvide<typeof LOGGER_GLOBAL>>('logger:scoped');

export const ServerModule = createModule({
  name: 'ServerModule',
  imports: [ClientModule, ChatModule],
  providers: [
    injectable({
      provide: LOGGER_SCOPED,
      useFactory: (id, createLogger) => createLogger(id),
      inject: [UNIQUE_ID, LOGGER_CREATE] as const,
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
      inject: [LOGGER_SCOPED, REQUEST_WS, UNIQUE_ID, SESSION_ALL, CHAT_STORE] as const,
    }),
    injectable({
      provide: SERVER_INIT,
      inject: [internalTokens.SELF_CONTAINER, PORT, LOGGER_CREATE, SESSION_ALL] as const,
      useFactory: (baseContainer, port, createLogger) => () => {
        const logger = createLogger('server');
        const server = new WebSocketServer({ port });

        server.on('connection', (ws) => {
          return createChildContainer(baseContainer, {
            providers: [injectable({ provide: REQUEST_WS, useValue: ws })],
          }).get(SESSION_ROOT);
        });

        logger.info(`Websocket server has successfully started on port ${port}`);
        logger.info(
          `
Create a new terminal tab and run the same script there and it will generate the chat client.
Do not close this tab! This is a server. 
You can create as many clients as you want by simply repeating the steps above`,
        );

        return server;
      },
    }),
  ],
  exports: { SERVER_INIT },
});
