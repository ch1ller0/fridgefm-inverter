import { createModule, injectable } from '../../src/index';
import { RootModule } from './calc-root.module';

const { REGISTER_COMMAND } = RootModule.exports;

export const OperationsModule = createModule({
  name: 'OperationsModule',
  imports: [RootModule],
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
});
