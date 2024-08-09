import {
  Button,
  ButtonSize,
  Icon,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import React from 'react';
import { usePreferences } from 'compass-preferences-model/provider';
import toNS from 'mongodb-ns';
import { wrapField } from '@mongodb-js/mongodb-constants';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

const collectionHeaderActionsStyles = css({
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
  gap: spacing[2],
});

function buildChartsUrl(
  groupId: string,
  clusterName: string,
  namespace: string
) {
  const { database, collection } = toNS(namespace);
  const url = new URL(`/charts/${groupId}`, window.location.origin);
  url.searchParams.set('sourceType', 'cluster');
  url.searchParams.set('instanceName', clusterName);
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
};

const CollectionHeaderActions: React.FunctionComponent<
  CollectionHeaderActionsProps
> = ({
  namespace,
  isReadonly,
  editViewName,
  sourceName,
  sourcePipeline,
}: CollectionHeaderActionsProps) => {
  const connectionInfo = useConnectionInfo();
  const { id: connectionId, atlasMetadata } = connectionInfo;
  const { openCollectionWorkspace, openEditViewWorkspace, openShellWorkspace } =
    useOpenWorkspace();
  const {
    readOnly: preferencesReadOnly,
    enableShell,
    enableNewMultipleConnectionSystem,
  } = usePreferences([
    'readOnly',
    'enableShell',
    'enableNewMultipleConnectionSystem',
  ]);
  const track = useTelemetry();

  const { database, collection } = toNS(namespace);

  const showOpenShellButton = enableShell && enableNewMultipleConnectionSystem;

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
            track('Shell Show', { entrypoint: 'collection' }, connectionInfo);
          }}
          leftGlyph={<Icon glyph="Shell"></Icon>}
        >
          Open MongoDB shell
        </Button>
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
