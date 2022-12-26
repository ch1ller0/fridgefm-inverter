import os from 'os';
import { Test } from '@fridgefm/inverter-test';
import { LoggerModule, NetworkModule } from '../index';

const { LOGGER_GLOBAL, LOGGER_CREATE } = LoggerModule.exports;
const { NET_SERVICE } = NetworkModule.exports;
const mocks = { loggerGlobal: { child: jest.fn() } };
const moduleRef = Test.createTestingContainer({
  modules: [LoggerModule, NetworkModule],
}).overrideProvider({ provide: LOGGER_GLOBAL, useValue: mocks.loggerGlobal });

describe('integration:shared', () => {
  describe('LoggerModule', () => {
    it('child', async () => {
      await moduleRef
        .compile()
        .get(LOGGER_CREATE)
        .then((createChild) => createChild('fake-name'));

      expect(mocks.loggerGlobal.child).toHaveBeenCalledTimes(1);
      expect(mocks.loggerGlobal.child).toHaveBeenLastCalledWith({ name: 'fake-name' });
    });
  });

  describe('NetworkModule', () => {
    const networkMocks = {
      lo0: [{ address: '127.0.0.1', family: 'IPv4' }],
      en0: [{ address: '192.168.178.1', family: 'IPv4' }],
      utun2: [{ address: 'fe80::ce81:b1c:bd2c:69e', family: 'IPv6' }],
    };
    // @ts-ignore
    jest.spyOn(os, 'networkInterfaces').mockReturnValue(networkMocks);

    it('ok', async () => {
      const netService = await moduleRef.compile().get(NET_SERVICE);
      const expected = netService.getInternalInterface();

      expect(expected).toEqual({ type: 'en0', ...networkMocks.en0[0] });
    });
  });
});
