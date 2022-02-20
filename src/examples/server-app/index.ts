import { declareContainer } from '../../index';
import { ServerModule, ROOT_TOKEN } from './server.module';
import { ClientModule } from './client.module';
import { LoggerModule } from './logger.module';

// curl "localhost:3000/"
if (process.env.NODE_ENV !== 'test') {
  declareContainer({
    providers: [],
    modules: [ServerModule, ClientModule, LoggerModule],
  }).get(ROOT_TOKEN);
}
