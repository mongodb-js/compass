import React from 'react';
import Aggregations from './components/aggregations';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import type { ConfigureStoreOptions } from './stores/store';
import { RerankBannerDismissProvider } from './components/rerank-first-stage-banner';

export const AggregationsPlugin: React.FunctionComponent<
  ConfigureStoreOptions
> = () => {
  const showRunButton = usePreference('enableAggregationBuilderRunPipeline');
  const showExplainButton = usePreference('enableExplainPlan');

  return (
    <ConfirmationModalArea>
      <RerankBannerDismissProvider>
        <Aggregations
          showRunButton={showRunButton}
          showExplainButton={showExplainButton}
        />
      </RerankBannerDismissProvider>
    </ConfirmationModalArea>
  );
};
