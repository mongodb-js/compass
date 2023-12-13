import React from 'react';
import Aggregations from './components/aggregations';
import { ConfirmationModalArea, css } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';

const containerStyles = css({
  display: 'flex',
  flex: 1,
  minHeight: 0,
});

export function AggregationsPlugin({
  isActive,
}: Pick<CollectionTabPluginMetadata, 'isActive'>) {
  const showExportButton = usePreference('enableImportExport', React);
  const showRunButton = usePreference(
    'enableAggregationBuilderRunPipeline',
    React
  );
  const showExplainButton = usePreference('enableExplainPlan', React);

  if (!isActive) {
    return null;
  }

  return (
    <ConfirmationModalArea>
      <div className={containerStyles} data-testid="aggregations-content">
        <Aggregations
          showExportButton={showExportButton}
          showRunButton={showRunButton}
          showExplainButton={showExplainButton}
        />
      </div>
    </ConfirmationModalArea>
  );
}
