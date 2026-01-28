import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import type { State as SearchIndexesState } from '../../../modules/search-indexes';
import type { SearchIndexType } from '../../../modules/indexes-drawer';

type CreateSearchIndexViewProps = {
  namespace: string;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  currentIndexType: SearchIndexType | null;
};

const CreateSearchIndexView: React.FunctionComponent<
  CreateSearchIndexViewProps
> = ({ namespace, currentIndexType }) => {
  return (
    <div>
      Creating {currentIndexType} index for {namespace}
    </div>
  );
};

const mapState = ({ namespace, searchIndexes, indexesDrawer }: RootState) => ({
  namespace,
  searchIndexes,
  currentIndexType: indexesDrawer.currentIndexType,
});

const mapDispatch = {};

export default connect(mapState, mapDispatch)(CreateSearchIndexView);
