import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import { State as SearchIndexesState } from '../../../modules/search-indexes';
import { State as IndexesDrawerState } from '../../../modules/indexes-drawer';

type CreateSearchIndexViewProps = {
  namespace: string;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  indexesDrawer: IndexesDrawerState;
};

const CreateSearchIndexView: React.FunctionComponent<
  CreateSearchIndexViewProps
> = ({ namespace, searchIndexes, indexesDrawer }) => {
  return (
    <div>
      Creating {indexesDrawer.currentIndexType} index for {namespace}
    </div>
  );
};

const mapState = ({ namespace, searchIndexes, indexesDrawer }: RootState) => ({
  namespace,
  searchIndexes,
  indexesDrawer,
});

const mapDispatch = {};

export default connect(mapState, mapDispatch)(CreateSearchIndexView);
