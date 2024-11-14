import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import { ConnectionFormActions } from './connection-form-actions';

describe('<ConnectionFormActions />', function () {
  it('should show warnings', function () {
    render(
      <ConnectionFormActions
        errors={[]}
        warnings={[{ message: 'Warning!' }]}
        onSave={() => undefined}
        onSaveAndConnect={() => undefined}
      ></ConnectionFormActions>
    );
    expect(screen.getByText('Warning!')).to.be.visible;
  });

  it('should show errors', function () {
    render(
      <ConnectionFormActions
        errors={[{ message: 'Error!' }]}
        warnings={[]}
        onSave={() => undefined}
        onSaveAndConnect={() => undefined}
      ></ConnectionFormActions>
    );
    expect(screen.getByText('Error!')).to.be.visible;
  });

  describe('Save&Connect Button', function () {
    it('should call onSaveAndConnect function', function () {
      const onSaveAndConnectSpy = sinon.spy();
      render(
        <ConnectionFormActions
          errors={[]}
          warnings={[]}
          onSave={() => undefined}
          onSaveAndConnect={onSaveAndConnectSpy}
        ></ConnectionFormActions>
      );
      const connectButton = screen.getByRole('button', {
        name: 'Save & Connect',
      });
      userEvent.click(connectButton);

      expect(onSaveAndConnectSpy).to.have.been.calledOnce;
    });

    it('should hide "connect" button if there is no callback', function () {
      render(
        <ConnectionFormActions
          errors={[]}
          warnings={[]}
        ></ConnectionFormActions>
      );
      expect(screen.queryByRole('button', { name: 'Save & Connect' })).to.not
        .exist;
    });
  });

  describe('Save Button', function () {
    it('should call onSave function', function () {
      const onSaveSpy = sinon.spy();
      render(
        <ConnectionFormActions
          errors={[]}
          warnings={[]}
          onSave={onSaveSpy}
          onSaveAndConnect={() => undefined}
        ></ConnectionFormActions>
      );
      const saveButton = screen.getByRole('button', { name: 'Save' });
      userEvent.click(saveButton);
      expect(onSaveSpy).to.have.been.calledOnce;
    });

    it('should hide "save" button if there is no callback', function () {
      render(
        <ConnectionFormActions
          errors={[]}
          warnings={[]}
          onSaveAndConnect={() => undefined}
        ></ConnectionFormActions>
      );
      expect(screen.queryByRole('button', { name: 'Save' })).to.not.exist;
    });
  });

  describe('Cancel Button', function () {
    it('should call onCancel function', function () {
      const onCancelSpy = sinon.spy();
      render(
        <ConnectionFormActions
          errors={[]}
          warnings={[]}
          onSave={() => undefined}
          onSaveAndConnect={() => undefined}
          onCancel={onCancelSpy}
        ></ConnectionFormActions>
      );
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      userEvent.click(cancelButton);

      expect(onCancelSpy).to.have.been.calledOnce;
    });

    it('should hide onCancel button if there is no callback', function () {
      render(
        <ConnectionFormActions
          errors={[]}
          warnings={[]}
          onSave={() => undefined}
          onSaveAndConnect={() => undefined}
        ></ConnectionFormActions>
      );
      expect(screen.queryByRole('button', { name: 'Cancel' })).to.not.exist;
    });
  });
});
