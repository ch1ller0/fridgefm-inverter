import { createModule, injectable, createToken } from '@fridgefm/inverter';
import { ServerModule } from './server.module';
import { ClientModule } from './client.module';

const { SERVER_INIT } = ServerModule.exports;
const { CLIENT_INIT, REMOTE_HOST } = ClientModule.exports;
const ROOT = createToken<void>('root');

export const RootModule = createModule({
  name: 'RootModule',
  providers: [
    injectable({
      provide: ROOT,
      inject: [SERVER_INIT, CLIENT_INIT, { token: REMOTE_HOST, optional: true }] as const,
      useFactory: (initServer, initClient, remoteHost) => {
        if (typeof remoteHost !== 'undefined') {
          // if remote host is set, we start the client immediately
          return initClient();
        }
        return initServer().catch((e) => {
          if (e.code === 'EADDRINUSE') {
            // that means that the port is already taken, which means the server is already running
            // and we can run the client
            return initClient();
          }
          throw e;
        });
      },
    }),
  ],
  exports: { ROOT },
});
