import { createContainer } from '@fridgefm/inverter';
import { RootModule } from './calc-root.module';
import { OperationsModule } from './operations.module';
import type { ContainerConfig } from '@fridgefm/inverter';

const config: ContainerConfig = {
  providers: [],
  modules: [RootModule.withBasicCommands(), OperationsModule],
};
createContainer(config).get(RootModule.exports.ROOT);
