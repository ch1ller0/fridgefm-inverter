import { createContainer } from '../../src/index';
import { RootModule } from './calc-root.module';
import { OperationsModule } from './operations.module';
import type { ContainerConfig } from '../../src/index';

const config: ContainerConfig = {
  providers: [],
  modules: [RootModule.withBasicCommands(), OperationsModule],
};
createContainer(config).get(RootModule.exports.ROOT);
