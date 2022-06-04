import { createToken, declareModule, injectable } from '@fridgefm/inverter';

export const LOGGER_TOKEN = createToken<{ log: (...messages: any[]) => void }>('logger');

export const LoggerModule = declareModule({
  name: 'LoggerModule',
  providers: [
    injectable({
      provide: LOGGER_TOKEN,
      useValue: { log: console.log },
    }),
  ],
});
