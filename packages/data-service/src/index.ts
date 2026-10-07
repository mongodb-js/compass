// Renderer-safe entry point. Nothing reachable from here may import the
// MongoDB driver at runtime -- the driver lives in the utility process and is
// reached over IPC. Driver-side exports live in `./utility` instead.
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
import { configuredKMSProviders } from './kms-providers';
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
export type {
  IndexDefinition,
  IndexBuildProgress,
} from './index-detail-helper';
export type {
  SearchIndex,
  SearchIndexStatus,
} from './search-index-detail-helper';
export type { InstanceDetails } from './instance-detail-helper';
export type {
  AnalyzeSchemaArgs,
} from './cursor/analyze-schema';
export type {
  ExportToFileArgs,
  ExportToFileResult,
} from './cursor/export-to-file';
export type {
  GatherFieldsArgs,
  GatherFieldsResult,
  SchemaPath,
} from './cursor/gather-fields';
export { createProjectionFromSchemaFields } from './cursor/gather-fields';
export type {
  AnalyzeCSVFieldsArgs,
  AnalyzeCSVFieldsResult,
  CSVDetectableFieldType,
  CSVField,
  CSVParsableFieldType,
  Delimiter,
  GetImportFileInfoArgs,
  GetImportFileInfoResult,
  GuessFileTypeArgs,
  GuessFileTypeResult,
  ImportError,
  ImportFromFileArgs,
  ImportFromFileResult,
  ImportProgress,
  Linebreak,
  ListCSVFieldsArgs,
  ListCSVFieldsResult,
} from './import/import-types';
export { DATA_SERVICE_PORT_CHANNEL } from './protocol';
export type {
  DataServiceBoot,
  DataServiceRequest,
  DataServiceResult,
  DeviceFlowInvocation,
  OperationName,
  RendererBoundMessage,
  UtilityBoundMessage,
} from './protocol';
