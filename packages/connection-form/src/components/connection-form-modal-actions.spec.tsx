import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import { ConnectionFormModalActions } from './connection-form-modal-actions';

describe('<ConnectionFormModalActions />', function () {
  it('should show warnings', function () {
    render(
      <ConnectionFormModalActions
        errors={[]}
        warnings={[{ message: 'Warning!' }]}
        onSave={() => undefined}
        onSaveAndConnect={() => undefined}
      ></ConnectionFormModalActions>
    );
    expect(screen.getByText('Warning!')).to.be.visible;
  });

  it('should show errors', function () {
    render(
      <ConnectionFormModalActions
        errors={[{ message: 'Error!' }]}
        warnings={[]}
        onSave={() => undefined}
        onSaveAndConnect={() => undefined}
      ></ConnectionFormModalActions>
    );
    expect(screen.getByText('Error!')).to.be.visible;
  });

  describe('Save&Connect Button', function () {
    it('should call onSaveAndConnect function', function () {
      const onSaveAndConnectSpy = sinon.spy();
      render(
        <ConnectionFormModalActions
          errors={[]}
          warnings={[]}
          onSave={() => undefined}
          onSaveAndConnect={onSaveAndConnectSpy}
        ></ConnectionFormModalActions>
      );
      const connectButton = screen.getByRole('button', {
        name: 'Save & Connect',
      });
      userEvent.click(connectButton);

      expect(onSaveAndConnectSpy).to.have.been.calledOnce;
    });

    it('should hide "connect" button if there is no callback', function () {
      render(
        <ConnectionFormModalActions
          errors={[]}
          warnings={[]}
        ></ConnectionFormModalActions>
      );
      expect(screen.queryByRole('button', { name: 'Save & Connect' })).to.not
        .exist;
    });
  });

  describe('Save Button', function () {
    it('should call onSave function', function () {
      const onSaveSpy = sinon.spy();
      render(
        <ConnectionFormModalActions
          errors={[]}
          warnings={[]}
          onSave={onSaveSpy}
          onSaveAndConnect={() => undefined}
        ></ConnectionFormModalActions>
      );
      const saveButton = screen.getByRole('button', { name: 'Save' });
      userEvent.click(saveButton);
      expect(onSaveSpy).to.have.been.calledOnce;
    });

    it('should hide "save" button if there is no callback', function () {
      render(
        <ConnectionFormModalActions
          errors={[]}
          warnings={[]}
          onSaveAndConnect={() => undefined}
        ></ConnectionFormModalActions>
      );
      expect(screen.queryByRole('button', { name: 'Save' })).to.not.exist;
    });
  });

  describe('Cancel Button', function () {
    it('should call onCancel function', function () {
      const onCancelSpy = sinon.spy();
      render(
        <ConnectionFormModalActions
          errors={[]}
          warnings={[]}
          onSave={() => undefined}
          onSaveAndConnect={() => undefined}
          onCancel={onCancelSpy}
        ></ConnectionFormModalActions>
      );
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      userEvent.click(cancelButton);

      expect(onCancelSpy).to.have.been.calledOnce;
    });

    it('should hide onCancel button if there is no callback', function () {
      render(
        <ConnectionFormModalActions
          errors={[]}
          warnings={[]}
          onSave={() => undefined}
          onSaveAndConnect={() => undefined}
        ></ConnectionFormModalActions>
      );
      expect(screen.queryByRole('button', { name: 'Cancel' })).to.not.exist;
    });
  });
});
