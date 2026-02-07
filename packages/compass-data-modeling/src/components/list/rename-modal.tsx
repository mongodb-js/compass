import {
  Button,
  css,
  FormFieldContainer,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@mongodb-js/compass-components';
import React, { useCallback, useMemo } from 'react';
import { useNewNameValidation } from '../../utils/use-new-name-validation';
import { renameDiagram } from '../../store/diagram';
import { useDataModelSavedItems } from '../../provider';
import type { DataModelingState } from '../../store/reducer';
import { connect } from 'react-redux';
import { closeRenameDiagramModal } from '../../store/rename-diagram-modal';

const inputStyles = css({
  height: `84px`,
  minHeight: `84px`,
});

type RenameDiagramModalProps = {
  isModalOpen: boolean;
  diagramId?: string;
  diagramName?: string;
  onRename: (id: string, newName: string) => void;
  onCloseClick: () => void;
};

const RenameDiagramModal: React.FC<RenameDiagramModalProps> = ({
  isModalOpen,
  diagramId,
  diagramName: _diagramName,
  onRename,
  onCloseClick,
}) => {
  const { items: savedDiagrams } = useDataModelSavedItems();
  const diagramNames = useMemo(
    () => savedDiagrams.map((diagram) => diagram.name),
    [savedDiagrams]
  );

  const [diagramName, setDiagramName] = React.useState<string>(
    _diagramName ?? ''
  );

  const handleDiagramNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDiagramName(event.target.value);
    },
    []
  );

  const handleRename = useCallback(() => {
    if (diagramId) {
      onRename(diagramId, diagramName);
    }
  }, [onRename, diagramId, diagramName]);

  const { isValid, errorMessage } = useNewNameValidation({
    existingNames: diagramNames,
    currentName: _diagramName ?? '',
    newName: diagramName,
    entity: 'Diagram',
  });

  return (
    <Modal
      open={isModalOpen}
      setOpen={(open: boolean) => {
        if (!open) onCloseClick();
      }}
    >
      <ModalHeader title="Rename diagram" />
      <ModalBody>
        <FormFieldContainer className={inputStyles}>
          <TextInput
            label="Name"
            onChange={handleDiagramNameChange}
            state={isValid ? undefined : 'error'}
            value={diagramName}
            errorMessage={!isValid && errorMessage}
          ></TextInput>
        </FormFieldContainer>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" disabled={!isValid} onClick={handleRename}>
          Rename
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default connect(
  (state: DataModelingState) => {
    return {
      isModalOpen: state.renameDiagramModal?.isOpen ?? false,
      diagramId: state.renameDiagramModal?.diagramId,
      diagramName: state.renameDiagramModal?.diagramName,
      key: state.renameDiagramModal?.diagramId,
    };
  },
  {
    onRename: renameDiagram,
    onCloseClick: closeRenameDiagramModal,
  }
)(RenameDiagramModal);
