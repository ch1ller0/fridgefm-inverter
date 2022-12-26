import { createToken, createModule, injectable } from '@fridgefm/inverter';
import type { ServerMessage } from './message.types';
export type ChatRecord = {
  chatMessage: string;
  date: number;
  from: string;
};

const CHAT_STORE = createToken<{
  allMessages: () => ChatRecord[];
  pushMessages: (messages: string[], byId: string) => ChatRecord[];
}>('chat:store');
const CHAT_WRITE = createToken<(rec: ServerMessage) => void>('chat:write');

export const ChatModule = createModule({
  name: 'ChatModule',
  providers: [
    injectable<typeof CHAT_STORE, []>({
      provide: CHAT_STORE,
      useFactory: () => {
        const messageStore = new Set<ChatRecord>();

        return {
          allMessages: () => [...messageStore.values()],
          pushMessages: (messages, from) => {
            const now = Date.now();
            const formatted = messages.map((chatMessage) => ({ chatMessage, from, date: now }));
            formatted.forEach((m) => {
              messageStore.add(m);
            });
            return formatted;
          },
        };
      },
      scope: 'singleton',
    }),
    injectable<typeof CHAT_WRITE, []>({
      provide: CHAT_WRITE,
      useFactory: () => {
        const writeWithTime = (str: string, date: Date = new Date()) => {
          const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
          // eslint-disable-next-line no-console
          console.log(`[${time}] ${str}`);
        };
        const writeChatRecord = (a: ChatRecord) => {
          const date = new Date(a.date);
          writeWithTime(`(${a.from}): ${a.chatMessage}`, date);
        };

        return (a) => {
          if (a.type === 'restoreChat') {
            a.items.forEach((item) => writeChatRecord(item));
            return;
          }
          if (a.type === 'message') {
            a.items.forEach((item) => writeChatRecord(item));
            return;
          }
          if (a.type === 'clientActivity') {
            const action = a.connected ? 'connected' : 'disconnected';
            writeWithTime(`User "${a.id}" ${action}`);
            return;
          }
          const never: never = a;
          throw new Error(never);
        };
      },
    }),
  ],
  exports: { CHAT_WRITE, CHAT_STORE },
});
