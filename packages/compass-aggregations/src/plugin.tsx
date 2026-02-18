import React from 'react';
import Aggregations from './components/aggregations';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import type { ConfigureStoreOptions } from './stores/store';

export const AggregationsPlugin: React.FunctionComponent<
  ConfigureStoreOptions
> = () => {
  const showRunButton = usePreference('enableAggregationBuilderRunPipeline');
  const showExplainButton = usePreference('enableExplainPlan');
  const enableSearchActivationProgramP1 = usePreference(
    'enableSearchActivationProgramP1'
  );
  const { atlasMetadata } = useConnectionInfo();

  return (
    <ConfirmationModalArea>
      <Aggregations
        showRunButton={showRunButton}
        showExplainButton={showExplainButton}
        enableSearchActivationProgramP1={enableSearchActivationProgramP1}
        atlasMetadata={atlasMetadata}
      />
    </ConfirmationModalArea>
  );
};
