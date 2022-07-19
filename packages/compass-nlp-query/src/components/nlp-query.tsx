import React, { useState } from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import type { DataService } from 'mongodb-data-service';

import { QueryInput } from './query-input';
import { QueryResults } from './query-results';

const containerStyles = css({
  padding: spacing[3]
});

type NLPQueryProps = {
  dataService: DataService;
  namespace: string;
};

function NLPQuery({
  dataService,
  namespace
}: NLPQueryProps): React.ReactElement {
  const [ queryText, setQueryText ] = useState('');

  return (
    <div className={containerStyles}>
      <QueryInput
        queryText={queryText}
        setQueryText={setQueryText}
      />
      <QueryResults
        dataService={dataService}
        namespace={namespace}
        queryText={queryText}
      />
    </div>
  );
}

export { NLPQuery };
