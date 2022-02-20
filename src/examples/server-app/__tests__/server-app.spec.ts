import { createToken, declareContainer, injectable, TokenProvide } from '../../../index';
import { CONTROLLER_TOKEN, ServerModule } from '../server.module';
import { LOGGER_TOKEN, LoggerModule } from '../logger.module';
import { ClientModule } from '../client.module';

const FAKE_ROOT_TOKEN = createToken<TokenProvide<typeof CONTROLLER_TOKEN>>('fake-root');

const createTestProviders = () => [
  injectable({
    provide: FAKE_ROOT_TOKEN,
    inject: [CONTROLLER_TOKEN] as const,
    useFactory: (handler) => handler,
  }),
  injectable({
    provide: LOGGER_TOKEN,
    useValue: { log: jest.fn() },
  }),
];

describe('integration:server-app', () => {
  it('works alone with ServerModule', async () => {
    const container = declareContainer({
      modules: [ServerModule],
      providers: createTestProviders(),
    });
    const emulateRequest = container.get(FAKE_ROOT_TOKEN);
    const requestReturns = await Promise.all([emulateRequest(), emulateRequest(), emulateRequest()]);
    const log = container.get(LOGGER_TOKEN).log as jest.MockedFunction<any>;

    expect(requestReturns.length).toEqual(3);
    expect(requestReturns[0].id).toEqual('ok');
    expect(requestReturns[0].count).toEqual(0);
    // logger was not called at all
    expect(log.mock.calls.length).toEqual(0);
  });

  it('works with added ClientModule+LoggerModule', async () => {
    const container = declareContainer({
      modules: [ClientModule, ServerModule, LoggerModule],
      providers: createTestProviders(),
    });
    const emulateRequest = container.get(FAKE_ROOT_TOKEN);
    const requestReturns = await Promise.all([emulateRequest(), emulateRequest(), emulateRequest()]);
    const log = container.get(LOGGER_TOKEN).log as jest.MockedFunction<any>;

    expect(requestReturns.length).toEqual(3);
    expect(requestReturns[0].id.length).toEqual(8);
    expect(requestReturns[0].count).toEqual(1);

    // cheeck that we have logged all incoming requests
    expect(log.mock.calls.length).toEqual(6);
    expect(log.mock.calls[0][0]).toEqual({ userId: requestReturns[0].id, message: 'increased' });
    expect(log.mock.calls[2][0]).toEqual({ userId: requestReturns[1].id, message: 'increased' });
    expect(log.mock.calls[4][0]).toEqual({ userId: requestReturns[2].id, message: 'increased' });
    expect(log.mock.calls[1]).not.toEqual(['server-store', {}]);
    // the store has filled with values
    expect(Object.values(log.mock.calls[1][1])).toEqual([1]);
    expect(Object.values(log.mock.calls[3][1])).toEqual([1, 1]);
    expect(Object.values(log.mock.calls[5][1])).toEqual([1, 1, 1]);
  });
});
