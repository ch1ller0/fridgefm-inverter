// eslint-disable-next-line import/no-extraneous-dependencies
import { declareContainer } from '../../index';
import { serverModule } from './server';
import { clientModule } from './client';
import { ROOT_TOKEN } from './tokens';

declareContainer({ providers: [...serverModule, ...clientModule] }).get(ROOT_TOKEN);
// curl --header "x-client-id: 1" "localhost:3000/"
