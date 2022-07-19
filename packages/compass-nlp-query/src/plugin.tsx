import React from 'react';
import { Banner, css, spacing } from '@mongodb-js/compass-components';
import type { DataService } from 'mongodb-data-service';
import type AppRegistry from 'hadron-app-registry';

import { NLPQuery } from './components/nlp-query';

const warningStyles = css({
  margin: spacing[3],
});

type NLPQueryPluginProps = {
  dataService: {
    dataService: DataService
  };
  namespace: string;
  noPadding?: boolean;
  localAppRegistry: AppRegistry;
};

function Plugin({
  dataService,
  namespace,
  noPadding,
  localAppRegistry,
}: NLPQueryPluginProps): React.ReactElement {
  const hasOpenAIKey = !!process.env.OPEN_AI_API_KEY;

  return hasOpenAIKey ? (
    <NLPQuery
      dataService={dataService.dataService}
      namespace={namespace}
      noPadding={noPadding}
      localAppRegistry={localAppRegistry}
    />
  ) : (
    <div>
      <Banner className={warningStyles} variant="warning">
        No `OPEN_AI_API_KEY` found in environment. Be sure to set it when
        running `npm start`.
      </Banner>
    </div>
  );
}

Plugin.displayName = 'Compass NLP Query Plugin';

export default Plugin;
