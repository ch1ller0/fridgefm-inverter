/* eslint-disable import/no-extraneous-dependencies */
import { networkInterfaces } from 'os';
import { createModule, injectable, createToken } from '../../src/index';
import type { NetworkInterfaceInfo } from 'os';

const INTERFACE_TYPES = [
  'lo0',
  'lo0',
  'lo0',
  'anpi1',
  'anpi0',
  'anpi2',
  'ap1',
  'en0',
  'en0',
  'en0',
  'awdl0',
  'llw0',
  'utun0',
  'utun1',
  'utun2',
] as const;

type NetInterface = {
  address: string;
  type: typeof INTERFACE_TYPES[number];
  family: NetworkInterfaceInfo['family'];
};

const NET_SERVICE = createToken<{
  findInterface: (query: Partial<Pick<NetInterface, 'family' | 'type'>>) => NetInterface | undefined;
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
          findInterface: (query) => {
            if (!Object.keys(query).length) {
              return undefined;
            }

            return interfaces.find((s) =>
              Object.entries(query).reduce((acc, [key, expected]) => acc && s[key] === expected, true as boolean),
            );
          },
        };
      },
    }),
  ],
  exports: { NET_SERVICE },
});
