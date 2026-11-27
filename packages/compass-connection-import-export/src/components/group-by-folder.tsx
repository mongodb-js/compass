import React from 'react';
import { FolderIcon } from '@mongodb-js/compass-components';
import type { Folder } from '@mongodb-js/connection-storage/provider';

export function groupByFolder<T extends { id: string }>(
  items: T[],
  folders: Pick<Folder, 'id' | 'name'>[],
  folderAssignments: Record<string, string>
) {
  const sortedFolders = folders
    .slice()
    .sort((a, b) =>
      a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase())
    );
  const folderIds = new Set(folders.map((folder) => folder.id));
  return [
    ...sortedFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      icon: <FolderIcon />,
      items: items.filter((item) => folderAssignments[item.id] === folder.id),
    })),
    {
      name: 'Uncategorized',
      items: items.filter((item) => !folderIds.has(folderAssignments[item.id])),
    },
  ].filter((group) => group.items.length > 0);
}
