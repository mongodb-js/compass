import React, { useCallback, useContext, useMemo, useRef } from 'react';
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
import { ExportDiagramContext } from './export-diagram-context';
import {
  downloadImage,
  downloadJsonSchema,
  getDiagramJsonSchema,
  getPngDataUrl,
} from './diagram-editor/utils';
import { getNodesBounds } from '@xyflow/react';
import { useDiagram } from '@mongodb-js/diagramming';

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
  onClose: () => void;
  diagramLabel: string;
};

export const ExportDiagramModal = ({
  isModalOpen,
  onClose,
  diagramLabel,
}: ExportDiagramModalProps) => {
  const [exportFormat, setExportFormat] = React.useState<'png' | 'json' | null>(
    null
  );
  const [isExporting, setIsExporting] = React.useState(false);
  const exportDiagramContainerRef = useRef<HTMLDivElement>(null);
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const diagram = useDiagram();

  const bounds = useMemo(() => getNodesBounds(diagram.getNodes()), [diagram]);

  const onExport = useCallback(async () => {
    if (!exportFormat) {
      return;
    }
    setIsExporting(true);
    const nodes = diagram.getNodes();
    const edges = diagram.getEdges();

    if (exportFormat === 'png') {
      const dataUri = await getPngDataUrl(
        exportDiagramContainerRef,
        nodes,
        edges
      );
      setImageUri(dataUri);
      // downloadImage(dataUri, `${diagramLabel}.png`);
    } else if (exportFormat === 'json') {
      const jsonSchema = getDiagramJsonSchema({ nodes, edges });
      downloadJsonSchema(jsonSchema, `${diagramLabel}.json`);
    }

    setIsExporting(false);
    // onClose();
  }, [exportFormat, diagram, diagramLabel]);

  return (
    <Modal open={isModalOpen} setOpen={onClose}>
      <ModalHeader
        title="Export data model"
        subtitle={
          <div>
            Export what&apos;s on canvas as an image or its JSON Schema format.
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
            onChange={(e) => setExportFormat(e.target.value as 'png' | 'json')}
          >
            <Radio value="png">
              <Icon glyph="Diagram2" />
              {nbsp}
              PNG
            </Radio>
            <Radio value="json">
              <Icon glyph="CurlyBraces" />
              {nbsp}
              JSON Schema
            </Radio>
          </RadioGroup>
        </div>
        {exportFormat === 'png' && imageUri && (
          <img
            src={imageUri}
            alt="Exported Diagram"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              border: '1px solid red',
            }}
          />
        )}
        {/* Container where we render export diagram */}
        <div
          style={{
            width: bounds.width,
            height: bounds.height,
            // Fixed at bottom right corner
            position: 'fixed',
            top: '100vh',
            left: '100vw',
          }}
          ref={exportDiagramContainerRef}
        />
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
        <Button variant="default" onClick={onClose} data-testid="cancel-button">
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
