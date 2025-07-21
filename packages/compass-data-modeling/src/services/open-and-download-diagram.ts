import type { SetModelEdit } from './data-model-storage';
import { EditListSchema, type Edit } from './data-model-storage';
import { downloadFile } from './export-diagram';
import { z } from '@mongodb-js/compass-user-data';

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

export async function getDiagramContentsFromFile(
  file: File
): Promise<{ name: string; edits: [SetModelEdit, ...Edit[]] }> {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') {
        return reject(new Error('Invalid file contents'));
      }
      try {
        const parsedContent = JSON.parse(content);

        if (
          parsedContent.version !== kCurrentVersion &&
          parsedContent.type !== kFileTypeDescription
        ) {
          return reject(new Error('Unsupported diagram file format'));
        }

        const { name, edits } = parsedContent;

        if (!name || !edits || typeof edits !== 'string') {
          return reject(new Error('Diagram file is missing required fields'));
        }

        const parsedEdits = JSON.parse(
          Buffer.from(edits, 'base64').toString('utf-8')
        );
        // Ensure that edits validate using EditListSchema (SetModel must be first)
        const validEdits = EditListSchema.parse(parsedEdits);

        return resolve({
          name: parsedContent.name,
          edits: [validEdits[0] as SetModelEdit, ...validEdits.slice(1)],
        });
      } catch (error) {
        const message =
          error instanceof z.ZodError
            ? 'Failed to parse diagram file: Invalid diagram data.'
            : `Failed to parse diagram file: ${(error as Error).message}`;
        reject(new Error(message));
      }
    };
    reader.onerror = (error) => {
      reject(error.target?.error || new Error('File read error'));
    };
    reader.readAsText(file);
  });
}

export function getDiagramName(
  existingNames: string[],
  expectedName: string
): string {
  let name = expectedName;
  let index = 1;
  while (existingNames.includes(name)) {
    name = `${expectedName} (${index})`;
    index += 1;
  }
  return name;
}
