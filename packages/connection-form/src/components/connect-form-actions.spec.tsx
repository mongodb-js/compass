import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import ConnectFormActions from './connect-form-actions';

describe('ConnectFormActions Component', function () {
  afterEach(cleanup);
  describe('Save Button', function () {
    describe('with save button hidden', function () {
      let onSaveClickedFn: sinon.SinonSpy;
      beforeEach(function () {
        onSaveClickedFn = sinon.spy();
        render(
          <ConnectFormActions
            errors={[]}
            warnings={[]}
            onConnectClicked={() => true}
            onSaveClicked={onSaveClickedFn}
            saveButton="hidden"
          ></ConnectFormActions>
        );
      });
      it('should not show the button', function () {
        expect(screen.queryByText('Save')).to.throw;
      });
    });
    describe('with save button disabled', function () {
      let onSaveClickedFn: sinon.SinonSpy;
      beforeEach(function () {
        onSaveClickedFn = sinon.spy();
        render(
          <ConnectFormActions
            errors={[]}
            warnings={[]}
            onConnectClicked={() => true}
            onSaveClicked={onSaveClickedFn}
            saveButton="disabled"
          ></ConnectFormActions>
        );
      });
      it('should show the button', function () {
        const saveButton = screen.getByText('Save');
        expect(saveButton).to.be.visible;
      });
      it('should not call onSaveClicked function', function () {
        const saveButton = screen.getByText('Save');
        fireEvent(
          saveButton,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );
        expect(onSaveClickedFn.callCount).to.equal(0);
      });
    });
    describe('with save button enabled', function () {
      let onSaveClickedFn: sinon.SinonSpy;
      beforeEach(function () {
        onSaveClickedFn = sinon.spy();
        render(
          <ConnectFormActions
            errors={[]}
            warnings={[]}
            onConnectClicked={() => true}
            onSaveClicked={onSaveClickedFn}
            saveButton="enabled"
          ></ConnectFormActions>
        );
      });
      it('should show the button', function () {
        const saveButton = screen.getByText('Save');
        expect(saveButton).to.be.visible;
      });
      it('should call onSaveClicked function', function () {
        const saveButton = screen.getByText('Save');
        fireEvent(
          saveButton,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );
        expect(onSaveClickedFn.callCount).to.equal(1);
      });
    });

    describe('Connect Button', function () {
      let onConnectButtonFn: sinon.SinonSpy;
      beforeEach(function () {
        onConnectButtonFn = sinon.spy();
        render(
          <ConnectFormActions
            errors={[]}
            warnings={[]}
            onConnectClicked={onConnectButtonFn}
            onSaveClicked={() => true}
            saveButton="hidden"
          ></ConnectFormActions>
        );
      });
      it('should call onConnectClicked function', function () {
        const saveButton = screen.getByText('Connect');
        fireEvent(
          saveButton,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );
        expect(onConnectButtonFn.callCount).to.equal(1);
      });
    });
  });
});
