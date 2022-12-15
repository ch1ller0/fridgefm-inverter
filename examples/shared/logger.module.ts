/* eslint-disable import/no-extraneous-dependencies */
import { pino } from 'pino';
import pinoPretty from 'pino-pretty';
import { createModule, createToken, injectable } from '../../src/index';
import type { Logger } from 'pino';

export const LOGGER_CREATE = createToken<(name: string) => Logger>('logger:create');
export const LOGGER_GLOBAL = createToken<Logger>('logger:global');

export const LoggerModule = createModule({
  name: 'LoggerModule',
  providers: [
    injectable({
      provide: LOGGER_GLOBAL,
      useValue: pino(pinoPretty()),
    }),
    injectable({
      scope: 'singleton',
      provide: LOGGER_CREATE,
      useFactory: (globalLogger) => {
        return (name) => globalLogger.child({ name });
      },
      inject: [LOGGER_GLOBAL] as const,
    }),
  ],
});
