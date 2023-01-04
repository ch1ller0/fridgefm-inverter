import { createModule, createToken, injectable } from '@fridgefm/inverter';
import { Test } from '../index';

const rootToken = createToken<string>('root');
const FakeModule = createModule({
  name: 'FakeModule',
  providers: [
    injectable({
      provide: rootToken,
      useValue: 'from-module',
    }),
  ],
});

describe('@fridgefm/inverter-test', () => {
  it.todo('returns a desired object');
  it.todo('mocks implementations');

  it('can be composable', async () => {
    const original = Test.createTestingContainer({ modules: [FakeModule] });
    const modified = original.overrideProvider({ provide: rootToken, useValue: 'from-modified' });

    const c0 = await original.compile().get(rootToken);
    const c1 = await original.overrideProvider({ provide: rootToken, useValue: 'from-c1' }).compile().get(rootToken);
    const c2 = await modified.overrideProvider({ provide: rootToken, useValue: 'from-c2' }).compile().get(rootToken);
    expect({ c0, c1, c2 }).toEqual({
      c0: 'from-module',
      c1: 'from-c1',
      c2: 'from-c2',
    });
  });
});
