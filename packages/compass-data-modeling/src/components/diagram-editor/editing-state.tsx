import React, { useContext, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../../store/reducer';
import {
  applyEdit,
  getCurrentDiagramFromState,
  selectCurrentModel,
} from '../../store/diagram';
import {
  css,
  spacing,
  Button,
  palette,
  ErrorSummary,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import { Diagram, useDiagram } from '@mongodb-js/diagramming';
import type { Edit, StaticModel } from '../../services/data-model-storage';
import { UUID } from 'bson';
import { ExportDiagramContext } from '../export-diagram-context';
import { mapCollectionToNodeProps, mapRelationshipToEdgeProps } from './utils';

const modelPreviewContainerStyles = css({
  display: 'grid',
  gridTemplateColumns: '100%',
  gridTemplateRows: '1fr auto',
  gap: 2,
  height: '100%',
});

const modelPreviewStyles = css({
  minHeight: 0,
});

const editorContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  boxShadow: `0 0 0 2px ${palette.gray.light2}`,
});

const editorContainerApplyContainerStyles = css({
  padding: spacing[200],
  justifyContent: 'flex-end',
  gap: spacing[200],
  display: 'flex',
  width: '100%',
  alignItems: 'center',
});

const editorContainerPlaceholderButtonStyles = css({
  paddingLeft: 8,
  paddingRight: 8,
  alignSelf: 'flex-start',
  display: 'flex',
  gap: spacing[200],
  paddingTop: spacing[200],
});

const DiagramEditingState: React.FunctionComponent<{
  diagramLabel: string;
  model: StaticModel | null;
  editErrors?: string[];
  isExportModalOpen: boolean;
  onApplyClick: (edit: Omit<Edit, 'id' | 'timestamp'>) => void;
}> = ({ diagramLabel, model, editErrors, isExportModalOpen, onApplyClick }) => {
  const isDarkMode = useDarkMode();
  const { setEdges, setNodes } = useContext(ExportDiagramContext);
  const diagram = useDiagram();
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
          throw new Error(`Unknown placeholder ${type}`);
      }
      setApplyInput(JSON.stringify(placeholder, null, 2));
    };

  const edges = useMemo(() => {
    return (model?.relationships ?? []).map(mapRelationshipToEdgeProps);
  }, [model?.relationships]);

  const nodes = useMemo(() => {
    return (model?.collections ?? []).map(mapCollectionToNodeProps);
  }, [model?.collections]);

  useEffect(() => {
    if (isExportModalOpen) {
      setNodes(diagram.getNodes());
      setEdges(diagram.getEdges());
    } else {
      // Reset edges and nodes when the modal is closed
      setEdges([]);
      setNodes([]);
    }
  }, [isExportModalOpen, diagram, setEdges, setNodes]);

  return (
    <div
      className={modelPreviewContainerStyles}
      data-testid="diagram-editor-container"
    >
      <div className={modelPreviewStyles} data-testid="model-preview">
        <Diagram
          isDarkMode={isDarkMode}
          title={diagramLabel}
          edges={edges}
          nodes={nodes}
          onEdgeClick={(evt, edge) => {
            setApplyInput(
              JSON.stringify(
                {
                  type: 'RemoveRelationship',
                  relationshipId: edge.id,
                },
                null,
                2
              )
            );
          }}
        />
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
    const { diagram } = state;
    return {
      model: diagram
        ? selectCurrentModel(getCurrentDiagramFromState(state))
        : null,
      editErrors: diagram?.editErrors,
      diagramLabel: diagram?.name || 'Schema Preview',
    };
  },
  {
    onApplyClick: applyEdit,
  }
)(DiagramEditingState);
