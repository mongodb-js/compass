import type { Edit } from './data-model-storage';
import { downloadFile } from './export-diagram';

const kCurrentVersion = 1;
const kFileTypeDescription = 'Compass Data Modeling Diagram';

export function downloadDiagram(fileName: string, edits: Edit[]) {
  const blob = new Blob(
    [JSON.stringify(getDownloadDiagramContent(fileName, edits), null, 2)],
    {
      type: 'application/json',
    }
  );
  const url = window.URL.createObjectURL(blob);
  downloadFile(url, `${fileName}.compass`, () => {
    window.URL.revokeObjectURL(url);
  });
}

export function getDownloadDiagramContent(name: string, edits: Edit[]) {
  return {
    type: kFileTypeDescription,
    version: kCurrentVersion,
    name,
    edits: Buffer.from(JSON.stringify(edits)).toString('base64'),
  };
}
