// eslint-disable-next-line import/no-extraneous-dependencies
import { WebSocketServer, type WebSocket } from 'ws';
import { createModule, createToken, injectable, declareChildContainer } from '../../src/index';
import { LOGGER_CREATE } from '../shared/logger.module';
import { PORT } from './root.tokens';
import { CHAT_STORE } from './chat.module';
import { UNIQUE_ID } from './client.module';
import { rootContainer } from './index';
import type { ServerMessage, ClientMessage } from './message.types';

type Session = { push: (m: ServerMessage) => void; pushOther: (m: ServerMessage) => void; id: string };

export const SERVER_INIT = createToken<() => void>('server:init');
export const REGISTER_CLIENT = createToken<(ws: WebSocket) => void>('server:register');
export const SESSION_ROOT = createToken<Session>('server:session:root');
export const SESSION_ALL = createToken<Set<Session>>('server:session:all');
export const REQUEST_WS = createToken<WebSocket>('request:ws');

export const ServerModule = createModule({
  name: 'ServerModule',
  providers: [
    injectable({ provide: SESSION_ALL, useValue: new Set<Session>() }),
    injectable({
      provide: SESSION_ROOT,
      useFactory: (ws, id, allSessions, chatStore) => {
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
        });

        ws.on('message', (raw: string) => {
          const parsed = JSON.parse(raw) as ClientMessage;
          if (parsed?.type === 'message') {
            const fromatted = chatStore.pushMessages(parsed.items, id);
            newSession.pushOther({ type: 'message', items: fromatted });
          }
        });

        allSessions.add(newSession);
        newSession.pushOther({ type: 'clientActivity', connected: true, id });
        newSession.push({ type: 'restoreChat', items: chatStore.allMessages() });

        return newSession;
      },
      inject: [REQUEST_WS, UNIQUE_ID, SESSION_ALL, CHAT_STORE] as const,
    }),
    injectable({
      provide: SERVER_INIT,
      inject: [PORT, LOGGER_CREATE, SESSION_ALL] as const,
      useFactory: (port, createLogger, allSessions) => () => {
        const logger = createLogger('server');
        const server = new WebSocketServer({ port });

        server.on('connection', async (ws) => {
          return declareChildContainer(rootContainer, {
            providers: [injectable({ provide: REQUEST_WS, useValue: ws })],
          }).get(SESSION_ROOT);
        });

        setInterval(() => {
          const activeSessions = [...allSessions.values()];
          logger.info({ sessions: activeSessions.map((s) => s.id).join(','), count: activeSessions.length });
        }, 5000);

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
});
