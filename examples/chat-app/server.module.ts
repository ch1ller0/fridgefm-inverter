// eslint-disable-next-line import/no-extraneous-dependencies
import { WebSocketServer, type WebSocket } from 'ws';
import { createModule, createToken, injectable } from '../../src/index';
import { LOGGER_CREATE } from '../shared/logger.module';
import { PORT } from './root.tokens';
import { CHAT_STORE, type ChatRecord } from './chat.module';

type Message = { type: 'message'; items: ChatRecord[] } | { type: 'restoreChat'; items: ChatRecord[] };
type Client = { push: (m: Message) => void };

export const SERVER_INIT = createToken<() => void>('server:init');
export const REGISTER_CLIENT = createToken<(ws: WebSocket, id: string) => void>('server:register');

export const ServerModule = createModule({
  name: 'ServerModule',
  providers: [
    injectable({
      provide: REGISTER_CLIENT,
      useFactory: (createLogger, chatStore) => {
        const logger = createLogger('service');
        const clientsSet = new Map<string, Client>();

        return (ws, id) => {
          const newClient: Client = {
            push: (a) => ws.send(JSON.stringify(a)),
          };
          newClient.push({ type: 'restoreChat', items: chatStore.allMessages() });
          ws.on('close', () => {
            logger.info(`Client disconnected: ${id}`);
            clientsSet.delete(id);
          });
          ws.on('message', (raw) => {
            // @ts-ignore
            const parsed = JSON.parse(raw);
            if (parsed?.type === 'message') {
              parsed.items.forEach((message) => {
                chatStore.pushMessage(message, id);
              });
              const allOtherClients = [...clientsSet.entries()].filter((s) => s[0] !== id);
              const allMessages = chatStore.allMessages();
              allOtherClients.forEach((s) => {
                s[1].push({ type: 'message', items: [allMessages[allMessages.length - 1]] });
              });
            }
          });

          clientsSet.set(id, newClient);
          logger.info(`Client connected: ${id}`);
        };
      },
      inject: [LOGGER_CREATE, CHAT_STORE] as const,
    }),
    injectable({
      provide: SERVER_INIT,
      inject: [PORT, LOGGER_CREATE, REGISTER_CLIENT] as const,
      useFactory: (port, createLogger, registerClient) => () => {
        const logger = createLogger('server');
        const server = new WebSocketServer({ port });
        server.on('connection', (ws) => {
          const clientId = Math.random().toString().slice(2, 8);
          registerClient(ws, clientId);
        });

        logger.info(`Websocket server has successfully started on port ${port}`);

        return server;
      },
    }),
  ],
});
