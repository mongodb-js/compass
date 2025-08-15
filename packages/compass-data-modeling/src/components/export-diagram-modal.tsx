import React from 'react';
import {
  Button,
  css,
  Icon,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  spacing,
  SpinLoader,
  PngIcon,
} from '@mongodb-js/compass-components';
import type { ExportDiagramFormat } from '../store/export-diagram';
import {
  closeExportModal,
  exportDiagram,
  selectFormat,
} from '../store/export-diagram';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { useDiagram } from '@mongodb-js/diagramming';
import type { DiagramInstance } from '@mongodb-js/diagramming';

const modelBodyStyles = css({
  paddingTop: spacing[600],
});

const contentContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300],
});

const radioItemStyles = css({
  display: 'flex',
  gap: spacing[200],
  '> svg': {
    marginTop: spacing[50],
  },
});

const footerStyles = css({
  display: 'flex',
  gap: spacing[200],
});

type ExportDiagramModalProps = {
  isModalOpen: boolean;
  isExporting: boolean;
  exportFormat?: ExportDiagramFormat;
  onExportDiagram: (diagramInstance: DiagramInstance) => void;
  onSelectFormat: (format: ExportDiagramFormat) => void;
  onCloseClick: () => void;
};

const ExportDiagramModal = ({
  isModalOpen,
  isExporting,
  exportFormat,
  onExportDiagram,
  onSelectFormat,
  onCloseClick,
}: ExportDiagramModalProps) => {
  const diagram = useDiagram();

  return (
    <Modal
      open={isModalOpen}
      setOpen={onCloseClick}
      data-testid="export-diagram-modal"
    >
      <ModalHeader title="Export data model" />
      <ModalBody className={modelBodyStyles}>
        <div className={contentContainerStyles}>
          <Label htmlFor="">Select file format:</Label>
          <RadioGroup className={contentContainerStyles} value={exportFormat}>
            <div className={radioItemStyles}>
              <Icon glyph="Diagram" />
              <Radio
                checked={exportFormat === 'diagram'}
                value="diagram"
                aria-label="Diagram File"
                onClick={() => onSelectFormat('diagram')}
                size="small"
                description="Importable into Compass so teammates can collaborate."
              >
                Diagram File
              </Radio>
            </div>
            <div className={radioItemStyles}>
              <PngIcon />
              <Radio
                checked={exportFormat === 'png'}
                value="png"
                aria-label="PNG"
                onClick={() => onSelectFormat('png')}
                size="small"
                description="Shareable image for documentation or presentations."
              >
                PNG
              </Radio>
            </div>
            <div className={radioItemStyles}>
              <Icon glyph="CurlyBraces" />
              <Radio
                checked={exportFormat === 'json'}
                value="json"
                aria-label="JSON"
                onClick={() => onSelectFormat('json')}
                size="small"
                description="Raw schema data for programmatic use."
              >
                JSON
              </Radio>
            </div>
          </RadioGroup>
        </div>
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          variant="primary"
          onClick={() => onExportDiagram(diagram)}
          data-testid="export-button"
          disabled={!exportFormat}
          loadingIndicator={<SpinLoader />}
          isLoading={isExporting}
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
    const {
      exportDiagram: { isExporting, isModalOpen, exportFormat },
    } = state;
    return {
      isModalOpen,
      isExporting,
      exportFormat,
    };
  },
  {
    onCloseClick: closeExportModal,
    onSelectFormat: selectFormat,
    onExportDiagram: exportDiagram,
  }
)(ExportDiagramModal);
