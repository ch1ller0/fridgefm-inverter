import { declareContainer } from '../../index';
import { ServerModule, ROOT_TOKEN } from './server.module';
import { ClientModule } from './client.module';
import type { ContainerConfiguration } from '../../index';

export const config: ContainerConfiguration = { providers: [], modules: [ServerModule, ClientModule] };

// curl "localhost:3000/"
if (process.env.NODE_ENV !== 'test') {
  declareContainer(config).get(ROOT_TOKEN);
}
