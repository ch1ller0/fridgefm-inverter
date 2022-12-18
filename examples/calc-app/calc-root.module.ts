/* eslint-disable no-console */
import rl from 'readline';
import { stdin as input, stdout as output } from 'process';
import { createToken, modifyToken, createModule, injectable } from '../../src/index';

type NVal = number;
type CalcCommand = (cur: NVal, inputVals: number[]) => NVal;

const ROOT = createToken<void>('root');
const REGISTER_COMMAND = modifyToken.multi(createToken<[string, CalcCommand]>('register-command'));
const HANDLER = createToken<(command: string, values: number[]) => NVal>('command-handler');
const WRITE = createToken<(mes: string | number) => void>('root');

export const RootModule = createModule({
  name: 'RootModule',
  providers: [
    injectable({
      provide: WRITE,
      useValue: (mes) => console.log(mes),
    }),
    injectable({
      provide: ROOT,
      useFactory: (handler, write) => {
        const readline = rl.createInterface({ input, output });
        const recurseAsk = () => {
          readline.question('', (answer) => {
            const [command, ...values] = answer.split(' ') as [string, ...string[]];
            const numericValues = values.map((s) => Number(s)).filter((s) => !isNaN(s));
            try {
              const result = handler(command, numericValues);
              write(result);
            } catch (e) {
              write(e.message);
            }
            recurseAsk();
          });
        };

        write('Type your query in format: [command] ...[values] For example: plus 1 2');

        recurseAsk();
      },
      inject: [HANDLER, WRITE] as const,
    }),
    injectable({
      provide: HANDLER,
      useFactory: (registerCommands) => {
        const commandsMap = registerCommands.reduce((acc, cur) => ({ ...acc, [cur[0]]: cur[1] }), {}) as Record<
          string,
          CalcCommand
        >;

        let currentVal: NVal = 0;

        return (command, values) => {
          const commandFn = commandsMap[command];
          if (!commandFn) {
            throw new Error(
              `Command "${command}" not found, use one of: ${Object.keys(commandsMap)
                .map((s) => `"${s}"`)
                .join(', ')}`,
            );
          }
          currentVal = commandFn(currentVal, values);

          return currentVal;
        };
      },
      inject: [REGISTER_COMMAND],
    }),
  ],
  extend: {
    withBasicCommands: () => [
      injectable({
        provide: REGISTER_COMMAND,
        useValue: ['current', (cur) => cur],
      }),
      injectable({
        provide: REGISTER_COMMAND,
        useValue: ['clear', () => 0],
      }),
    ],
  },
  exports: { REGISTER_COMMAND, ROOT },
});
