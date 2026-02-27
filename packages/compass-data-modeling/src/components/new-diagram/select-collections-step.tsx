import { connect } from 'react-redux';
import {
  selectCollections,
  toggleInferRelationships,
  changeSamplingOptions,
} from '../../store/generate-diagram-wizard';
import type { DataModelingState } from '../../store/reducer';
import { SelectCollectionsList } from '../select-collections-list';

export default connect(
  (state: DataModelingState) => {
    const {
      formFields: { selectedCollections },
      databaseCollections,
      automaticallyInferRelations,
      samplingOptions,
    } = state.generateDiagramWizard;

    return {
      collections: databaseCollections ?? [],
      selectedCollections: selectedCollections.value ?? [],
      automaticallyInferRelationships: automaticallyInferRelations,
      samplingOptions,
      isFetchingCollections: Boolean(selectedCollections.isFetchingCollections),
      error: selectedCollections.error,
    };
  },
  {
    onCollectionsSelect: selectCollections,
    onAutomaticallyInferRelationshipsToggle: toggleInferRelationships,
    onSamplingOptionsChange: changeSamplingOptions,
  }
)(SelectCollectionsList);
