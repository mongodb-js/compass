import type { MongoClientOptions } from 'mongodb';

export interface UrlOption {
  name: keyof MongoClientOptions;
  value: string;
}

export const editableUrlOptions = [
  {
    title: 'Connection Timeout Options',
    values: ['connectTimeoutMS', 'socketTimeoutMS'],
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
    values: [
      'appName',
      'retryReads',
      'retryWrites',
      'srvMaxHosts',
      'uuidRepresentation',
      'enableUtf8Validation',
    ],
  },
];
