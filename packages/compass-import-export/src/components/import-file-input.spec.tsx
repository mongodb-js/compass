import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { ImportFileInput } from './import-file-input';

describe('ImportFileInput', function () {
  let selectImportFile: sinon.SinonSpy;
  let onCancel: sinon.SinonSpy;
  let clickSpy: sinon.SinonSpy;

  beforeEach(function () {
    selectImportFile = sinon.spy();
    onCancel = sinon.spy();
    clickSpy = sinon.spy(HTMLInputElement.prototype, 'click');
  });

  afterEach(function () {
    clickSpy.restore();
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

  it('call onCancel when the user cancels the file dialog', function () {
    render(
      <ImportFileInput
        fileName=""
        selectImportFile={selectImportFile}
        onCancel={onCancel}
      />
    );

    fireEvent(
      screen.getByLabelText('Import file:'),
      new Event('cancel', { bubbles: true })
    );

    expect(onCancel).to.have.been.calledOnce;
    expect(selectImportFile).to.not.have.been.called;
  });

  it('open the file dialog on mount when autoOpen is set', function () {
    render(
      <ImportFileInput
        autoOpen
        fileName=""
        selectImportFile={selectImportFile}
      />
    );

    expect(clickSpy).to.have.been.calledOnce;
    expect(clickSpy.firstCall.thisValue).to.equal(
      screen.getByLabelText('Import file:')
    );
  });
});
