import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import { ConnectionFormModalActions } from './connection-form-actions';

describe('<ConnectionFormModalActions />', function () {
  describe('Connect Button', function () {
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
      const saveButton = screen.getByText('Save');
      fireEvent(
        saveButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
      expect(onSaveSpy).to.have.been.calledOnce;
    });

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
      const saveButton = screen.getByText('Connect');
      fireEvent(
        saveButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
      expect(onSaveAndConnectSpy).to.have.been.calledOnce;
    });

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
      const saveButton = screen.getByText('Cancel');
      fireEvent(
        saveButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
      expect(onCancelSpy).to.have.been.calledOnce;
    });

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
  });
});
