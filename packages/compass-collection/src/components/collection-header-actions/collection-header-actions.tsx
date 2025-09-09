import {
  Button,
  ButtonSize,
  Icon,
  css,
  spacing,
  Tooltip,
} from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import React from 'react';
import { usePreferences } from 'compass-preferences-model/provider';
import toNS from 'mongodb-ns';
import { wrapField } from '@mongodb-js/mongodb-constants';
import {
  useTelemetry,
  useAssignment,
  ExperimentTestName,
  ExperimentTestGroup,
} from '@mongodb-js/compass-telemetry/provider';
import {
  SCHEMA_ANALYSIS_STATE_ANALYZING,
  type SchemaAnalysisStatus,
} from '../../schema-analysis-types';

/**
 * Maximum allowed nesting depth for collections to show Mock Data Generator
 */
const MAX_COLLECTION_NESTING_DEPTH = 3;

const collectionHeaderActionsStyles = css({
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
  gap: spacing[200],
});

function buildChartsUrl(
  groupId: string,
  clusterName: string,
  namespace: string
) {
  const { database, collection } = toNS(namespace);
  const url = new URL(`/charts/${groupId}`, window.location.origin);
  url.searchParams.set('sourceType', 'cluster');
  url.searchParams.set('name', clusterName);
  url.searchParams.set('database', database);
  url.searchParams.set('collection', collection);
  return url.toString();
}

type CollectionHeaderActionsProps = {
  namespace: string;
  isReadonly: boolean;
  editViewName?: string;
  sourceName?: string;
  sourcePipeline?: unknown[];
  onOpenMockDataModal: () => void;
  hasSchemaAnalysisData: boolean;
  analyzedSchemaDepth: number;
  schemaAnalysisStatus: SchemaAnalysisStatus | null;
};

const CollectionHeaderActions: React.FunctionComponent<
  CollectionHeaderActionsProps
> = ({
  namespace,
  isReadonly,
  editViewName,
  sourceName,
  sourcePipeline,
  onOpenMockDataModal,
  hasSchemaAnalysisData,
  analyzedSchemaDepth,
  schemaAnalysisStatus,
}: CollectionHeaderActionsProps) => {
  const connectionInfo = useConnectionInfo();
  const { id: connectionId, atlasMetadata } = connectionInfo;
  const { openCollectionWorkspace, openEditViewWorkspace, openShellWorkspace } =
    useOpenWorkspace();
  const { readOnly: preferencesReadOnly, enableShell: showOpenShellButton } =
    usePreferences(['readOnly', 'enableShell']);
  const track = useTelemetry();

  // Get experiment assignment for Mock Data Generator
  const mockDataGeneratorAssignment = useAssignment(
    ExperimentTestName.mockDataGenerator,
    true // trackIsInSample - this will fire the "Experiment Viewed" event
  );

  const { database, collection } = toNS(namespace);

  // Check if user is in treatment group for Mock Data Generator experiment
  const isInMockDataTreatmentVariant =
    mockDataGeneratorAssignment?.assignment?.assignmentData?.variant ===
    ExperimentTestGroup.mockDataGeneratorVariant;

  const shouldShowMockDataButton =
    isInMockDataTreatmentVariant &&
    atlasMetadata && // Only show in Atlas
    !isReadonly && // Don't show for readonly collections (views)
    !sourceName; // sourceName indicates it's a view

  const exceedsMaxNestingDepth =
    analyzedSchemaDepth > MAX_COLLECTION_NESTING_DEPTH;

  const isCollectionEmpty =
    !hasSchemaAnalysisData &&
    schemaAnalysisStatus !== SCHEMA_ANALYSIS_STATE_ANALYZING;

  return (
    <div
      className={collectionHeaderActionsStyles}
      data-testid="collection-header-actions"
    >
      {showOpenShellButton && (
        <Button
          size="small"
          onClick={() => {
            openShellWorkspace(connectionId, {
              initialEvaluate: `use ${database}`,
              initialInput: `db[${wrapField(collection, true)}].find()`,
            });
            track('Open Shell', { entrypoint: 'collection' }, connectionInfo);
          }}
          leftGlyph={<Icon glyph="Shell"></Icon>}
        >
          Open MongoDB shell
        </Button>
      )}
      {shouldShowMockDataButton && (
        <Tooltip
          enabled={exceedsMaxNestingDepth || isCollectionEmpty}
          trigger={
            <div>
              <Button
                data-testid="collection-header-generate-mock-data-button"
                size={ButtonSize.Small}
                disabled={!hasSchemaAnalysisData || exceedsMaxNestingDepth}
                onClick={onOpenMockDataModal}
                leftGlyph={<Icon glyph="Sparkle" />}
              >
                Generate Mock Data
              </Button>
            </div>
          }
        >
          {/* todo within (CLOUDP-333853): update disabled open-modal button
          tooltip to communicate if schema analysis is incomplete */}
          {exceedsMaxNestingDepth &&
            'At this time we are unable to generate mock data for collections that have deeply nested documents'}
          {isCollectionEmpty &&
            'Please add data to your collection to generate similar mock documents'}
        </Tooltip>
      )}
      {atlasMetadata && (
        <Button
          data-testid="collection-header-visualize-your-data"
          size={ButtonSize.Small}
          href={buildChartsUrl(
            atlasMetadata.projectId,
            atlasMetadata.clusterName,
            namespace
          )}
          target="_self"
          rel="noopener noreferrer"
          leftGlyph={<Icon glyph="Charts" />}
        >
          Visualize Your Data
        </Button>
      )}
      {isReadonly && sourceName && !editViewName && !preferencesReadOnly && (
        <Button
          data-testid="collection-header-actions-edit-button"
          size={ButtonSize.Small}
          onClick={() => {
            if (sourceName && sourcePipeline) {
              openEditViewWorkspace(connectionId, namespace, {
                sourceName,
                sourcePipeline,
              });
            }
          }}
        >
          <Icon glyph="Edit" />
          Edit Pipeline
        </Button>
      )}
      {editViewName && (
        <Button
          data-testid="collection-header-actions-return-to-view-button"
          size={ButtonSize.Small}
          onClick={() => {
            if (editViewName) {
              openCollectionWorkspace(connectionId, editViewName);
            }
          }}
        >
          <Icon glyph="ArrowLeft" />
          Return to View
        </Button>
      )}
    </div>
  );
};

export default CollectionHeaderActions;
