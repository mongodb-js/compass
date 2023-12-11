import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { setImmediate as tick } from 'timers/promises';

import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';

import FileInput, {
  FileInputBackendProvider,
  createElectronFileInputBackend,
} from './file-input';

describe('FileInput', function () {
  let spy;

  beforeEach(function () {
    spy = sinon.spy();
  });

  afterEach(function () {
    cleanup();
  });

  it('renders "Select a file..." if values is falsy and multi is false', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        mode="open"
      />
    );

    const button = screen.getByTestId('file-input-button');
    expect(button.textContent).to.equal('Select a file...');
  });

  it('renders "Select a file..." if values is empty and multi is false', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        values={[]}
        mode="open"
      />
    );

    const button = screen.getByTestId('file-input-button');
    expect(button.textContent).to.equal('Select a file...');
  });

  it('renders "Select files..." if values is falsy and multi is true', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        mode="open"
        multi
      />
    );

    const button = screen.getByTestId('file-input-button');
    expect(button.textContent).to.equal('Select files...');
  });

  it('renders "a.png" if values is [a.png]', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        values={['a.png']}
        mode="open"
      />
    );

    const button = screen.getByTestId('file-input-button');
    expect(button.textContent).to.equal('a.png');
  });

  it('renders "a.png, b.png" if values is [a.png, b.png]', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        values={['a.png', 'b.png']}
        mode="open"
      />
    );

    const button = screen.getByTestId('file-input-button');
    expect(button.textContent).to.equal('a.png, b.png');
  });

  it('supports variant vertical', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        variant="vertical"
        mode="open"
      />
    );

    // how do we test this since it is just different css?
  });

  it('supports variant default', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        variant="default"
        mode="open"
      />
    );

    // how do we test this since it is just different css?
  });

  it('adds styling when error=true', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        error
        mode="open"
      />
    );

    // how do we test this since it is just different css?
  });

  it('adds a link if link is specified', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        link="http://google.com/"
        mode="open"
      />
    );

    const link = screen.getByTestId('file-input-link');
    expect(link).to.exist;
  });

  it('adds description if description is specified', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        description={'Learn more'}
        mode="open"
      />
    );

    const description = screen.getByTestId('file-input-description');
    expect(description).to.exist;
  });

  it('adds link and description if specified', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        link="http://google.com/"
        description={'Learn more'}
        mode="open"
      />
    );

    const linkDescription = screen.getByTestId('file-input-link');
    expect(linkDescription).to.exist;
  });

  it('adds error message if specified', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        error={true}
        errorMessage={'Error'}
        mode="open"
      />
    );

    const errorMessage = screen.getByTestId('file-input-error');
    expect(errorMessage).to.exist;
  });

  it('does not show optional if not specified', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        error={true}
        errorMessage={'Error'}
        mode="open"
      />
    );

    expect(screen.queryByText('Optional')).to.equal(null);
  });

  it('renders the optional when specified', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        error={true}
        errorMessage={'Error'}
        optional
        mode="open"
      />
    );

    expect(screen.getByText('Optional')).to.be.visible;
  });

  it('renders the optional message when specified', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        onChange={spy}
        error={true}
        errorMessage={'Error'}
        optional
        optionalMessage="pineapples"
        mode="open"
      />
    );

    expect(screen.getByText('pineapples')).to.be.visible;
  });

  describe('when a file is chosen', function () {
    beforeEach(async function () {
      render(
        <FileInput
          id="file-input"
          label="Select something"
          dataTestId="test-file-input"
          onChange={spy}
          error={true}
          errorMessage={'Error'}
          mode="open"
        />
      );

      const fileInput = screen.getByTestId('test-file-input');

      await waitFor(() =>
        fireEvent.change(fileInput, {
          target: {
            files: [
              {
                path: 'new/file/path',
              },
            ],
          },
        })
      );
    });

    it('calls onChange with the chosen file', function () {
      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.deep.equal(['new/file/path']);
    });
  });

  it('renders the file name with close button when showFileOnNewLine=true', function () {
    render(
      <FileInput
        id="file-input"
        label="Select something"
        dataTestId="test-file-input"
        onChange={spy}
        showFileOnNewLine
        values={['new/file/nice', 'another/file/path']}
        mode="open"
      />
    );

    expect(screen.getByText('new/file/nice')).to.be.visible;
    expect(screen.getByText('another/file/path')).to.be.visible;
    expect(screen.getAllByLabelText('Remove file').length).to.equal(2);
  });

  describe('when a file is clicked to remove on multi line', function () {
    beforeEach(async function () {
      render(
        <FileInput
          id="file-input"
          label="Select something"
          dataTestId="test-file-input"
          onChange={spy}
          error={true}
          errorMessage={'Error'}
          showFileOnNewLine
          values={['new/file/path', 'another/file/path']}
          mode="open"
        />
      );

      const removeButton = screen.getAllByLabelText('Remove file')[0];

      await waitFor(() => fireEvent.click(removeButton));
    });

    it('calls onChange with the file removed', function () {
      expect(spy.callCount).to.equal(1);
      expect(spy.firstCall.args[0]).to.deep.equal(['another/file/path']);
    });
  });

  describe('createElectronFileInputBackend', function () {
    function createFakeElectron() {
      const fakeWindow = {};
      const fakeElectron = {
        getCurrentWindow: sinon.stub().returns(fakeWindow),
        dialog: {
          showSaveDialog: sinon.stub(),
          showOpenDialog: sinon.stub(),
        },
      };
      return { fakeElectron, fakeWindow };
    }

    it('allows using electron-style APIs for file updates', async function () {
      const { fakeElectron, fakeWindow } = createFakeElectron();

      const backend = createElectronFileInputBackend(fakeElectron)();
      const listener = sinon.stub();
      const unsubscribe = backend.onFilesChosen(listener);

      fakeElectron.dialog.showSaveDialog.resolves({
        canceled: false,
        filePath: 'filepath',
      });
      backend.openFileChooser({ mode: 'save', multi: false, accept: '.json' });
      expect(fakeElectron.dialog.showOpenDialog).to.not.have.been.called;
      expect(fakeElectron.dialog.showSaveDialog).to.have.been.calledOnceWith(
        fakeWindow,
        {
          properties: ['openFile'],
          filters: [{ name: '.json file', extensions: ['json'] }],
        }
      );
      expect(listener).to.not.have.been.called;
      await tick();
      expect(listener).to.been.calledOnceWith(['filepath']);

      unsubscribe();
      backend.openFileChooser({ mode: 'save', multi: false, accept: '.json' });

      await tick();
      expect(listener).to.have.been.calledOnce;
      expect(fakeElectron.dialog.showSaveDialog).to.have.been.calledTwice;
    });

    it('can partially handle browser-compatible accept values', function () {
      const { fakeElectron, fakeWindow } = createFakeElectron();

      const backend = createElectronFileInputBackend(fakeElectron)();

      fakeElectron.dialog.showSaveDialog.resolves({
        canceled: true,
      });
      backend.openFileChooser({
        mode: 'save',
        multi: false,
        accept: '.json, .csv, application/octet-stream',
      });
      expect(fakeElectron.dialog.showSaveDialog).to.have.been.calledWith(
        fakeWindow,
        {
          properties: ['openFile'],
          filters: [
            { name: '.json file', extensions: ['json'] },
            { name: '.csv file', extensions: ['csv'] },
          ],
        }
      );
    });

    it('does not override existing file filters', function () {
      const { fakeElectron, fakeWindow } = createFakeElectron();

      const backend = createElectronFileInputBackend(fakeElectron)();

      fakeElectron.dialog.showSaveDialog.resolves({
        canceled: true,
      });
      backend.openFileChooser({
        mode: 'save',
        filters: [{ name: 'CSV file', extensions: ['csv'] }],
        multi: false,
        accept: '.json, .csv, application/octet-stream',
      });
      expect(fakeElectron.dialog.showSaveDialog).to.have.been.calledWith(
        fakeWindow,
        {
          properties: ['openFile'],
          filters: [
            { name: 'CSV file', extensions: ['csv'] },
            { name: '.json file', extensions: ['json'] },
          ],
        }
      );
    });

    it('handles multi:false', function () {
      const { fakeElectron, fakeWindow } = createFakeElectron();

      const backend = createElectronFileInputBackend(fakeElectron)();

      fakeElectron.dialog.showSaveDialog.resolves({
        canceled: true,
      });
      backend.openFileChooser({
        mode: 'save',
        properties: ['multiSelect'],
        multi: false,
      });
      expect(fakeElectron.dialog.showSaveDialog).to.have.been.calledWith(
        fakeWindow,
        {
          properties: ['openFile'],
          filters: [],
        }
      );
    });

    it('handles multi:true', function () {
      const { fakeElectron, fakeWindow } = createFakeElectron();

      const backend = createElectronFileInputBackend(fakeElectron)();

      fakeElectron.dialog.showSaveDialog.resolves({
        canceled: true,
      });
      backend.openFileChooser({
        mode: 'save',
        multi: true,
      });
      expect(fakeElectron.dialog.showSaveDialog).to.have.been.calledWith(
        fakeWindow,
        {
          properties: ['openFile', 'multiSelect'],
          filters: [],
        }
      );
    });

    it('can call showOpenDialog if requested', async function () {
      const { fakeElectron, fakeWindow } = createFakeElectron();

      const backend = createElectronFileInputBackend(fakeElectron)();
      const listener = sinon.stub();
      backend.onFilesChosen(listener);

      fakeElectron.dialog.showOpenDialog.resolves({
        canceled: false,
        filePaths: ['a', 'b'],
      });
      backend.openFileChooser({
        mode: 'open',
        multi: false,
      });
      expect(fakeElectron.dialog.showSaveDialog).to.not.have.been.called;
      expect(fakeElectron.dialog.showOpenDialog).to.have.been.calledWith(
        fakeWindow,
        {
          properties: ['openFile'],
          filters: [],
        }
      );
      expect(listener).to.not.have.been.called;
      await tick();
      expect(listener).to.been.calledOnceWith(['a', 'b']);
    });

    it('calls the listener with an empty array if the user canceled the request', async function () {
      const { fakeElectron } = createFakeElectron();

      const backend = createElectronFileInputBackend(fakeElectron)();
      const listener = sinon.stub();
      backend.onFilesChosen(listener);

      fakeElectron.dialog.showSaveDialog.resolves({
        canceled: true,
        filePaths: ['a', 'b'],
      });
      backend.openFileChooser({
        mode: 'save',
        multi: false,
      });
      expect(listener).to.not.have.been.called;
      await tick();
      expect(listener).to.been.calledOnceWith([]);
    });

    it('handles autoOpen:true', async function () {
      const { fakeElectron } = createFakeElectron();
      const backend = createElectronFileInputBackend(fakeElectron)();

      const listener = sinon.stub();
      backend.onFilesChosen(listener);
      const openFileChooserSpy = sinon.spy(backend, 'openFileChooser');

      fakeElectron.dialog.showSaveDialog.resolves({
        canceled: false,
        filePaths: ['a'],
      });

      expect(openFileChooserSpy).to.not.have.been.called;
      expect(spy).to.not.have.been.called;

      render(
        <FileInputBackendProvider createFileInputBackend={() => backend}>
          <FileInput
            autoOpen
            id="file-input"
            label="Select something"
            onChange={spy}
            values={['new/file/path', 'another/file/path']}
            mode="save"
          />
        </FileInputBackendProvider>
      );

      await tick();
      expect(spy).to.been.calledOnce;
      expect(openFileChooserSpy).to.been.calledOnceWithExactly({
        multi: false,
        mode: 'save',
        accept: undefined,
        title: undefined,
        defaultPath: undefined,
        filters: undefined,
        buttonLabel: undefined,
        properties: undefined,
      });
      expect(fakeElectron.dialog.showSaveDialog).to.been.calledOnceWithExactly(
        {},
        {
          properties: ['openFile'],
          filters: [],
        }
      );
      expect(listener).to.been.calledOnceWith(['a']);
    });

    describe('when the elector backend is provided by FileInputBackendProvider', function () {
      let listener: sinon.SinonStub;
      let showOpenDialogStub: sinon.SinonStub;
      let openFileChooserSpy: sinon.SinonSpy;

      beforeEach(async function () {
        const { fakeElectron } = createFakeElectron();
        const backend = createElectronFileInputBackend(fakeElectron)();

        listener = sinon.stub();
        backend.onFilesChosen(listener);
        openFileChooserSpy = sinon.spy(backend, 'openFileChooser');

        showOpenDialogStub = fakeElectron.dialog.showOpenDialog;

        fakeElectron.dialog.showOpenDialog.resolves({
          canceled: false,
          filePaths: ['a.json', 'b.json'],
        });

        render(
          <FileInputBackendProvider createFileInputBackend={() => backend}>
            <FileInput
              id="file-input"
              label="Select something"
              dataTestId="test-file-input"
              onChange={spy}
              showFileOnNewLine
              multi
              values={[]}
              buttonLabel="Open Sesame"
              accept=".json, .csv"
              defaultPath="~/"
              title="file open title"
              mode="open"
            />
          </FileInputBackendProvider>
        );
        await tick();

        expect(spy).to.not.have.been.called;
        expect(openFileChooserSpy).to.not.have.been.called;
        expect(showOpenDialogStub).to.not.have.been.called;
      });

      it('calls to open a file input', async function () {
        const selectFileButton = screen.getByTestId('file-input-button');
        await waitFor(() => fireEvent.click(selectFileButton));

        expect(spy).to.been.calledOnce;
        expect(openFileChooserSpy).to.been.calledOnceWithExactly({
          multi: true,
          mode: 'open',
          title: 'file open title',
          defaultPath: '~/',
          accept: '.json, .csv',
          filters: undefined,
          buttonLabel: 'Open Sesame',
          properties: undefined,
        });
        expect(showOpenDialogStub).to.been.calledOnceWithExactly(
          {},
          {
            properties: ['openFile', 'multiSelect'],
            filters: [
              { name: '.json file', extensions: ['json'] },
              { name: '.csv file', extensions: ['csv'] },
            ],
            title: 'file open title',
            defaultPath: '~/',
            buttonLabel: 'Open Sesame',
          }
        );
        expect(listener).to.been.calledOnceWith(['a.json', 'b.json']);
      });
    });
  });
});
