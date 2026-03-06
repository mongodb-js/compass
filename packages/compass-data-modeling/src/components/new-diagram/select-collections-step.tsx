import { connect } from 'react-redux';
import { selectCollections } from '../../store/generate-diagram-wizard';
import type { DataModelingState } from '../../store/reducer';
import { SelectCollectionsList } from '../select-collections-list';

export default connect(
  (state: DataModelingState) => {
    const {
      formFields: { selectedCollections },
      databaseCollections,
    } = state.generateDiagramWizard;

    return {
      collections: databaseCollections ?? [],
      selectedCollections: selectedCollections.value ?? [],
      isFetchingCollections: Boolean(selectedCollections.isFetchingCollections),
      error: selectedCollections.error,
    };
  },
  {
    onCollectionsSelect: selectCollections,
  }
)(SelectCollectionsList);
