import { declareContainer } from '../../src/index';
import { RootModule, ROOT } from './calc-root.module';
import { OperationsModule } from './operations.module';
import type { ContainerConfig } from '../../src/index';

const config: ContainerConfig = {
  providers: [],
  modules: [RootModule.withBasicCommands(), OperationsModule],
};
declareContainer(config).get(ROOT);
