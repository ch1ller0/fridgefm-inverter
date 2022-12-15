import { createToken } from '../../src/index';

export const PORT = createToken<number>('root:port');
