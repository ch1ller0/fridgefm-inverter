import rl from 'readline';
import { stdin as input, stdout as output } from 'process';
import { createToken, createMultiToken, declareModule, injectable } from '../../index';

type NVal = number;
type CalcCommand = (cur: NVal, inputVals: number[]) => NVal;
export const REGISTER_COMMAND_TOKEN = createMultiToken<[string, CalcCommand]>('register-command');
export const HANDLER_TOKEN = createToken<(command: string, values: number[]) => NVal>('command-handler');
export const ROOT_TOKEN = createToken<void>('root');

export const RootModule = declareModule({
  name: 'RootModule',
  providers: [
    injectable({
      provide: ROOT_TOKEN,
      useFactory: ({ handler }) => {
        const readline = rl.createInterface({ input, output });
        const recurseAsk = () => {
          readline.question('', (answer) => {
            const [command, ...values] = answer.split(' ') as [string, ...string[]];
            const numericValues = values.map((s) => Number(s)).filter((s) => !isNaN(s));
            try {
              const result = handler(command, numericValues);
              console.log(result);
            } catch (e) {
              // @ts-ignore
              console.log(e.message);
            }
            recurseAsk();
          });
        };

        console.log('Type your query in format: [command] ...[values] For example: plus 1 2');

        recurseAsk();
      },
      deps: {
        handler: { token: HANDLER_TOKEN, optional: true },
      },
    }),
    injectable({
      provide: HANDLER_TOKEN,
      useFactory: ({ registerCommands }) => {
        const commandsMap = registerCommands.reduce((acc, cur) => ({ ...acc, [cur[0]]: cur[1] }), {}) as Record<
          string,
          CalcCommand
        >;

        let currentVal: NVal = 0;

        return (command, values) => {
          const commandFn = commandsMap[command];
          if (!commandFn) {
            throw new Error(`Command "${command}" not found, use one of: "${Object.keys(commandsMap)}"`);
          }
          currentVal = commandFn(currentVal, values);

          return currentVal;
        };
      },
      deps: {
        registerCommands: REGISTER_COMMAND_TOKEN,
      } as const,
    }),
  ],
  extend: {
    withBasicCommands: () => [
      injectable({
        provide: REGISTER_COMMAND_TOKEN,
        useValue: ['current', (cur) => cur],
      }),
      injectable({
        provide: REGISTER_COMMAND_TOKEN,
        useValue: ['clear', () => 0],
      }),
    ],
  },
});
