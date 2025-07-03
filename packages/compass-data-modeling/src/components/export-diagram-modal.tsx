import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  openToast,
} from '@mongodb-js/compass-components';
import {
  closeExportModal,
  selectCurrentModel,
  getCurrentDiagramFromState,
} from '../store/diagram';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import type { StaticModel } from '../services/data-model-storage';
import { exportToJson, exportToPng } from '../services/export-diagram';
import { useDiagram } from '@mongodb-js/diagramming';
import { isCancelError } from '@mongodb-js/compass-utils';

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
  const [exportFormat, setExportFormat] = useState<'png' | 'json' | null>(null);
  const diagram = useDiagram();
  const [isExporting, setIsExporting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    const cleanup = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
    const abortController = new AbortController();
    if (isModalOpen) {
      abortControllerRef.current = abortController;
    } else {
      cleanup();
    }
    return cleanup;
  }, [isModalOpen]);

  const onClose = useCallback(() => {
    setIsExporting(false);
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    onCloseClick();
  }, [onCloseClick]);

  const onExport = useCallback(async () => {
    try {
      if (!exportFormat || !model) {
        return;
      }
      setIsExporting(true);
      if (exportFormat === 'json') {
        exportToJson(diagramLabel, model);
      } else if (exportFormat === 'png') {
        await exportToPng(
          diagramLabel,
          diagram,
          abortControllerRef.current?.signal
        );
      }
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }
      openToast('export-diagram-error', {
        variant: 'warning',
        title: 'Export failed',
        description: `An error occurred while exporting the diagram: ${
          (error as Error).message
        }`,
      });
    } finally {
      onClose();
    }
  }, [exportFormat, onClose, model, diagram, diagramLabel]);

  return (
    <Modal
      open={isModalOpen}
      setOpen={onClose}
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
                onClick={() => setExportFormat('png')}
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
                onClick={() => setExportFormat('json')}
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
          onClick={() => void onExport()}
          data-testid="export-button"
          disabled={!exportFormat || !model}
          loadingIndicator={<SpinLoader />}
          isLoading={isExporting}
        >
          Export
        </Button>
        <Button variant="default" onClick={onClose} data-testid="cancel-button">
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
