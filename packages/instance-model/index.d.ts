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
  isCSFLEConnection: boolean;
}

declare class MongoDBInstance extends MongoDBInstanceProps {
  constructor(props: MongoDBInstanceProps);
  fetch(opts: { dataService: DataService; force?: boolean }): Promise<void>;
  fetchDatabases(opts: {
    dataService: DataService;
    force?: boolean;
  }): Promise<void>;
  refresh(opts: {
    dataService: DataService;
    fetchDatabases?: boolean;
    fetchDbStats?: boolean;
    fetchCollections?: boolean;
    fetchCollInfo?: boolean;
    fetchCollStats?: boolean;
  }): Promise<void>;
  getNamespace(opts: {
    dataService: DataService;
    database: string;
    collection: string;
  }): Promise<Collection | null>;
  removeAllListeners(): void;
  toJSON(opts?: { derived?: boolean }): this;
}

export default MongoDBInstance;
export { MongoDBInstanceProps };
