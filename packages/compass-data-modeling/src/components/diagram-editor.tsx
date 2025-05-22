import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import {
  applyEdit,
  getCurrentDiagramFromState,
  selectCurrentModel,
} from '../store/diagram';
import {
  css,
  spacing,
  Button,
  palette,
  ErrorSummary,
} from '@mongodb-js/compass-components';
import { cancelAnalysis, retryAnalysis } from '../store/analysis-process';
import type { Edit, StaticModel } from '../services/data-model-storage';
import { UUID } from 'bson';

const modelPreviewContainerStyles = css({
  display: 'grid',
  gridTemplateColumns: '100%',
  gridTemplateRows: '1fr auto',
  gap: 2,
  height: '100%',
  padding: spacing[400],
  paddingTop: 0,
});

const modelPreviewStyles = css({
  minHeight: 0,
});

const editorContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  boxShadow: `0 0 0 2px ${palette.gray.light2}`,
  padding: spacing[200],
});

const editorContainerApplyContainerStyles = css({
  justifyContent: 'flex-end',
  display: 'flex',
  gap: spacing[200],
  alignItems: 'center',
});

const editorContainerPlaceholderButtonStyles = css({
  alignSelf: 'flex-start',
  display: 'flex',
  gap: spacing[200],
});

const DiagramEditor: React.FunctionComponent<{
  model: StaticModel | null;
  editErrors?: string[];
  onApplyClick: (edit: Omit<Edit, 'id' | 'timestamp'>) => void;
}> = ({ model, editErrors, onApplyClick }) => {
  const [applyInput, setApplyInput] = useState('{}');
  const isEditValid = useMemo(() => {
    try {
      JSON.parse(applyInput);
      return true;
    } catch {
      return false;
    }
  }, [applyInput]);

  const applyPlaceholder =
    (type: 'AddRelationship' | 'RemoveRelationship') => () => {
      let placeholder = {};
      switch (type) {
        case 'AddRelationship':
          placeholder = {
            type: 'AddRelationship',
            relationship: {
              id: new UUID().toString(),
              relationship: [
                {
                  ns: 'db.sourceCollection',
                  cardinality: 1,
                  fields: ['field1'],
                },
                {
                  ns: 'db.targetCollection',
                  cardinality: 1,
                  fields: ['field2'],
                },
              ],
              isInferred: false,
            },
          };
          break;
        case 'RemoveRelationship':
          placeholder = {
            type: 'RemoveRelationship',
            relationshipId: new UUID().toString(),
          };
          break;
        default:
          throw new Error(`Unknown placeholder ${placeholder}`);
      }
      setApplyInput(JSON.stringify(placeholder, null, 2));
    };

  const modelStr = useMemo(() => {
    return JSON.stringify(model, null, 2);
  }, [model]);

  return (
    <div
      className={modelPreviewContainerStyles}
      data-testid="diagram-editor-container"
    >
      <div className={modelPreviewStyles} data-testid="model-preview">
        <CodemirrorMultilineEditor
          language="json"
          text={modelStr}
          readOnly
          initialJSONFoldAll={false}
        ></CodemirrorMultilineEditor>
      </div>
      <div className={editorContainerStyles} data-testid="apply-editor">
        <div className={editorContainerPlaceholderButtonStyles}>
          <Button
            onClick={applyPlaceholder('AddRelationship')}
            data-testid="placeholder-addrelationship-button"
          >
            Add relationship
          </Button>
          <Button
            onClick={applyPlaceholder('RemoveRelationship')}
            data-testid="placeholder-removerelationship-button"
          >
            Remove relationship
          </Button>
        </div>
        <div>
          <CodemirrorMultilineEditor
            language="json"
            text={applyInput}
            onChangeText={setApplyInput}
            maxLines={10}
          ></CodemirrorMultilineEditor>
        </div>
        <div className={editorContainerApplyContainerStyles}>
          {editErrors && <ErrorSummary errors={editErrors} />}
          <Button
            onClick={() => {
              onApplyClick(JSON.parse(applyInput));
            }}
            data-testid="apply-button"
            disabled={!isEditValid}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

export default connect(
  (state: DataModelingState) => {
    const { diagram, step } = state;
    if (step !== 'EDITING') {
      throw new Error('Unexpected step when rendering diagram editor');
    }
    return {
      model: diagram
        ? selectCurrentModel(getCurrentDiagramFromState(state))
        : null,
      editErrors: diagram?.editErrors,
    };
  },
  {
    onRetryClick: retryAnalysis,
    onCancelClick: cancelAnalysis,
    onApplyClick: applyEdit,
  }
)(DiagramEditor);
