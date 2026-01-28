import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import { State as SearchIndexesState } from '../../../modules/search-indexes';
import { State as IndexesDrawerState } from '../../../modules/indexes-drawer';

type EditSearchIndexViewProps = {
  namespace: string;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  indexesDrawer: IndexesDrawerState;
};

const EditSearchIndexView: React.FunctionComponent<
  EditSearchIndexViewProps
> = ({ namespace, searchIndexes, indexesDrawer }) => {
  return (
    <div>
      Editing {indexesDrawer.currentIndexName} index for {namespace}
    </div>
  );
};

const mapState = ({ namespace, searchIndexes, indexesDrawer }: RootState) => ({
  namespace,
  searchIndexes,
  indexesDrawer,
});

const mapDispatch = {};

export default connect(mapState, mapDispatch)(EditSearchIndexView);
