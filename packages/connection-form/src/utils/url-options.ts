import type { MongoClientOptions } from 'mongodb';

export interface UrlOption {
  name: keyof MongoClientOptions;
  value: string;
}

export const editableUrlOptions = [
  {
    title: 'Connection Timeout Options',
    titleKey: 'connections.form.advanced.urlOptionGroup.connectionTimeout',
    values: ['connectTimeoutMS', 'socketTimeoutMS'],
  },
  {
    title: 'Compression Options',
    titleKey: 'connections.form.advanced.urlOptionGroup.compression',
    values: ['compressors', 'zlibCompressionLevel'],
  },
  {
    title: 'Connection Pool Options',
    titleKey: 'connections.form.advanced.urlOptionGroup.connectionPool',
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
    titleKey: 'connections.form.advanced.urlOptionGroup.writeConcern',
    values: ['w', 'wtimeoutMS', 'journal'],
  },
  {
    title: 'Read Concern Options',
    titleKey: 'connections.form.advanced.urlOptionGroup.readConcern',
    values: ['readConcernLevel'],
  },
  {
    title: 'Server Options',
    titleKey: 'connections.form.advanced.urlOptionGroup.server',
    values: [
      'localThresholdMS',
      'serverSelectionTimeoutMS',
      'serverSelectionTryOnce',
      'heartbeatFrequencyMS',
    ],
  },
  {
    title: 'Miscellaneous Configuration',
    titleKey: 'connections.form.advanced.urlOptionGroup.miscellaneous',
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
