import type { ChatRecord } from './chat.module';

export type ClientMessage = { type: 'message'; items: string[] };
export type ServerMessage =
  | { type: 'message'; items: ChatRecord[] }
  | { type: 'restoreChat'; items: ChatRecord[] }
  | { type: 'clientActivity'; connected: boolean; id: string };
