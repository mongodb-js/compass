import React from 'react';
import Aggregations from './components/aggregations';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import type { ConfigureStoreOptions } from './stores/store';

export const AggregationsPlugin: React.FunctionComponent<
  ConfigureStoreOptions
> = () => {
  const showExportButton = usePreference('enableImportExport');
  const showRunButton = usePreference('enableAggregationBuilderRunPipeline');
  const showExplainButton = usePreference('enableExplainPlan');

  return (
    <ConfirmationModalArea>
      <Aggregations
        showExportButton={showExportButton}
        showRunButton={showRunButton}
        showExplainButton={showExplainButton}
      />
    </ConfirmationModalArea>
  );
};
