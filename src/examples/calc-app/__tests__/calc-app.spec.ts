import { declareContainer, injectable } from '../../../index';
import { ROOT_TOKEN, HANDLER_TOKEN } from '../calc-root.module';
import { RootModule } from '../calc-root.module';
import { OperationsModule } from '../operations.module';

const createTestProviders = () => [
  injectable({
    provide: ROOT_TOKEN,
    useFactory: () => {},
  }),
];

describe('integration:calc-app', () => {
  it('does not add basic commands if not explicitly called', () => {
    const container = declareContainer({
      modules: [RootModule],
      providers: createTestProviders(),
    });
    const handler = container.get(HANDLER_TOKEN);
    expect(() => handler('current', [])).toThrowError('Command "current" not found, use one of: ""');
    expect(() => handler('clear', [])).toThrowError('Command "clear" not found, use one of: ""');
    expect(() => handler('plus', [])).toThrowError('Command "plus" not found, use one of: ""');
  });

  it('works alone with RootModule.withBasicCommands', () => {
    const container = declareContainer({
      modules: [RootModule.withBasicCommands()],
      providers: createTestProviders(),
    });
    const handler = container.get(HANDLER_TOKEN);
    expect(() => handler('plus', [])).toThrowError('Command "plus" not found, use one of: "current,clear"');
    expect(handler('current', [1, 2])).toEqual(0);
    expect(handler('clear', [1, 2])).toEqual(0);
  });

  it('OperationsModule adds operations as expected', () => {
    const container = declareContainer({
      modules: [OperationsModule, RootModule.withBasicCommands()],
      providers: createTestProviders(),
    });
    const handler = container.get(HANDLER_TOKEN);

    expect(handler('current', [])).toEqual(0);
    expect(handler('multiply', [17, 27])).toEqual(0);
    expect(handler('plus', [2]));
    expect(handler('multiply', [17, 27])).toEqual(918);
    expect(handler('minus', [300])).toEqual(618);
    expect(handler('divide', [3, 2])).toEqual(103);
    expect(handler('minus', [3])).toEqual(100);
    expect(() => {
      handler('bibka', [110]);
    }).toThrowError('Command "bibka" not found, use one of: "plus,minus,multiply,divide,current,clear"');
    expect(handler('clear', [3])).toEqual(0);
    expect(handler('plus', [100])).toEqual(100);
    expect(handler('divide', [0, 1])).toEqual(Infinity);
  });
});
