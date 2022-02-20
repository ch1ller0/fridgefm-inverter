import { createToken, declareContainer, injectable, TokenProvide } from '../../../index';
import { CONTROLLER_TOKEN, LOGGER_TOKEN } from '../server.module';
import { config } from '../index';

const FAKE_ROOT_TOKEN = createToken<TokenProvide<typeof CONTROLLER_TOKEN>>('fake-root');

describe('integration:server-app', () => {
  it('change root and logger provider', async () => {
    const container = declareContainer({
      ...config,
      providers: [
        injectable({
          provide: FAKE_ROOT_TOKEN,
          inject: [CONTROLLER_TOKEN] as const,
          useFactory: (handler) => handler,
        }),
        injectable({
          provide: LOGGER_TOKEN,
          useValue: { log: jest.fn() },
        }),
      ],
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
