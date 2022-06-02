import { createToken } from '../base/token';
import { injectable } from '../module/provider-declaration';
type Num = number;
type Class = {
  a: () => number;
  b: () => number;
};

const numberToken = createToken<Num>('token');
const helperToken = createToken<Num>('helper');
const classToken = createToken<Class>('class');
const fnToken = createToken<(param: number) => number>('fn');

// such format is required because the test depending on
// those types count on line nums and strongly bound to format
export default [
  {
    __test_anchor: true,
    // examples of correct usage
    fn: () => {
      injectable({
        provide: numberToken,
        useValue: 1,
      });

      injectable({
        provide: numberToken,
        useFactory: () => 1,
      });

      injectable({
        provide: numberToken,
        useFactory: (a) => a + 1,
        inject: [helperToken] as const,
      });

      injectable({
        provide: numberToken,
        useFactory: (a) => a + 1,
        inject: [helperToken] as const,
      });
    },
  },
  {
    __test_anchor: true,
    // examples of typos
    fn: () => {
      // no inject field
      injectable({
        provide: numberToken,
        useFactory: (a) => a + 1,
      });

      // mix of value and factory
      injectable({
        provide: numberToken,
        useValue: 10,
        useFactory: (a) => a + 1,
        inject: [helperToken] as const,
      });
    },
  },
  {
    __test_anchor: true,
    // provide wrong indexed type
    fn: () => {
      injectable({
        provide: classToken,
        useValue: { a: () => 1 },
      });

      // insuffiecent members
      injectable({
        provide: classToken,
        useFactory: () => ({ a: () => 1 }),
      });

      injectable({
        provide: classToken,
        useFactory: (helper) => ({ a: () => helper + 1, c: () => 2 }),
        inject: [helperToken] as const,
      });

      injectable({
        provide: classToken,
        // @TODO this should be an error
        useFactory: () => ({ a: () => 1, b: () => 3, c: 1 }),
      });
    },
  },
  {
    __test_anchor: true,
    // provide wrong indexed type
    fn: () => {
      // this one works ok
      injectable({
        provide: fnToken,
        useFactory: (num) => (a) => a + num,
        inject: [numberToken] as const,
      });

      injectable({
        provide: fnToken,
        useFactory: () => {
          const num = 5;
          // casts to any - really bad but there is a workaround
          return (implicitN) => implicitN + num;
        },
      });

      // @TODO add this workaround in the doc -> provide explicit dependencies
      injectable<typeof fnToken, []>({
        provide: fnToken,
        useFactory: () => {
          const num = 5;
          return (explicitN) => explicitN + num;
        },
      });
    },
  },
];
