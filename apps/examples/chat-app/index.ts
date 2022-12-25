import { createContainer } from '../../src/index';
import { LoggerModule } from '../shared/logger.module';
import { NetworkModule } from '../shared/network.module';
import { RootModule } from './root.module';
import { ServerModule } from './server.module';
import { ClientModule } from './client.module';
import { ChatModule } from './chat.module';
import type { ContainerConfig } from '../../src/index';

const { ROOT } = RootModule.exports;
const config: ContainerConfig = {
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

export const rootContainer = createContainer(config);

rootContainer.get(ROOT).catch((e) => {
  console.error(e);
  process.exit(1);
});
