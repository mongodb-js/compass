import React, { useState } from 'react';
import { css, cx, spacing } from '@mongodb-js/compass-components';
import type { DataService } from 'mongodb-data-service';
import type AppRegistry from 'hadron-app-registry';

import { QueryInput } from './query-input';
import { QueryResults } from './query-results';

const containerStyles = css({
  flexGrow: 1,
});

const paddedContainerStyles = css({
  padding: spacing[4],
})

type NLPQueryProps = {
  dataService: DataService;
  namespace: string;
  noPadding?: boolean;
  localAppRegistry: AppRegistry;
};

function NLPQuery({
  dataService,
  namespace,
  noPadding,
  localAppRegistry
}: NLPQueryProps): React.ReactElement {
  const [ queryText, setQueryText ] = useState('');

  return (
    <div className={cx(containerStyles, !noPadding && paddedContainerStyles)}>
      <QueryInput
        queryText={queryText}
        setQueryText={setQueryText}
      />
      <QueryResults
        dataService={dataService}
        localAppRegistry={localAppRegistry}
        namespace={namespace}
        queryText={queryText}
      />
    </div>
  );
}

export { NLPQuery };
