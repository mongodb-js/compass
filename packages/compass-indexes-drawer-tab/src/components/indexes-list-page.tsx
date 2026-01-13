import React from 'react';
import { useIndexesDrawerGlobalState } from '../indexes-drawer-global-state';

export type IndexesListPageProps = Record<string, never>;

const IndexesListPage: React.FunctionComponent<IndexesListPageProps> = () => {
  const indexesDrawerGlobalState = useIndexesDrawerGlobalState();

  return (
    <div>
      IndexesListPage for{' '}
      {indexesDrawerGlobalState?.activeCollectionMetadata?.namespace}
    </div>
  );
};

export { IndexesListPage };
