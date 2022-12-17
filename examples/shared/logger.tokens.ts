import { createToken } from '../../src/index';
import type { Logger } from 'pino';

export const LOGGER_CREATE = createToken<(name: string) => Logger>('logger:create');
export const LOGGER_SCOPED = createToken<Logger>('logger:scoped');
export const LOGGER_GLOBAL = createToken<Logger>('logger:global');
