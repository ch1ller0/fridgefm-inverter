import { ContainerConfiguration, debugContainer, declareContainer } from '../../index';
import { ServerModule, ROOT_TOKEN } from './server.module';
import { ClientModule } from './client.module';
import { LoggerModule } from './logger.module';

// curl "localhost:3001/"
if (process.env.NODE_ENV !== 'test') {
  const config: ContainerConfiguration = {
    modules: [ServerModule.forRoot({ port: 3001 }), ClientModule, LoggerModule],
    providers: [],
  };
  if (process.env.INVERTER_DEBUG === 'true') {
    debugContainer(config).container.get(ROOT_TOKEN);
  } else {
    declareContainer(config).get(ROOT_TOKEN);
  }
}
