import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { ConnectionOptions } from 'mongodb-data-service';

import AuthenticationOIDC from './authentication-oidc';
import type { ConnectionFormError } from '../../../utils/validation';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

function renderComponent({
  errors = [],
  connectionOptions,
  connectionStringUrl = new ConnectionStringUrl(
    'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC'
  ),
  updateConnectionFormField,
}: {
  connectionOptions?: ConnectionOptions;
  connectionStringUrl?: ConnectionStringUrl;
  errors?: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
}) {
  render(
    <AuthenticationOIDC
      errors={errors}
      connectionStringUrl={connectionStringUrl}
      connectionOptions={
        connectionOptions ?? {
          connectionString: connectionStringUrl.toString(),
        }
      }
      updateConnectionFormField={updateConnectionFormField}
    />
  );
}

const openOptionsAccordion = () =>
  fireEvent.click(screen.getByText('OIDC Options'));

describe('AuthenticationOIDC Component', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;
  beforeEach(function () {
    updateConnectionFormFieldSpy = sinon.spy();
  });

  describe('when the username input is changed', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.change(screen.getAllByRole('textbox')[0], {
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

  describe('when the auth redirect flow uri is changed', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      openOptionsAccordion();
      fireEvent.change(screen.getAllByRole('textbox')[1], {
        target: { value: 'big sandwich' },
      });
    });

    it('calls to update the form field', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-oidc-param',
        key: 'redirectURI',
        value: 'big sandwich',
      });
    });
  });

  describe('when the allow untrusted endpoint checkbox is clicked', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      openOptionsAccordion();
      fireEvent.click(screen.getByText('Enable untrusted target endpoint'));
    });

    it('calls to update the ALLOWED_HOSTS auth mechanism form field', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-auth-mechanism-property',
        key: 'ALLOWED_HOSTS',
        value: '*',
      });
    });
  });

  describe('when allow untrusted endpoint checkbox is clicked and ALLOWED_HOSTS is set', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
        connectionStringUrl: new ConnectionStringUrl(
          'mongodb://localhost:27017?authMechanism=MONGODB-OIDC&authMechanismProperties=ALLOWED_HOSTS%3A*'
        ),
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      openOptionsAccordion();
      fireEvent.click(screen.getByText('Enable untrusted target endpoint'));
    });

    it('calls to unset the ALLOWED_HOSTS auth mechanism form field', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-auth-mechanism-property',
        key: 'ALLOWED_HOSTS',
        value: '',
      });
    });
  });

  describe('when enable device authentication flow checkbox is clicked and ALLOWED_HOSTS is set', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
        connectionStringUrl: new ConnectionStringUrl(
          'mongodb://localhost:27017?authMechanism=MONGODB-OIDC'
        ),
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      openOptionsAccordion();
      fireEvent.click(screen.getByText('Enable device authentication flow'));
    });

    it('calls to set the allowedFlows oidc field to device-auth', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-oidc-param',
        key: 'allowedFlows',
        value: ['device-auth'],
      });
    });
  });

  describe('when enable device authentication flow checkbox is clicked and is already enabled', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://localhost:27017?authMechanism=MONGODB-OIDC&authMechanismProperties=ALLOWED_HOSTS%3A*'
      );
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
        connectionStringUrl,
        connectionOptions: {
          connectionString: connectionStringUrl.toString(),
          oidc: {
            allowedFlows: ['device-auth'],
          },
        },
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      openOptionsAccordion();
      fireEvent.click(screen.getByText('Enable device authentication flow'));
    });

    it('calls to unset the allowedFlows oidc field', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-oidc-param',
        key: 'allowedFlows',
        value: null,
      });
    });
  });
});
