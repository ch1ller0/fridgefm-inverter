import { createModule, injectable } from '../../src/index';
import { RootModule, REGISTER_COMMAND } from './calc-root.module';

export const OperationsModule = createModule({
  name: 'OperationsModule',
  providers: [
    injectable({
      provide: REGISTER_COMMAND,
      useValue: ['plus', (cur, inputVals) => inputVals.reduce((acc, val) => acc + val, cur)],
    }),
    injectable({
      provide: REGISTER_COMMAND,
      useValue: ['minus', (cur, inputVals) => inputVals.reduce((acc, val) => acc - val, cur)],
    }),
    injectable({
      provide: REGISTER_COMMAND,
      useValue: ['multiply', (cur, inputVals) => inputVals.reduce((acc, val) => acc * val, cur)],
    }),
    injectable({
      provide: REGISTER_COMMAND,
      useValue: [
        'divide',
        (cur, inputVals) => {
          if (inputVals.some((s) => s === 0)) {
            throw new Error('Division by zero is not supported');
          }
          return inputVals.reduce((acc, val) => acc / val, cur);
        },
      ],
    }),
  ],
  imports: [RootModule],
});
