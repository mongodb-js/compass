import { connect } from 'react-redux';
import {
  selectCollections,
  toggleInferRelationships,
} from '../../store/generate-diagram-wizard';
import type { DataModelingState } from '../../store/reducer';
import { SelectCollections } from './select-collection';

export default connect(
  (state: DataModelingState) => {
    const {
      formFields: { selectedCollections },
      databaseCollections,
      automaticallyInferRelations,
    } = state.generateDiagramWizard;

    return {
      collections: databaseCollections ?? [],
      selectedCollections: selectedCollections.value ?? [],
      automaticallyInferRelationships: automaticallyInferRelations,
      isFetchingCollections: Boolean(selectedCollections.isFetchingCollections),
      error: selectedCollections.error,
    };
  },
  {
    onCollectionsSelect: selectCollections,
    onAutomaticallyInferRelationshipsToggle: toggleInferRelationships,
  }
)(SelectCollections);
