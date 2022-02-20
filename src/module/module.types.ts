import type { InjectableDeclaration } from './provider.types';

export type ModuleConfig = {
  name: string;
  providers: InjectableDeclaration[];
  imports?: ModuleDeclaration[];
};

export type ModuleDeclaration = ModuleConfig & {
  symbol: symbol;
  /**
   * Module creation is available only via "declareModule" function
   * @example
   * import { declareModule } from '@fridgefm/inverter';
   * import { anotherAwesomeModule } from '../modules':
   * const myAwesomeModule = declareModule({
   *   name: 'my-awesome-module',
   *   providers: [provider1, provider2],
   *   imports: [anotherAwesomeModule],
   * });
   */
  _brand: 'declareModule';
};
