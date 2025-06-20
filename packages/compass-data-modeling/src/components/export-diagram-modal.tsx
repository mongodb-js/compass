import React, { useCallback, useState } from 'react';
import {
  Button,
  css,
  Icon,
  Label,
  Link,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  spacing,
} from '@mongodb-js/compass-components';
import {
  closeExportModal,
  selectCurrentModel,
  getCurrentDiagramFromState,
} from '../store/diagram';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import type { StaticModel } from '../services/data-model-storage';
import { exportToJson } from '../services/export-diagram';

const nbsp = '\u00a0';

const modelBodyStyles = css({
  paddingTop: spacing[600],
});

const exportFormatContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300],
});

const radioGroupStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300],
});

const footerStyles = css({
  display: 'flex',
  gap: spacing[200],
});

type ExportDiagramModalProps = {
  isModalOpen: boolean;
  diagramLabel: string;
  model: StaticModel | null;
  onCloseClick: () => void;
};

const ExportDiagramModal = ({
  isModalOpen,
  diagramLabel,
  model,
  onCloseClick,
}: ExportDiagramModalProps) => {
  const [exportFormat, setExportFormat] = useState<'json' | null>(null);

  const onExport = useCallback(() => {
    if (!exportFormat || !model) {
      return;
    }
    exportToJson(diagramLabel, model);
    onCloseClick();
  }, [exportFormat, onCloseClick, model, diagramLabel]);

  return (
    <Modal
      open={isModalOpen}
      setOpen={onCloseClick}
      data-testid="export-diagram-modal"
    >
      <ModalHeader
        title="Export data model"
        subtitle={
          <div>
            Export the data modal to JSON format.
            {nbsp}
            <Link
              href="https://www.mongodb.com/docs/compass/current/data-modeling/export-diagram/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </Link>
          </div>
        }
      />
      <ModalBody className={modelBodyStyles}>
        <div className={exportFormatContainerStyles}>
          <Label htmlFor="">Select file format:</Label>
          <RadioGroup
            className={radioGroupStyles}
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'json')}
          >
            <Radio value="json" aria-label="JSON">
              <Icon glyph="CurlyBraces" />
              {nbsp}
              JSON
            </Radio>
          </RadioGroup>
        </div>
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          variant="primary"
          onClick={() => void onExport()}
          data-testid="export-button"
        >
          Export
        </Button>
        <Button
          variant="default"
          onClick={onCloseClick}
          data-testid="cancel-button"
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default connect(
  (state: DataModelingState) => {
    const { diagram } = state;
    const model = diagram
      ? selectCurrentModel(getCurrentDiagramFromState(state))
      : null;
    return {
      model,
      diagramLabel: diagram?.name ?? 'Schema Preview',
      isModalOpen: Boolean(diagram?.isExportModalOpen),
    };
  },
  {
    onCloseClick: closeExportModal,
  }
)(ExportDiagramModal);
