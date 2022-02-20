import { declareContainer } from '../../index';
import { ServerModule, ROOT_TOKEN } from './server.module';
import { ClientModule } from './client.module';

// curl "localhost:3000/"
if (process.env.NODE_ENV !== 'test') {
  declareContainer({
    providers: [],
    modules: [ServerModule, ClientModule],
  }).get(ROOT_TOKEN);
}
