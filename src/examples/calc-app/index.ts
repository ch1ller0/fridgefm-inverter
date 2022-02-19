import rl from 'readline';
import { stdin as input, stdout as output } from 'process';
import { declareContainer, injectable, createToken, modifyToken } from '../../index';

type NVal = number;
type CalcCommand = (cur: NVal, inputVals: number[]) => NVal;
const REGISTER_COMMAND_TOKEN = modifyToken.multi(createToken<[string, CalcCommand]>('register-command'));
export const HADNLER_TOKEN = createToken<(command: string, values: number[]) => NVal>('command-map');
export const ROOT_TOKEN = createToken<void>('root');

export const providers = [
  injectable({
    provide: ROOT_TOKEN,
    useFactory: (handler) => {
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
    inject: [HADNLER_TOKEN],
  }),
  injectable({
    provide: HADNLER_TOKEN,
    useFactory: (registerCommands) => {
      const commandsMap = registerCommands.reduce((acc, cur) => ({ ...acc, [cur[0]]: cur[1] }), {}) as Record<
        string,
        CalcCommand
      >;

      let currentVal: NVal = 0;

      return (command, values) => {
        const commandFn = commandsMap[command];
        if (!commandFn) {
          throw new Error(`Command ${command} not found, use one of: "${Object.keys(commandsMap)}"`);
        }
        currentVal = commandFn(currentVal, values);

        return currentVal;
      };
    },
    inject: [REGISTER_COMMAND_TOKEN],
  }),
  injectable({
    provide: REGISTER_COMMAND_TOKEN,
    useValue: ['current', (cur) => cur],
  }),
  injectable({
    provide: REGISTER_COMMAND_TOKEN,
    useValue: ['clear', () => 0],
  }),
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
];

if (process.env.NODE_ENV !== 'test') {
  declareContainer({ providers }).get(ROOT_TOKEN);
}
