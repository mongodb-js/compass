import React from 'react';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';
import { usePreference } from '@mongodb-js/compass-preferences-model/provider';
import Aggregations from './components/aggregations';
import type { ConfigureStoreOptions } from './stores/store';

export const AggregationsPlugin: React.FunctionComponent<
  ConfigureStoreOptions
> = () => {
  const showRunButton = usePreference('enableAggregationBuilderRunPipeline');
  const showExplainButton = usePreference('enableExplainPlan');

  return (
    <ConfirmationModalArea>
      <Aggregations
        showRunButton={showRunButton}
        showExplainButton={showExplainButton}
      />
    </ConfirmationModalArea>
  );
};
