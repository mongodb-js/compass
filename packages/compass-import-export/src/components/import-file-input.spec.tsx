import React from 'react';
import {
  cleanup,
  render,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { ImportFileInput } from './import-file-input';

describe('ImportFileInput', function () {
  let selectImportFile: sinon.SinonSpy;

  beforeEach(function () {
    selectImportFile = sinon.spy();
  });

  afterEach(function () {
    cleanup();
  });

  it('show the name of the selected file', function () {
    render(
      <ImportFileInput
        fileName="good.json"
        selectImportFile={selectImportFile}
      />
    );

    expect(screen.getByRole('button', { name: /good\.json/ })).to.be.visible;
  });

  it('select the file the user picks', function () {
    render(<ImportFileInput fileName="" selectImportFile={selectImportFile} />);
    const file = new File(['[]'], 'picked.json');

    userEvent.upload(screen.getByLabelText('Import file:'), file);

    expect(selectImportFile).to.have.been.calledOnceWith(file);
  });
});
