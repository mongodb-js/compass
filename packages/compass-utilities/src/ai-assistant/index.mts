import { currentParentPort } from '../ipc.mts';
import { main } from './main.mts';

const parentPort = currentParentPort();
if (parentPort) {
  main(parentPort);
}
