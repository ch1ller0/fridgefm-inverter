import { ContainerConfiguration, debugContainer, declareContainer } from '@fridgefm/inverter';
import { RootModule, ROOT_TOKEN } from './calc-root.module';
import { OperationsModule } from './operations.module';

if (process.env.NODE_ENV !== 'test') {
  const config: ContainerConfiguration = {
    providers: [],
    modules: [RootModule.withBasicCommands(), OperationsModule],
  };
  if (process.env.INVERTER_DEBUG === 'true') {
    debugContainer(config).container.get(ROOT_TOKEN);
  } else {
    declareContainer(config).get(ROOT_TOKEN);
  }
}
