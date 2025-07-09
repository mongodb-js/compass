import React from 'react';
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
  SpinLoader,
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

const nbsp = '\u00a0';

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
  alignItems: 'center',
  gap: spacing[200],
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
      <ModalHeader
        title="Export data model"
        subtitle={
          <div>
            Export the data modal to JSON format.
            {nbsp}
            <Link
              href="https://www.mongodb.com/docs/manual/data-modeling//"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </Link>
          </div>
        }
      />
      <ModalBody className={modelBodyStyles}>
        <div className={contentContainerStyles}>
          <Label htmlFor="">Select file format:</Label>
          <RadioGroup className={contentContainerStyles} value={exportFormat}>
            <div className={radioItemStyles}>
              <Icon glyph="Diagram2" />
              <Radio
                checked={exportFormat === 'png'}
                value="png"
                aria-label="PNG"
                onClick={() => onSelectFormat('png')}
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
