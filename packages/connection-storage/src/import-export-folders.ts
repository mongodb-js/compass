import { UUID } from 'bson';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { Folder, FolderOrganization } from './folder';

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

/** Files exported before folders existed have neither key. */
export function deserializeFolders(content: string): ExportedFolders {
  const { folders = [], folderAssignments = {} } = JSON.parse(content);
  return { folders, folderAssignments };
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
      continue;
    }
    let folder = folders.find(({ name }) => name === importedFolder.name);
    if (!folder) {
      folder = { id: new UUID().toString(), name: importedFolder.name };
      folders.push(folder);
    }
    assignments[connectionId] = folder.id;
  }
  return { folders, assignments };
}
