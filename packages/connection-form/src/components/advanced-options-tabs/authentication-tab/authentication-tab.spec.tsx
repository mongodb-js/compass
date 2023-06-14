import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import AuthenticationTab from './authentication-tab';
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
    <AuthenticationTab
      errors={errors}
      connectionStringUrl={connectionStringUrl}
      updateConnectionFormField={updateConnectionFormField}
      connectionOptions={{
        connectionString: 'mongodb://localhost:27017',
      }}
    />
  );
}

describe('AuthenticationTab Component', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;
  beforeEach(function () {
    updateConnectionFormFieldSpy = sinon.spy();
  });

  describe('when the none auth mechanism is clicked', function () {
    beforeEach(function () {
      renderComponent({
        connectionStringUrl: new ConnectionStringUrl(
          'mongodb://a123:b123@localhost'
        ),
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.click(screen.getAllByRole('radio')[0]);
    });

    it('calls to update the auth mechanism to null', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-auth-mechanism',
        authMechanism: null,
      });
    });
  });

  describe('when a new auth mechanism is clicked', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.click(screen.getByText('LDAP'));
    });

    it('calls to update the auth mechanism', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-auth-mechanism',
        authMechanism: 'PLAIN',
      });
    });
  });

  it('does not render the username/password tab when auth is not set', function () {
    renderComponent({
      connectionStringUrl: new ConnectionStringUrl('mongodb://localhost'),
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    expect(screen.queryByLabelText('Username')).to.not.exist;
    expect(screen.queryByLabelText('Password')).to.not.exist;
  });

  it('renders the username/password tab when auth is set', function () {
    renderComponent({
      errors: [],
      connectionStringUrl: new ConnectionStringUrl(
        'mongodb://a123:b123@localhost'
      ),
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    expect(screen.getByLabelText('Username')).to.be.visible;
    expect(screen.getByLabelText('Password')).to.be.visible;
  });

  it('renders the username/password tab when only password is set', function () {
    renderComponent({
      errors: [],
      connectionStringUrl: new ConnectionStringUrl(
        'mongodb://:b123@localhost',
        { looseValidation: true }
      ),
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    expect(screen.getByLabelText('Username')).to.be.visible;
    expect(screen.getByLabelText('Password')).to.be.visible;
  });
});
