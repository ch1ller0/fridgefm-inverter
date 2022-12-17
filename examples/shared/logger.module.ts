/* eslint-disable import/no-extraneous-dependencies */
import { pino } from 'pino';
import pinoPretty from 'pino-pretty';
import { createModule, injectable } from '../../src/index';
import { UNIQUE_ID } from '../chat-app/client.module';
import { LOGGER_CREATE, LOGGER_GLOBAL, LOGGER_SCOPED } from './logger.tokens';

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
    injectable({
      provide: LOGGER_SCOPED,
      useFactory: (id, createLogger) => createLogger(id),
      inject: [UNIQUE_ID, LOGGER_CREATE] as const,
    }),
  ],
});
