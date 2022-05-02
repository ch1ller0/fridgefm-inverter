import { createToken, modifyToken } from '../base/token';
import { createBaseContainer } from '../base/base-container';
type Num = number;

const multiToken = modifyToken.multi(createToken<Num>('token'));
const optionalToken = modifyToken.optionalValue(createToken<Num>('token'), 10);
// such format is required because the test depending on
// those types count on line nums and strongly bound to format
export default [
  {
    __test_anchor: true,
    fn: (): readonly number[] => {
      const container = createBaseContainer();
      const s: number[] = container.get(multiToken);

      return s;
    },
  },
  {
    __test_anchor: true,
    fn: (): readonly number[] => {
      const container = createBaseContainer();
      const s: number = container.get(optionalToken);

      return [s];
    },
  },
];
