import { createModule, injectable, createToken, modifyToken, createContainer } from '../../index';

const STRING = createToken<string>('string');
const MULTI_STRING = modifyToken.multi(STRING);

describe('module/module', () => {
  const ModuleOne = createModule({
    name: 'ModuleName',
    providers: [
      injectable({ provide: STRING, useValue: 'module-single' }),
      injectable({ provide: MULTI_STRING, useValue: 'module-multi' }),
    ],
    extend: {
      extendStrings: (str = '') => [
        injectable({ provide: STRING, useValue: `extend${str}-single` }),
        injectable({ provide: MULTI_STRING, useValue: `extend${str}-multi` }),
      ],
    },
    exports: { STRING, MULTI_STRING },
  });

  it('exports', () => {
    expect(ModuleOne.exports).toEqual({ STRING, MULTI_STRING });
  });

  it('extensions', async () => {
    const container1 = createContainer({ modules: [ModuleOne] });
    const a1 = await container1.get(STRING);
    const b1 = await container1.get(MULTI_STRING);
    expect({ a1, b1 }).toEqual({ a1: 'module-single', b1: ['module-multi'] });

    const container2 = createContainer({ modules: [ModuleOne.extendStrings('0')] });
    const a2 = await container2.get(STRING);
    const b2 = await container2.get(MULTI_STRING);
    expect({ a2, b2 }).toEqual({ a2: 'extend0-single', b2: ['module-multi', 'extend0-multi'] });

    const container3 = createContainer({
      modules: [ModuleOne.extendStrings('1').extendStrings('2'), ModuleOne.extendStrings('3')],
    });
    const a3 = await container3.get(STRING);
    const b3 = await container3.get(MULTI_STRING);
    expect({ a3, b3 }).toEqual({
      a3: 'extend3-single',
      b3: ['module-multi', 'extend1-multi', 'extend2-multi', 'extend3-multi'],
    });
  });
});
