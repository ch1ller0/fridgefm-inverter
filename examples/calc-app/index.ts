import { declareContainer } from '../../src/new-nest-style/index';
import { RootModule, ROOT_TOKEN } from './calc-root.module';
import { OperationsModule } from './operations.module';
import type { ContainerConfig } from '../../src/new-nest-style/index';

if (process.env.NODE_ENV !== 'test') {
  const config: ContainerConfig = {
    providers: [],
    modules: [RootModule.withBasicCommands(), OperationsModule],
  };
  declareContainer(config).get(ROOT_TOKEN);
}
