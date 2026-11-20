import React from 'react';
import { expect } from 'chai';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { InMemoryFolderStorage } from '@mongodb-js/connection-storage/provider';
import { render, screen, within } from '@mongodb-js/testing-library-compass';
import { ExportConnectionsModal } from './export-modal';

function connection(id: string, name: string): ConnectionInfo {
  return {
    id,
    connectionOptions: { connectionString: 'mongodb://localhost:27017' },
    favorite: { name },
    savedConnectionType: 'favorite',
  };
}

const connections = [
  connection('id1', 'name1'),
  connection('id2', 'name2'),
  connection('id3', 'name3'),
];

function renderModal({
  enableConnectionFolders = true,
}: { enableConnectionFolders?: boolean } = {}) {
  return render(<ExportConnectionsModal open setOpen={() => {}} />, {
    connections,
    preferences: { enableConnectionFolders },
    folderStorage: new InMemoryFolderStorage({
      folders: [
        { id: 'f-zeta', name: 'Zeta' },
        { id: 'f-alpha', name: 'alpha' },
        { id: 'f-empty', name: 'Empty' },
      ],
      assignments: { id1: 'f-zeta', id2: 'f-alpha', id3: 'f-deleted' },
    }),
  });
}

function groupIds() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-testid^="select-list-group-"]:not([data-testid$="-checkbox"]):not([data-testid$="-count"])'
    ),
    (el) => el.dataset.testid
  );
}

describe('ExportConnectionsModal', function () {
  it('groups connections by folder, sorted, with uncategorized last', async function () {
    renderModal();

    await screen.findByTestId('select-list-group-f-alpha');
    expect(groupIds()).to.deep.equal([
      'select-list-group-f-alpha',
      'select-list-group-f-zeta',
      'select-list-group-uncategorized',
    ]);
    expect(
      within(screen.getByTestId('select-list-group-f-alpha')).getByTestId(
        'select-id2'
      )
    ).to.exist;
    expect(
      within(screen.getByTestId('select-list-group-uncategorized')).getByTestId(
        'select-id3'
      )
    ).to.exist;
  });

  it('renders a flat list when folders are disabled', function () {
    renderModal({ enableConnectionFolders: false });

    expect(screen.getByTestId('select-id1')).to.exist;
    expect(screen.queryByTestId('select-list-group-uncategorized')).to.equal(
      null
    );
  });
});
