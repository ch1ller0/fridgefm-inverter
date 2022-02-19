import { declareContainer } from '../../index';
import { serverModule } from './server';
import { clientModule } from './client';
import { ROOT_TOKEN } from './tokens';

const providers = [...serverModule, ...clientModule];
// curl --header "x-client-id: 1" "localhost:3000/"

if (process.env.NODE_ENV !== 'test') {
  declareContainer({ providers }).get(ROOT_TOKEN);
}
