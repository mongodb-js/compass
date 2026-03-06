import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import type { State as SearchIndexesState } from '../../../modules/search-indexes';
import { openIndexesListDrawerView } from '../../../modules/indexes-drawer';
import { Button } from '@mongodb-js/compass-components';

type EditSearchIndexViewProps = {
  namespace: string;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  currentIndexName: string | null;
  onCancelClick: () => void;
};

const EditSearchIndexView: React.FunctionComponent<
  EditSearchIndexViewProps
> = ({ namespace, currentIndexName, onCancelClick }) => {
  return (
    <div>
      <div>
        Editing {currentIndexName} index for {namespace}
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
  currentIndexName: indexesDrawer.currentIndexName,
});

const mapDispatch = {
  onCancelClick: openIndexesListDrawerView,
};

export default connect(mapState, mapDispatch)(EditSearchIndexView);
