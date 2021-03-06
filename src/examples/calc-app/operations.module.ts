import { declareModule, injectable } from '../../index';
import { RootModule, REGISTER_COMMAND_TOKEN } from './calc-root.module';

export const OperationsModule = declareModule({
  name: 'OperationsModule',
  providers: [
    injectable({
      provide: REGISTER_COMMAND_TOKEN,
      useValue: ['plus', (cur, inputVals) => inputVals.reduce((acc, val) => acc + val, cur)],
    }),
    injectable({
      provide: REGISTER_COMMAND_TOKEN,
      useValue: ['minus', (cur, inputVals) => inputVals.reduce((acc, val) => acc - val, cur)],
    }),
    injectable({
      provide: REGISTER_COMMAND_TOKEN,
      useValue: ['multiply', (cur, inputVals) => inputVals.reduce((acc, val) => acc * val, cur)],
    }),
    injectable({
      provide: REGISTER_COMMAND_TOKEN,
      useValue: ['divide', (cur, inputVals) => inputVals.reduce((acc, val) => acc / val, cur)],
    }),
  ],
  imports: [RootModule],
});
