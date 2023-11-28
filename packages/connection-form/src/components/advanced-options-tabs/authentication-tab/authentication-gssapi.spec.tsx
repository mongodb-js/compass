import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import AuthenticationGssapi from './authentication-gssapi';
import type { ConnectionFormError } from '../../../utils/validation';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import { ConnectionFormPreferencesContext } from '../../../hooks/use-connect-form-preferences';

function renderComponent({
  errors = [],
  connectionStringUrl = new ConnectionStringUrl('mongodb://localhost:27017'),
  updateConnectionFormField,
}: {
  connectionStringUrl?: ConnectionStringUrl;
  errors?: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
}) {
  render(
    <ConnectionFormPreferencesContext.Provider
      value={{ showKerberosPasswordField: true }}
    >
      <AuthenticationGssapi
        errors={errors}
        connectionStringUrl={connectionStringUrl}
        updateConnectionFormField={updateConnectionFormField}
      />
    </ConnectionFormPreferencesContext.Provider>
  );
}

describe('AuthenticationGssapi Component', function () {
  afterEach(cleanup);

  let updateConnectionFormFieldSpy: sinon.SinonSpy;
  beforeEach(function () {
    updateConnectionFormFieldSpy = sinon.spy();
  });

  describe('when the kerberosPrincipal input is changed', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.change(screen.getByTestId('gssapi-principal-input'), {
        target: { value: 'good sandwich' },
      });
    });

    it('calls to update the form field', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-username',
        username: 'good sandwich',
      });
    });
  });

  describe('when the serviceName input is changed', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.change(screen.getByTestId('gssapi-service-name-input'), {
        target: { value: 'good sandwich' },
      });
    });

    it('calls to update the form field', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        key: 'SERVICE_NAME',
        type: 'update-auth-mechanism-property',
        value: 'good sandwich',
      });
    });
  });

  describe('when the serviceRealm input is changed', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.change(screen.getByTestId('gssapi-service-realm-input'), {
        target: { value: 'good sandwich' },
      });
    });

    it('calls to update the form field', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        key: 'SERVICE_REALM',
        type: 'update-auth-mechanism-property',
        value: 'good sandwich',
      });
    });
  });

  describe('when canoncalize hostname is empty', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });

      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);
    });

    it('selects None', function () {
      const radio = screen
        .getByTestId('gssapi-canonicalize-host-name-none')
        .closest('input');

      expect(radio.checked).to.be.true;
    });

    it('updates the form field with CANONICALIZE_HOST_NAME forward', function () {
      const button = screen.getByTestId(
        'gssapi-canonicalize-host-name-forward'
      );
      fireEvent.click(button);

      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        key: 'CANONICALIZE_HOST_NAME',
        type: 'update-auth-mechanism-property',
        value: 'forward',
      });
    });

    it('updates the form field with CANONICALIZE_HOST_NAME forwardAndReverse', function () {
      const button = screen.getByTestId(
        'gssapi-canonicalize-host-name-forwardAndReverse'
      );
      fireEvent.click(button);

      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        key: 'CANONICALIZE_HOST_NAME',
        type: 'update-auth-mechanism-property',
        value: 'forwardAndReverse',
      });
    });
  });

  describe('when canoncalize hostname is set', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
        connectionStringUrl: new ConnectionStringUrl(
          'mongodb://localhost:27017/?authMechanism=GSSAPI&authSource=%24external&authMechanismProperties=CANONICALIZE_HOST_NAME%3Aforward'
        ),
      });

      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);
    });

    it('resets CANONICALIZE_HOST_NAME when None is selected', function () {
      const button = screen.getByTestId('gssapi-canonicalize-host-name-none');
      fireEvent.click(button);

      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        key: 'CANONICALIZE_HOST_NAME',
        type: 'update-auth-mechanism-property',
        value: '',
      });
    });
  });

  describe('Kerberos password support', function () {
    describe('when password is not in the connection string', function () {
      beforeEach(function () {
        renderComponent({
          updateConnectionFormField: updateConnectionFormFieldSpy,
        });

        expect(updateConnectionFormFieldSpy.callCount).to.equal(0);
      });

      it('allows to edit the password when enter password directly is enabled', function () {
        expect(screen.queryByTestId('gssapi-password-input')).to.not.exist;
        const checkbox = screen.getByTestId('gssapi-password-checkbox');
        expect(checkbox.closest('input').checked).to.be.false;

        fireEvent.click(checkbox);

        const passwordInput = screen.getByTestId('gssapi-password-input');

        fireEvent.change(passwordInput, {
          target: { value: 'some-password' },
        });

        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-password',
          password: 'some-password',
        });
      });
    });

    describe('when password is in the connection string', function () {
      beforeEach(function () {
        renderComponent({
          connectionStringUrl: new ConnectionStringUrl(
            'mongodb://user:password@localhost:27017'
          ),
          updateConnectionFormField: updateConnectionFormFieldSpy,
        });

        expect(updateConnectionFormFieldSpy.callCount).to.equal(0);
      });

      it('enables the checkbox and shows the password input', function () {
        const checkbox = screen.getByTestId('gssapi-password-checkbox');
        expect(checkbox.closest('input').checked).to.be.true;
        const passwordInput = screen.queryByTestId('gssapi-password-input');
        expect(passwordInput).to.exist;
        expect(passwordInput.closest('input').value).to.equal('password');
      });

      it('resets the password when the checkbox is unchecked', function () {
        const checkbox = screen.getByTestId('gssapi-password-checkbox');
        expect(checkbox.closest('input').checked).to.be.true;
        fireEvent.click(checkbox);

        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-password',
          password: '',
        });
      });
    });
  });

  it('renders an error when there is a kerberosPrincipal error', function () {
    renderComponent({
      errors: [
        {
          fieldTab: 'authentication',
          fieldName: 'kerberosPrincipal',
          message: 'kerberosPrincipal error',
        },
      ],
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    expect(screen.getByText('kerberosPrincipal error')).to.be.visible;
  });
});
