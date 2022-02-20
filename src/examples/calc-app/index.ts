import { declareContainer } from '../../index';
import { RootModule, ROOT_TOKEN } from './calc-root.module';
import { OperationsModule } from './operations.module';
import type { ContainerConfiguration } from '../../index';

export const config: ContainerConfiguration = { providers: [], modules: [RootModule, OperationsModule] };

if (process.env.NODE_ENV !== 'test') {
  declareContainer(config).get(ROOT_TOKEN);
}
