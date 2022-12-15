import { createToken, createModule, injectable } from '../../src/index';

export type ChatRecord = {
  chatMessage: string;
  date: number;
  from: string;
};

export const CHAT_STORE = createToken<{
  allMessages: () => ChatRecord[];
  pushMessage: (message: string, byId: string) => void;
}>('chat:store');
export const CHAT_WRITE = createToken<(rec: ChatRecord) => void>('chat:write');

export const ChatModule = createModule({
  name: 'ChatModule',
  providers: [
    injectable<typeof CHAT_STORE, []>({
      provide: CHAT_STORE,
      useFactory: () => {
        const messageStore = new Set<ChatRecord>();

        return {
          allMessages: () => [...messageStore.values()],
          pushMessage: (chatMessage, from) => messageStore.add({ chatMessage, from, date: Date.now() }),
        };
      },
      scope: 'singleton',
    }),
    injectable({
      provide: CHAT_WRITE,
      useValue: (a: ChatRecord) => {
        const date = new Date(a.date);
        const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        console.log(`[${time}] (${a.from}): ${a.chatMessage}`);
      },
    }),
  ],
});
