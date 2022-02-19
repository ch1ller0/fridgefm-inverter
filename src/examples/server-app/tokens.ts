import { createToken, modifyToken } from '../../index'; // di entry

// server providers
export const ROOT_TOKEN = createToken<void>('root');
export const STORE_TOKEN = createToken<{
  getStateFor: (key: string) => number;
  increaseFor: (key: string, count: number) => void;
  getAll: () => Record<string, number>;
}>('store');
export const CONTROLLER_TOKEN = createToken<() => Promise<{ id: string; count: number }>>('handler');
export const LOGGER_TOKEN = createToken<{ log: (...messages: any[]) => void }>('logger');

// client providers
export const CLIENT_ROOT_TOKEN = createToken<{ id: string }>('client-root');
export const CLIENT_LOGGER_TOKEN = createToken<(message: string) => void>('client-logger');
export const GET_ID_TOKEN = createToken<string>('get-id');
export const ID_LENGTH_TOKEN = createToken<number>('id-length');
export const ON_REQUEST_TOKEN = modifyToken.multi(
  createToken<(info: { id: string; count: number }) => number>('on-request-multi'),
);
