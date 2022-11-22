import { createToken } from '../token';
import type { Token } from '../token.types';
type Num = number;
type Str = string;
type Fn = (a: 1) => 2;

const numberToken = createToken<Num>('token');
const stringToken = createToken<Str>('token');
const fnToken = createToken<Fn>('token');

// such format is required because the test depending on
// those types count on line nums and strongly bound to format
export default [
  {
    __test_anchor: true,
    fn: (): readonly [Num, Str, Fn] => {
      const num: Num & Token.Provide<typeof numberToken> = 1;
      const str: Str & Token.Provide<typeof stringToken> = 'str';
      const fn: Fn & Token.Provide<typeof fnToken> = (x) => {
        x.toString();
        return 2;
      };

      return [num, str, fn] as const;
    },
  },
  {
    __test_anchor: true,
    fn: (): readonly [Fn] => {
      const fn: Fn & Token.Provide<typeof fnToken> = (x) => {
        x.toString();
        return 1;
      };

      return [fn] as const;
    },
  },
];
