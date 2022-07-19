import React from 'react';
import { Banner, css, spacing } from '@mongodb-js/compass-components';
import type { DataService } from 'mongodb-data-service';

import { NLPQuery } from './components/nlp-query';

const warningStyles = css({
  margin: spacing[3]
});

type NLPQueryPluginProps = {
  dataService: DataService;
  namespace: string;
};

function Plugin({
  dataService,
  namespace
}: NLPQueryPluginProps): React.ReactElement {
  const hasOpenAIKey = !!process.env.OPEN_AI_API_KEY;

  return hasOpenAIKey ? (
    <NLPQuery
      dataService={dataService}
      namespace={namespace}
    />
  ) : (
    <div>
      <Banner className={warningStyles} variant="warning">
        No `OPEN_AI_API_KEY` found in environment. Be sure to set it when running `npm start`.
      </Banner>
    </div>
  );
}

Plugin.displayName = 'HomePlugin';

export default Plugin;
