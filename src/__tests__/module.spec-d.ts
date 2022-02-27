import { declareModule, createToken, injectable } from '../index';
type Num = number;

const numberToken = createToken<Num>('token');

// such format is required because the test depending on
// those types count on line nums and strongly bound to format
export default [
  {
    __test_anchor: true,
    fn: () => {
      const BaseModule = declareModule({
        name: 'BaseModule',
        providers: [
          injectable({
            provide: numberToken,
            useValue: 1,
          }),
        ],
        extend: {
          forRoot: ({ value }: { value: number }) => [
            injectable({
              provide: numberToken,
              useValue: value,
            }),
          ],
        },
      });

      BaseModule.forRoot({ value: 10 });
    },
  },
  {
    __test_anchor: true,
    fn: () => {
      const BaseModule = declareModule({
        name: 'BaseModule',
        providers: [
          injectable({
            provide: numberToken,
            useValue: 1,
          }),
        ],
      });

      BaseModule.forRoot({ value: 10 }); // this method is not provided
    },
  },
];
