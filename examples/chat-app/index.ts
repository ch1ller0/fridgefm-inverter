import { createContainer } from '../../src/index';
import { LoggerModule } from '../shared/logger.module';
import { ROOT, RootModule } from './root.module';
import { ServerModule } from './server.module';
import { ClientModule } from './client.module';
import { ChatModule } from './chat.module';
import type { ContainerConfig } from '../../src/index';

const config: ContainerConfig = {
  modules: [
    RootModule.forRoot({ port: 3001 }),
    ClientModule.configure({ host: 'ws://127.0.0.1' }),
    ServerModule,
    ChatModule,
    LoggerModule,
  ],
  providers: [],
};
export const rootContainer = createContainer(config);
rootContainer.get(ROOT);
