import connect from './connect';
import type {
  ConnectionOptions,
  ConnectionSshOptions,
} from './connection-options';
import type {
  DataService,
  UpdatePreview,
  UpdatePreviewChange,
} from './data-service';
import { configuredKMSProviders } from './instance-detail-helper';
import { createConnectionAttempt } from './connection-attempt';
import type { ConnectionAttempt } from './connection-attempt';

export type {
  ConnectionAttempt,
  ConnectionOptions,
  ConnectionSshOptions,
  DataService,
  UpdatePreview,
  UpdatePreviewChange,
};
export { connect, configuredKMSProviders, createConnectionAttempt };

export type { ReauthenticationHandler } from './connect-mongo-client';
export type { ExplainExecuteOptions } from './data-service';
export type { IndexDefinition } from './index-detail-helper';
export type {
  SearchIndex,
  SearchIndexStatus,
} from './search-index-detail-helper';
export type { InstanceDetails } from './instance-detail-helper';
