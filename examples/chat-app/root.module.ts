// eslint-disable-next-line import/no-extraneous-dependencies
import net from 'net';
import { createModule, injectable, createToken } from '../../src/index';
import { ServerModule } from './server.module';
import { ClientModule } from './client.module';

const { SERVER_INIT } = ServerModule.exports;
const { CLIENT_INIT } = ClientModule.exports;
const { PORT } = ClientModule.exports;
const ROOT = createToken<void>('root');
const IS_PORT_BUSY = createToken<(port: number) => Promise<boolean>>('root:is-port-busy');

export const RootModule = createModule({
  name: 'RootModule',
  providers: [
    injectable({
      provide: IS_PORT_BUSY,
      useValue: (port) =>
        new Promise((resolve, reject) => {
          const tester = net
            .createServer()
            .once('error', function (err) {
              // @ts-ignore
              if (err.code != 'EADDRINUSE') return reject(err);
              resolve(true);
            })
            .once('listening', function () {
              tester
                .once('close', function () {
                  resolve(false);
                })
                .close();
            })
            .listen(port);
        }),
    }),
    injectable({
      provide: ROOT,
      inject: [IS_PORT_BUSY, PORT, SERVER_INIT, CLIENT_INIT] as const,
      useFactory: async (isPortBusy, port, initServer, initClient) => {
        const isBusy = await isPortBusy(port);
        (isBusy ? initClient : initServer)();
      },
    }),
  ],
  extend: {
    // if you want to configure port via dynamic module
    forRoot: ({ port }: { port: number }) => [injectable({ provide: PORT, useValue: port })],
  },
  exports: { ROOT },
});
