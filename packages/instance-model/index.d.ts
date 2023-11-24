import type Collection from 'mongodb-collection-model';
import type { DataService } from 'mongodb-data-service';
import type { Collection as DatabaseCollection } from 'mongodb-database-model';

import { ServerType } from './server-type';
import { TopologyType } from './topology-type';

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

interface Server {
  type: string;
  address: string;
}

interface TopologyDescription {
  type: string;
  servers: Server[];
  setName: string | null;
}

declare class MongoDBInstanceProps {
  _id: string;
  hostname: string;
  port: number;
  status: string;
  statusError: string | null;
  databasesStatus: string;
  databasesStatusError: string | null;
  refreshingStatus: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';
  refreshingStatusError: string | null;
  isAtlas: boolean;
  isLocalAtlas: boolean;
  atlasVersion: string;
  isRefreshing: boolean;
  isTopologyWritable: boolean;
  singleServerType: string | null;
  isServerWritable: boolean;
  isWritable: boolean;
  description: string;
  env: string;
  host: HostInfo;
  build: BuildInfo;
  genuineMongoDB: GenuineMongoDB;
  dataLake: DataLake;
  auth: AuthInfo;
  databases: DatabaseCollection;
  csfleMode: 'enabled' | 'disabled' | 'unavailable';
  topologyDescription: TopologyDescription;
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
  on(evt: string, fn: (...args: any) => void);
  removeListener(evt: string, fn: (...args: any) => void);
  toJSON(opts?: { derived?: boolean }): this;
}

export { MongoDBInstance, MongoDBInstanceProps, ServerType, TopologyType };
