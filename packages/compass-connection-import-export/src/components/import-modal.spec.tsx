import React from 'react';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { expect } from 'chai';
import sinon from 'sinon';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import type { FileInputBackend } from '@mongodb-js/compass-components';
import { FileInputBackendProvider } from '@mongodb-js/compass-components';
import {
  render,
  screen,
  userEvent,
  waitFor,
  fireEvent,
} from '@mongodb-js/testing-library-compass';
import { ImportConnectionsModal } from './import-modal';

const exampleFileContents = '{"a":"b"}';

function connection(id: string, name: string): ConnectionInfo {
  return {
    id,
    connectionOptions: { connectionString: 'mongodb://localhost:27017' },
    favorite: { name },
    savedConnectionType: 'favorite',
  };
}

describe('ImportConnectionsModal', function () {
  let sandbox: sinon.SinonSandbox;
  let setOpen: sinon.SinonStub;
  let tmpdir: string;
  let exampleFile: string;

  function renderModal({
    open = true,
    connections = [],
  }: { open?: boolean; connections?: ConnectionInfo[] } = {}) {
    return render(<ImportConnectionsModal open={open} setOpen={setOpen} />, {
      connections,
      wrapper: ({ children }) => (
        <FileInputBackendProvider
          createFileInputBackend={() =>
            ({
              getPathForFile: () => exampleFile,
            } as unknown as FileInputBackend)
          }
        >
          {children}
        </FileInputBackendProvider>
      ),
    });
  }

  function toggleConnection(id: string) {
    userEvent.click(screen.getByTestId(`select-${id}`), undefined, {
      skipPointerEventsCheck: true,
    });
  }

  async function selectFile() {
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [{ name: 'connections.json' }] },
    });
    await waitFor(() => {
      expect(screen.getByTestId('select-list-all-checkbox')).to.exist;
    });
  }

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
    setOpen = sinon.stub();
    tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'compass-import-modal-'));
    exampleFile = path.join(tmpdir, 'connections.json');
    await fs.writeFile(exampleFile, exampleFileContents);
  });

  afterEach(async function () {
    sandbox.restore();
    await fs.rm(tmpdir, { recursive: true });
  });

  it('renders the form and the trusted sources warning when open', function () {
    const { container } = renderModal();

    expect(screen.getByTestId('connection-import-modal')).to.exist;
    expect(screen.getByTestId('conn-import-export-passphrase-input')).to.exist;
    expect(container).to.contain.text(
      'Only import connection files from trusted sources.'
    );
  });

  it('renders nothing when closed', function () {
    const { container } = renderModal({ open: false });

    expect(container).to.not.contain.text(
      'Only import connection files from trusted sources.'
    );
    expect(
      screen.queryByTestId('conn-import-export-passphrase-input')
    ).to.equal(null);
  });

  it('disables submit until a file is selected', async function () {
    const { connectionStorage } = renderModal();
    sandbox
      .stub(connectionStorage, 'deserializeConnections')
      .resolves([connection('id1', 'name1')]);

    expect(screen.getByRole('button', { name: 'Import' })).to.have.attribute(
      'aria-disabled',
      'true'
    );

    await selectFile();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Import' })
      ).to.not.have.attribute('aria-disabled', 'true');
    });
  });

  it('lists the connections from the selected file', async function () {
    const { connectionStorage } = renderModal();
    const deserialize = sandbox
      .stub(connectionStorage, 'deserializeConnections')
      .resolves([connection('id1', 'name1'), connection('id2', 'name2')]);

    await selectFile();

    expect(deserialize.lastCall.firstArg.content).to.equal(exampleFileContents);
    expect(screen.getByText('name1')).to.exist;
    expect(screen.getByText('name2')).to.exist;
    expect(screen.getByTestId('select-id1')).to.have.property('checked', true);
  });

  it('marks already saved connections and warns when they are selected', async function () {
    const existing = connection('id1', 'name1');
    const { connectionStorage } = renderModal({ connections: [existing] });
    sandbox
      .stub(connectionStorage, 'deserializeConnections')
      .resolves([existing, connection('id2', 'name2')]);

    await selectFile();

    expect(screen.getByTestId('existing-favorite-badge-id1')).to.exist;
    expect(screen.getByTestId('select-id1')).to.have.property('checked', false);
    expect(screen.queryByText(/will be overwritten/)).to.equal(null);

    toggleConnection('id1');

    expect(await screen.findByText(/will be overwritten/)).to.exist;
  });

  it('imports only the selected connections and reports success', async function () {
    const { connectionStorage } = renderModal();
    sandbox
      .stub(connectionStorage, 'deserializeConnections')
      .resolves([connection('id1', 'name1'), connection('id2', 'name2')]);
    const importConnections = sandbox
      .stub(connectionStorage, 'importConnections')
      .resolves();

    await selectFile();
    toggleConnection('id2');
    userEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(importConnections).to.have.been.calledOnce;
    });
    const { content, options } = importConnections.lastCall.firstArg;
    expect(content).to.equal(exampleFileContents);
    expect(options.filterConnectionIds).to.deep.equal(['id1']);

    expect(setOpen).to.have.been.calledWith(false);
    expect(await screen.findByText('Import successful')).to.exist;
  });

  it('decrypts with the typed passphrase and locks the field once accepted', async function () {
    const { connectionStorage } = renderModal();
    const deserialize = sandbox
      .stub(connectionStorage, 'deserializeConnections')
      .resolves([connection('id1', 'name1')]);
    const importConnections = sandbox
      .stub(connectionStorage, 'importConnections')
      .resolves();

    const passphraseInput = screen.getByTestId(
      'conn-import-export-passphrase-input'
    );
    userEvent.type(passphraseInput, 's3cret');
    await selectFile();

    expect(deserialize.lastCall.firstArg.options.passphrase).to.equal('s3cret');
    // Passphrase is accepted at this point, so it can no longer be edited.
    expect(passphraseInput).to.have.attribute('aria-disabled', 'true');

    userEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(importConnections.lastCall.firstArg.options.passphrase).to.equal(
        's3cret'
      );
    });
  });

  it('shows an error banner when importing fails and stays open', async function () {
    const { connectionStorage } = renderModal();
    sandbox
      .stub(connectionStorage, 'deserializeConnections')
      .resolves([connection('id1', 'name1')]);
    sandbox
      .stub(connectionStorage, 'importConnections')
      .rejects(new Error('cannot import'));

    await selectFile();
    userEvent.click(screen.getByRole('button', { name: 'Import' }));

    expect(await screen.findByText(/Error: cannot import/)).to.exist;
    expect(setOpen).to.not.have.been.calledWith(false);
  });

  it('shows an error banner when the file cannot be read', async function () {
    const { connectionStorage } = renderModal();
    sandbox
      .stub(connectionStorage, 'deserializeConnections')
      .rejects(new Error('invalid file'));

    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [{ name: 'connections.json' }] },
    });

    expect(await screen.findByText(/Error: invalid file/)).to.exist;
    expect(screen.getByRole('button', { name: 'Import' })).to.have.attribute(
      'aria-disabled',
      'true'
    );
  });

  it('asks for a passphrase instead of an error when the file is encrypted', async function () {
    const { connectionStorage } = renderModal();
    const err: Error & { passphraseRequired?: boolean } = new Error(
      'passphrase needed'
    );
    err.passphraseRequired = true;
    sandbox.stub(connectionStorage, 'deserializeConnections').rejects(err);

    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [{ name: 'connections.json' }] },
    });

    expect(await screen.findByText('Passphrase required')).to.exist;
    expect(screen.queryByText(/Error: passphrase needed/)).to.equal(null);
  });

  it('closes without importing when canceled', function () {
    renderModal();

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(setOpen).to.have.been.calledOnceWith(false);
  });
});
