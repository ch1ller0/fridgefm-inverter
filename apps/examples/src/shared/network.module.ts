import { networkInterfaces, type NetworkInterfaceInfo } from 'os';
import { createModule, injectable, createToken } from '@fridgefm/inverter';

type NetInterface = {
  address: string;
  type: string; // lo, en, ...
  family: NetworkInterfaceInfo['family'];
};

const NET_SERVICE = createToken<{
  getInternalInterface: () => NetInterface | undefined;
}>('network:service');

export const NetworkModule = createModule({
  name: 'NetworkModule',
  providers: [
    injectable<typeof NET_SERVICE, []>({
      provide: NET_SERVICE,
      useFactory: () => {
        const interfaces = Object.entries(networkInterfaces())
          .map(([type, value]) => value?.map(({ family, address }) => ({ type, address, family })))
          .flat() as NetInterface[];

        return {
          getInternalInterface: () =>
            interfaces.find(({ address, family }) => address.startsWith('192.168') && family === 'IPv4'),
        };
      },
    }),
  ],
  exports: { NET_SERVICE },
});
