import { createToken } from '../base/token';
import { injectable } from '../module/provider-declaration';
type Num = number;

const numberToken = createToken<Num>('token');
const helperToken = createToken<Num>('helper');

// such format is required because the test depending on
// those types count on line nums and strongly bound to format
export default [
  {
    __test_anchor: true,
    fn: injectable({
      provide: numberToken,
      useValue: 1,
    }),
  },
  {
    __test_anchor: true,
    fn: injectable({
      provide: numberToken,
      useFactory: () => 1,
    }),
  },
  {
    __test_anchor: true,
    fn: injectable({
      provide: numberToken,
      useFactory: (a) => a + 1,
      inject: [helperToken] as const,
    }),
  },
  {
    __test_anchor: true,
    fn: injectable({
      provide: numberToken,
      useFactory: (a) => a + 1,
      inject: [helperToken] as const,
    }),
  },
  {
    __test_anchor: true,
    fn: injectable({
      provide: numberToken,
      useFactory: (a) => a + 1,
    }),
  },
  {
    __test_anchor: true,
    fn: injectable({
      provide: numberToken,
      useValue: 10,
      useFactory: (a) => a + 1,
      inject: [helperToken] as const,
    }),
  },
];
