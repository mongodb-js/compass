import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import type { State as SearchIndexesState } from '../../../modules/search-indexes';
import {
  openIndexesListDrawerView,
  SearchIndexType,
} from '../../../modules/indexes-drawer';
import { Button } from '@mongodb-js/compass-components';

type CreateSearchIndexViewProps = {
  namespace: string;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  currentIndexType: SearchIndexType | null;
  onCancelClick: () => void;
};

const CreateSearchIndexView: React.FunctionComponent<
  CreateSearchIndexViewProps
> = ({ namespace, currentIndexType, onCancelClick }) => {
  return (
    <div>
      <div>
        Creating {currentIndexType} index for {namespace}
      </div>
      <Button variant="primary" onClick={onCancelClick}>
        Cancel
      </Button>
    </div>
  );
};

const mapState = ({ namespace, searchIndexes, indexesDrawer }: RootState) => ({
  namespace,
  searchIndexes,
  currentIndexType: indexesDrawer.currentIndexType,
});

const mapDispatch = {
  onCancelClick: openIndexesListDrawerView,
};

export default connect(mapState, mapDispatch)(CreateSearchIndexView);
