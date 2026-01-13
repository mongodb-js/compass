import { useIndexesDrawerContext } from '../compass-indexes-provider';
import React from 'react';

export type IndexesListPageProps = {};

const IndexesListPage: React.FunctionComponent<IndexesListPageProps> = ({}) => {
  const indexesDrawerContext = useIndexesDrawerContext();

  return (
    <div>
      IndexesListPage for{' '}
      {indexesDrawerContext?.activeCollectionMetadata?.namespace}
    </div>
  );
};

export { IndexesListPage };
