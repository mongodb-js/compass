import util from 'util';
import { ConnectionOptions } from './connection-options';
import DataService from './data-service';
import { convertConnectionOptionsToModel } from './legacy-connection-model';

export default async function connect(
  connectionOptions: ConnectionOptions
): Promise<DataService> {
  const model = await convertConnectionOptionsToModel(connectionOptions);

  const dataService = new DataService(connectionOptions, model);
  await util.promisify(dataService.connect.bind(dataService))();

  return dataService;
}
