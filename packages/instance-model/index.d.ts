import type Collection from 'mongodb-collection-model';
import type { DataService } from 'mongodb-data-service';
import type { Collection as DatabaseCollection } from 'mongodb-database-model';

interface AuthInfo {
  user: unknown | null;
  roles: unknown[] | null;
  privileges: unknown[] | null;
}

interface HostInfo {
  arch: string;
  cpu_cores: number;
  cpu_frequency: number;
  memory_bits: number;
  os: string;
  os_family: string;
  kernel_version: string;
  kernel_version_string: string;
}

interface BuildInfo {
  isEnterprise: boolean;
  version: string;
}

interface GenuineMongoDB {
  isGenuine: boolean;
  dbType: string;
}

interface DataLake {
  isDataLake: boolean;
  version: string;
}

declare class MongoDBInstanceProps {
  _id: string;
  hostname: string;
  port: string;
  status: string;
  statusError: string | null;
  databasesStatus: string;
  databasesStatusError: string | null;
  refreshingStatus: string;
  refreshingStatusError: string | null;
  isAtlas: boolean;
  isRefreshing: boolean;
  host: HostInfo;
  build: BuildInfo;
  genuineMongoDB: GenuineMongoDB;
  dataLake: DataLake;
  auth: AuthInfo;
  databases: DatabaseCollection;
}

declare class MongoDBInstanceConstructor extends MongoDBInstanceProps {
  constructor(props: MongoDBInstanceProps);
}

export default MongoDBInstanceConstructor;
export { MongoDBInstanceProps };
