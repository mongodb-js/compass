import {
  Button,
  ButtonSize,
  Icon,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { useTranslation } from 'react-i18next';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import React from 'react';
import { usePreferences } from 'compass-preferences-model/provider';
import toNS from 'mongodb-ns';
import { wrapField } from '@mongodb-js/mongodb-constants';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import {
  buildChartsUrl,
  buildMonitoringUrl,
} from '@mongodb-js/atlas-service/provider';

const collectionHeaderActionsStyles = css({
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
  gap: spacing[200],
});

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
  const { t } = useTranslation('compassCollection');
  const connectionInfo = useConnectionInfo();
  const { id: connectionId, atlasMetadata } = connectionInfo;
  const { openCollectionWorkspace, openEditViewWorkspace, openShellWorkspace } =
    useOpenWorkspace();
  const { readWrite: preferencesReadWrite, enableShell: showOpenShellButton } =
    usePreferences(['readWrite', 'enableShell']);
  const track = useTelemetry();

  const { database, collection } = toNS(namespace);

  const isView = isReadonly && sourceName && !editViewName;

  const showViewEdit = isView && !preferencesReadWrite;

  return (
    <div
      className={collectionHeaderActionsStyles}
      data-testid="collection-header-actions"
    >
      {showOpenShellButton && (
        <Button
          size="small"
          data-testid="collection-header-open-shell-button"
          onClick={() => {
            openShellWorkspace(connectionId, {
              initialEvaluate: `use ${database}`,
              initialInput: `db[${wrapField(collection, true)}].find()`,
            });
            track('Open Shell', { entrypoint: 'collection' }, connectionInfo);
          }}
          leftGlyph={<Icon glyph="Shell"></Icon>}
        >
          {t('openShellButton')}
        </Button>
      )}

      {atlasMetadata && (
        <Button
          data-testid="collection-header-view-monitoring"
          size={ButtonSize.Small}
          href={buildMonitoringUrl(atlasMetadata)}
          target="_blank"
          rel="noopener noreferrer"
          leftGlyph={<Icon glyph="TimeSeries" />}
        >
          {t('viewMonitoringButton')}
        </Button>
      )}
      {atlasMetadata && (
        <Button
          data-testid="collection-header-visualize-your-data"
          size={ButtonSize.Small}
          href={buildChartsUrl(atlasMetadata, namespace)}
          target="_self"
          rel="noopener noreferrer"
          leftGlyph={<Icon glyph="Charts" />}
        >
          {t('visualizeDataButton')}
        </Button>
      )}
      {showViewEdit && (
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
          {t('editPipelineButton')}
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
          {t('returnToViewButton')}
        </Button>
      )}
    </div>
  );
};

export default CollectionHeaderActions;
