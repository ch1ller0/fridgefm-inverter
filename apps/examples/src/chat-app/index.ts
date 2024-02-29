import { createContainer } from '@fridgefm/inverter';
import { LoggerModule, NetworkModule } from '../shared';
import { RootModule } from './root.module';
import { ServerModule } from './server.module';
import { ClientModule } from './client.module';
import { ChatModule } from './chat.module';
import type { PublicContainer } from '@fridgefm/inverter';

const { ROOT } = RootModule.exports;
const config: PublicContainer.Configuration = {
  modules: [
    NetworkModule,
    ClientModule.configure({
      // if you want to connect to another device in your local network, provide a different host
      remoteHost: undefined,
      port: 3001,
    }),
    ServerModule,
    RootModule,
    ChatModule,
    LoggerModule,
  ],
};

try {
  createContainer(config).get(ROOT);
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
}
