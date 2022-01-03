import { MongoClientOptions } from "mongodb";

export interface UrlOption {
  key: keyof MongoClientOptions;
  value: string;
};

export const editableUrlOptions = [
  {
    title: 'Connection Timeout',
    values: ['connectiTimeoutMS', 'socketTimeoutMS'],
  },
  {
    title: 'Compression Options',
    values: ['compressors', 'zlibCompressionLevel'],
  },
  {
    title: 'Connection Pool Options',
    values: [
      'maxPoolSize',
      'minPoolSize',
      'maxIdleTimeMS',
      'waitQueueMultiple',
      'waitQueueTimeoutMS',
    ],
  },
  {
    title: 'Write Concern Options',
    values: ['w', 'wtimeoutMS', 'journal'],
  },
  {
    title: 'Read Concern Options',
    values: ['readConcernLevel'],
  },
  {
    title: 'Read Preferences Options',
    values: ['maxStalenessSeconds', 'readPreferenceTags'],
  },
  {
    title: 'Authentication Options',
    values: [
      // 'authSource',
      'authMechanismProperties',
      'gssapiServiceName',
    ],
  },
  {
    title: 'Server Options',
    values: [
      'localThresholdMS',
      'serverSelectionTimeoutMS',
      'serverSelectionTryOnce',
      'heartbeatFrequencyMS',
    ],
  },
  {
    title: 'Miscellaneous Configuration',
    values: ['appName', 'retryReads', 'retryWrites', 'uuidRepresentation'],
  },
];