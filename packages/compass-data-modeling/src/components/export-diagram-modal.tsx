import React, { useCallback } from 'react';
import { useDiagram } from '@mongodb-js/diagramming';
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
  getNodesBounds,
  getViewportForBounds,
  type ReactFlowInstance,
} from '@xyflow/react';
import { toPng } from 'html-to-image';

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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getDiagramPngUrl = async (diagram: ReactFlowInstance) => {
  const currentViewport = diagram.getViewport();

  await diagram.fitView({ padding: '4px' });
  await wait(500);

  const bounds = getNodesBounds(diagram.getNodes());
  const width = bounds.width;
  const height = bounds.height;

  const transform = getViewportForBounds(bounds, width, height, 0.5, 2, 20);

  const element = document.querySelector('.react-flow__viewport');
  if (!element) {
    throw new Error('Viewport not found');
  }
  const url = await toPng(element as HTMLElement, {
    backgroundColor: '#ececec',
    width,
    height,
    style: {
      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
    },
  });
  await diagram.setViewport(currentViewport);
  return url;
};

const downloadDataUri = (dataUri: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = filename;
  link.click();
  link.remove();
};

type ExportDiagramModalProps = {
  isModalOpen: boolean;
  onClose: () => void;
};

export const ExportDiagramModal = ({
  isModalOpen,
  onClose,
}: ExportDiagramModalProps) => {
  const [exportFormat, setExportFormat] = React.useState<'png' | 'json' | null>(
    null
  );
  const diagram = useDiagram();

  const onExport = useCallback(async () => {
    if (exportFormat === 'png') {
      const dataUrl = await getDiagramPngUrl(diagram);
      downloadDataUri(dataUrl, 'diagram.png');
    }
    onClose();
  }, [exportFormat, diagram, onClose]);

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
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          variant="primary"
          onClick={() => void onExport()}
          data-testid="export-button"
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
