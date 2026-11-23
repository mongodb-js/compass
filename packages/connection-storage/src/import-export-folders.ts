import { UUID } from 'bson';
import { z } from 'zod';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  isFolderNameEqual,
  type Folder,
  type FolderOrganization,
} from './folder';

export type ExportedFolders = {
  folders: Pick<Folder, 'id' | 'name'>[];
  folderAssignments: Record<string, string>;
};

export function pickExportedFolders(
  { folders, assignments }: FolderOrganization,
  connections: ConnectionInfo[]
): ExportedFolders {
  const folderAssignments: Record<string, string> = Object.create(null);
  for (const { id } of connections) {
    if (assignments[id]) {
      folderAssignments[id] = assignments[id];
    }
  }
  const usedFolderIds = new Set(Object.values(folderAssignments));
  return {
    folders: folders
      .filter(({ id }) => usedFolderIds.has(id))
      .map(({ id, name }) => ({ id, name })),
    folderAssignments,
  };
}

const ExportedFoldersSchema = z.object({
  folders: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
  folderAssignments: z.record(z.string(), z.string()).default({}),
});

/** Files exported before folders existed have neither key. */
export function deserializeFolders(content: string): ExportedFolders {
  const result = ExportedFoldersSchema.safeParse(JSON.parse(content));
  if (!result.success) {
    throw new Error('Input file contains invalid folders');
  }
  return result.data;
}

export function mergeImportedFolders(
  local: FolderOrganization,
  imported: ExportedFolders,
  connectionIds: string[]
): FolderOrganization {
  const folders = [...local.folders];
  const assignments: Record<string, string> = Object.assign(
    Object.create(null),
    local.assignments
  );
  for (const connectionId of connectionIds) {
    const importedFolder = imported.folders.find(
      ({ id }) => id === imported.folderAssignments[connectionId]
    );
    if (!importedFolder) {
      delete assignments[connectionId];
      continue;
    }
    let folder = folders.find(({ name }) =>
      isFolderNameEqual(name, importedFolder.name)
    );
    if (!folder) {
      folder = { id: new UUID().toString(), name: importedFolder.name };
      folders.push(folder);
    }
    assignments[connectionId] = folder.id;
  }
  return { folders, assignments };
}
