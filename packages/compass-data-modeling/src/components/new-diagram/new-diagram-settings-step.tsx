import { connect } from 'react-redux';
import {
  toggleInferRelationships,
  changeSamplingOptions,
} from '../../store/generate-diagram-wizard';
import type { DataModelingState } from '../../store/reducer';
import { DiagramSettingsContent } from '../diagram-settings-content';

export default connect(
  (state: DataModelingState) => {
    const {
      formFields: { selectedCollections, samplingOptions },
      automaticallyInferRelations,
    } = state.generateDiagramWizard;

    return {
      automaticallyInferRelationships: automaticallyInferRelations,
      samplingOptions: samplingOptions.value,
      error: selectedCollections.error,
    };
  },
  {
    onAutomaticallyInferRelationshipsToggle: toggleInferRelationships,
    onSamplingOptionsChange: changeSamplingOptions,
  }
)(DiagramSettingsContent);
