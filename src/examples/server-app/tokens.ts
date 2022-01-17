import { createToken } from '../../index'; // di entry

// server providers
export const ROOT_TOKEN = createToken<void>('root');
export const STORE_TOKEN = createToken<{
  getStateFor: (key: string) => number;
  increaseFor: (key: string, count: number) => void;
  getAll: () => Record<string, number>;
}>('store');
export const CONTROLLER_TOKEN = createToken<() => Promise<{ id: string; count: number }>>('handler');

// client providers
export const CLIENT_TOKEN = createToken<{ id: string }>('client');
export const GET_ID_TOKEN = createToken<string>('get-id');
export const ID_LENGTH_TOKEN = createToken<number>('id-length');
export const CLIENT_LOGGER_TOKEN = createToken<(message: string) => void>('client-logger-token');
