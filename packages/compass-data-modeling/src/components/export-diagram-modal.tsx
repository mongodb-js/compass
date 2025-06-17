import React, { useCallback } from 'react';
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
import {
  closeExportModal,
  selectCurrentModel,
  getCurrentDiagramFromState,
} from '../store/diagram';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import type { StaticModel } from '../services/data-model-storage';

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
  model: StaticModel;
  onCloseClick: () => void;
};

const ExportDiagramModal = ({
  isModalOpen,
  diagramLabel,
  model,
  onCloseClick,
}: ExportDiagramModalProps) => {
  const [exportFormat, setExportFormat] = React.useState<'json'>('json');
  const [isExporting, setIsExporting] = React.useState(false);

  const onExport = useCallback(() => {
    if (!exportFormat) {
      return;
    }
    setIsExporting(true);
    // TODO: export
    console.log(
      `Exporting diagram "${diagramLabel}" in ${exportFormat} format...`,
      model
    );
    setIsExporting(false);
  }, [exportFormat, model, diagramLabel]);

  return (
    <Modal open={isModalOpen} setOpen={() => {}}>
      <ModalHeader
        title="Export data model"
        subtitle={
          <div>
            Export the data modal to JSON Schema format.
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
            data-testid="export-json-format-options"
            className={radioGroupStyles}
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'json')}
          >
            <Radio value="json">
              <Icon glyph="CurlyBraces" />
              {nbsp}
              JSON Schema
            </Radio>
          </RadioGroup>
        </div>
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          variant="primary"
          onClick={() => void onExport()}
          data-testid="export-button"
          isLoading={isExporting}
          loadingIndicator={<SpinLoader />}
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
    if (!diagram) {
      throw new Error('No exportable diagram found in state');
    }
    const model = selectCurrentModel(getCurrentDiagramFromState(state));
    return {
      model,
      diagramLabel: diagram.name,
      isModalOpen: Boolean(diagram?.isExportModalOpen),
    };
  },
  {
    onCloseClick: closeExportModal,
  }
)(ExportDiagramModal);
