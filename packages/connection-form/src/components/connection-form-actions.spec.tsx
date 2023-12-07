import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import ConnectFormActions from './connection-form-actions';

describe('ConnectFormActions Component', function () {
  afterEach(cleanup);
  describe('Save Button', function () {
    describe('with save button hidden', function () {
      let onSaveClickedFn: sinon.SinonSpy;
      let onSaveAndConnectClickedFn: sinon.SinonSpy;
      beforeEach(function () {
        onSaveClickedFn = sinon.spy();
        onSaveAndConnectClickedFn = sinon.spy();
        render(
          <ConnectFormActions
            errors={[]}
            warnings={[]}
            onConnectClicked={() => true}
            onSaveClicked={onSaveClickedFn}
            onSaveAndConnectClicked={onSaveAndConnectClickedFn}
            saveButton="hidden"
            saveAndConnectButton="hidden"
            showSaveActions
          ></ConnectFormActions>
        );
      });
      it('should not show the button', function () {
        expect(screen.queryByText('Save')).to.throw;
      });
    });
    describe('with save button disabled', function () {
      let onSaveClickedFn: sinon.SinonSpy;
      let onSaveAndConnectClickedFn: sinon.SinonSpy;
      beforeEach(function () {
        onSaveClickedFn = sinon.spy();
        onSaveAndConnectClickedFn = sinon.spy();
        render(
          <ConnectFormActions
            errors={[]}
            warnings={[]}
            onConnectClicked={() => true}
            onSaveClicked={onSaveClickedFn}
            onSaveAndConnectClicked={onSaveAndConnectClickedFn}
            saveButton="disabled"
            saveAndConnectButton="hidden"
            showSaveActions
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
      let onSaveAndConnectClickedFn: sinon.SinonSpy;
      beforeEach(function () {
        onSaveClickedFn = sinon.spy();
        onSaveAndConnectClickedFn = sinon.spy();
        render(
          <ConnectFormActions
            errors={[]}
            warnings={[]}
            onConnectClicked={() => true}
            onSaveClicked={onSaveClickedFn}
            onSaveAndConnectClicked={onSaveAndConnectClickedFn}
            saveButton="enabled"
            saveAndConnectButton="hidden"
            showSaveActions
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

    describe('with save and connect button hidden', function () {
      let onSaveClickedFn: sinon.SinonSpy;
      let onSaveAndConnectClickedFn: sinon.SinonSpy;
      beforeEach(function () {
        onSaveClickedFn = sinon.spy();
        onSaveAndConnectClickedFn = sinon.spy();
        render(
          <ConnectFormActions
            errors={[]}
            warnings={[]}
            onConnectClicked={() => true}
            onSaveClicked={onSaveClickedFn}
            onSaveAndConnectClicked={onSaveAndConnectClickedFn}
            saveButton="hidden"
            saveAndConnectButton="hidden"
            showSaveActions
          ></ConnectFormActions>
        );
      });
      it('should not show the button', function () {
        expect(screen.queryByText('Save & Connect')).to.throw;
      });
    });
    describe('with save and connect button disabled', function () {
      let onSaveClickedFn: sinon.SinonSpy;
      let onSaveAndConnectClickedFn: sinon.SinonSpy;
      beforeEach(function () {
        onSaveClickedFn = sinon.spy();
        onSaveAndConnectClickedFn = sinon.spy();
        render(
          <ConnectFormActions
            errors={[]}
            warnings={[]}
            onConnectClicked={() => true}
            onSaveClicked={onSaveClickedFn}
            onSaveAndConnectClicked={onSaveAndConnectClickedFn}
            saveButton="disabled"
            saveAndConnectButton="disabled"
            showSaveActions
          ></ConnectFormActions>
        );
      });
      it('should show the button', function () {
        const saveAndConnectButton = screen.getByText('Save & Connect');
        expect(saveAndConnectButton).to.be.visible;
      });
      it('should not call onSaveAndConnectClicked function', function () {
        const saveAndConnectButton = screen.getByText('Save & Connect');
        fireEvent(
          saveAndConnectButton,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );
        expect(onSaveAndConnectClickedFn.callCount).to.equal(0);
      });
    });
    describe('with save and connect button enabled', function () {
      let onSaveClickedFn: sinon.SinonSpy;
      let onSaveAndConnectClickedFn: sinon.SinonSpy;
      beforeEach(function () {
        onSaveClickedFn = sinon.spy();
        onSaveAndConnectClickedFn = sinon.spy();
        render(
          <ConnectFormActions
            errors={[]}
            warnings={[]}
            onConnectClicked={() => true}
            onSaveClicked={onSaveClickedFn}
            onSaveAndConnectClicked={onSaveAndConnectClickedFn}
            saveButton="disabled"
            saveAndConnectButton="enabled"
            showSaveActions
          ></ConnectFormActions>
        );
      });
      it('should show the button', function () {
        const saveAndConnectButton = screen.getByText('Save & Connect');
        expect(saveAndConnectButton).to.be.visible;
      });
      it('should call onSaveAndConnectClicked function', function () {
        const saveAndConnectButton = screen.getByText('Save & Connect');
        fireEvent(
          saveAndConnectButton,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );
        expect(onSaveAndConnectClickedFn.callCount).to.equal(1);
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
            onSaveAndConnectClicked={() => true}
            saveButton="hidden"
            saveAndConnectButton="hidden"
            showSaveActions
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
