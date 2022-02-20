import { declareContainer } from '../../index';
import { RootModule, ROOT_TOKEN } from './calc-root.module';
import { OperationsModule } from './operations.module';

if (process.env.NODE_ENV !== 'test') {
  declareContainer({
    providers: [],
    modules: [RootModule, OperationsModule],
  }).get(ROOT_TOKEN);
}
