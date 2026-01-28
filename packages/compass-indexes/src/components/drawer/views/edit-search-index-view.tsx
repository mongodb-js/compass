import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import type { State as SearchIndexesState } from '../../../modules/search-indexes';

type EditSearchIndexViewProps = {
  namespace: string;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  currentIndexName: string | null;
};

const EditSearchIndexView: React.FunctionComponent<
  EditSearchIndexViewProps
> = ({ namespace, currentIndexName }) => {
  return (
    <div>
      Editing {currentIndexName} index for {namespace}
    </div>
  );
};

const mapState = ({ namespace, searchIndexes, indexesDrawer }: RootState) => ({
  namespace,
  searchIndexes,
  currentIndexName: indexesDrawer.currentIndexName,
});

const mapDispatch = {};

export default connect(mapState, mapDispatch)(EditSearchIndexView);
