import { declareContainer } from '../../src/index';
import { LoggerModule } from '../shared/logger.module';
import { ROOT, RootModule } from './root.module';
import { ServerModule } from './server.module';
import { ClientModule } from './client.module';
import { ChatModule } from './chat.module';
import type { ContainerConfig } from '../../src/index';

// curl "localhost:3001/"
const config: ContainerConfig = {
  modules: [RootModule.forRoot({ port: 3001 }), ServerModule, ClientModule, ChatModule, LoggerModule],
  providers: [],
};
export const rootContainer = declareContainer(config);
rootContainer.get(ROOT);
