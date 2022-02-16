import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import AuthenticationGssapi, {
  GSSAPI_PRINCIPAL_NAME_LABEL,
  GSSAPI_SERVICE_NAME_LABEL,
  GSSAPI_SERVICE_REALM_LABEL,
} from './authentication-gssapi';
import type { ConnectionFormError } from '../../../utils/validation';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

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
    <AuthenticationGssapi
      errors={errors}
      connectionStringUrl={connectionStringUrl}
      updateConnectionFormField={updateConnectionFormField}
    />
  );
}

describe('AuthenticationGssapi Component', function () {
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

      fireEvent.change(screen.getByLabelText(GSSAPI_PRINCIPAL_NAME_LABEL), {
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

      fireEvent.change(screen.getByLabelText(GSSAPI_SERVICE_NAME_LABEL), {
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

      fireEvent.change(screen.getByLabelText(GSSAPI_SERVICE_REALM_LABEL), {
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

  describe.only('when canoncalize hostname is empty', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });

      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);
    });

    it('updates the form field with CANONICALIZE_HOST_NAME none', function () {
      const button = screen.getByTestId('gssapi-canonicalize-host-name-none');
      fireEvent.click(button);

      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        key: 'CANONICALIZE_HOST_NAME',
        type: 'update-auth-mechanism-property',
        value: 'none',
      });
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
          'mongodb://localhost:27017/?authMechanism=GSSAPI&authSource=%24external&authMechanismProperties=CANONICALIZE_HOST_NAME%3Anone'
        ),
      });

      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);
    });

    it('resets CANONICALIZE_HOST_NAME when Default is selected', function () {
      const button = screen.getByTestId(
        'gssapi-canonicalize-host-name-default'
      );
      fireEvent.click(button);

      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        key: 'CANONICALIZE_HOST_NAME',
        type: 'update-auth-mechanism-property',
        value: '',
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
