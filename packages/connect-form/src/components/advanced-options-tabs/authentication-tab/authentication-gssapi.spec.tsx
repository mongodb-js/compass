import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import AuthenticationGssapi from './authentication-gssapi';
import { ConnectionFormError } from '../../../utils/validation';
import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

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

describe.only('AuthenticationGssapi Component', function () {
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

      fireEvent.change(screen.getByLabelText('Principal'), {
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

      fireEvent.change(screen.getByLabelText('Service Name'), {
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

      fireEvent.change(screen.getByLabelText('Service Realm'), {
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

  describe('when the canoncalize hostname is changed', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });

      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);
      const checkbox = screen.getByLabelText('Canonicalize Host Name');
      fireEvent.click(checkbox);
    });

    it('calls to update the form field', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        key: 'CANONICALIZE_HOST_NAME',
        type: 'update-auth-mechanism-property',
        value: 'true',
      });
    });
  });

  it('renders an error when there is a kerberosPrincipal error', function () {
    renderComponent({
      errors: [
        {
          fieldName: 'kerberosPrincipal',
          message: 'kerberosPrincipal error',
        },
      ],
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    expect(screen.getByText('kerberosPrincipal error')).to.be.visible;
  });
});
