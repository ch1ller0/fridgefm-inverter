/* eslint-disable import/no-extraneous-dependencies */
import { pino } from 'pino';
import pinoPretty from 'pino-pretty';
import { createModule, injectable, createToken } from '../../src/index';
import type { Logger } from 'pino';

const LOGGER_CREATE = createToken<(name: string) => Logger>('logger:create');
const LOGGER_GLOBAL = createToken<Logger>('logger:global');

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
  exports: { LOGGER_CREATE, LOGGER_GLOBAL },
});
