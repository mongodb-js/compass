import React from 'react';
import { useActiveWorkspace } from '@mongodb-js/compass-workspaces/provider';

export type IndexesListPageProps = Record<string, never>;

const IndexesListPage: React.FunctionComponent<IndexesListPageProps> = () => {
  const activeWorkspace = useActiveWorkspace();
  const namespace =
    activeWorkspace?.type === 'Collection' ? activeWorkspace.namespace : '';

  return <div>IndexesListPage for {namespace}</div>;
};

export { IndexesListPage };
