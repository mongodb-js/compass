import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { AuthMechanism } from 'mongodb';

import AuthenticationTab from './authentication-tab';
import type { ConnectionFormError } from '../../../utils/validation';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import { ConnectionFormPreferencesContext } from '../../../hooks/use-connect-form-preferences';
import type { ConnectionFormPreferences } from '../../../hooks/use-connect-form-preferences';

function renderComponent({
  errors = [],
  connectionStringUrl = new ConnectionStringUrl('mongodb://localhost:27017'),
  connectionFormPreferences = {
    enableOidc: true,
  },
  updateConnectionFormField,
}: {
  connectionStringUrl?: ConnectionStringUrl;
  connectionFormPreferences?: Partial<ConnectionFormPreferences>;
  errors?: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
}) {
  render(
    <ConnectionFormPreferencesContext.Provider
      value={connectionFormPreferences}
    >
      <AuthenticationTab
        errors={errors}
        connectionStringUrl={connectionStringUrl}
        updateConnectionFormField={updateConnectionFormField}
        connectionOptions={{
          connectionString: 'mongodb://localhost:27017',
        }}
      />
    </ConnectionFormPreferencesContext.Provider>
  );
}

const authMechanisms: {
  title: string;
  id: AuthMechanism;
}[] = [
  {
    title: 'Username/Password',
    id: 'DEFAULT',
  },
  {
    title: 'OIDC (Preview)',
    id: 'MONGODB-OIDC',
  },
  {
    title: 'X.509',
    id: 'MONGODB-X509',
  },
  {
    title: 'Kerberos',
    id: 'GSSAPI',
  },
  {
    title: 'LDAP',
    id: 'PLAIN',
  },
  {
    title: 'AWS IAM',
    id: 'MONGODB-AWS',
  },
];

describe('AuthenticationTab Component', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;
  beforeEach(function () {
    updateConnectionFormFieldSpy = sinon.spy();
  });

  it('renders all of the auth mechanisms', function () {
    renderComponent({
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    authMechanisms.forEach((mechanism) => {
      expect(screen.getByText(mechanism.title)).to.be.visible;
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

  it('renders the username/password tab when auth is not set', function () {
    renderComponent({
      connectionStringUrl: new ConnectionStringUrl('mongodb://localhost'),
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    expect(screen.queryByLabelText('Username')).to.exist;
    expect(screen.queryByLabelText('Password')).to.exist;
  });

  it('renders the username/password tab when auth is set', function () {
    renderComponent({
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
      connectionStringUrl: new ConnectionStringUrl(
        'mongodb://:b123@localhost',
        { looseValidation: true }
      ),
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    expect(screen.getByLabelText('Username')).to.be.visible;
    expect(screen.getByLabelText('Password')).to.be.visible;
  });

  it('should not render OIDC auth when its set to false in the preferences', function () {
    renderComponent({
      connectionFormPreferences: { showOIDCAuth: false },
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    const oidcAuthName = authMechanisms.find(
      (tab) => tab.id === 'MONGODB-OIDC'
    )?.title;
    expect(oidcAuthName).to.not.be.undefined;
    expect(screen.queryByText(oidcAuthName as string)).to.not.exist;
  });

  it('should not render Kerberos auth when its set to false in the preferences', function () {
    renderComponent({
      connectionFormPreferences: { showKerberosAuth: false },
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    const kerberosAuthName = authMechanisms.find(
      (tab) => tab.id === 'GSSAPI'
    )?.title;
    expect(kerberosAuthName).to.not.be.undefined;
    expect(screen.queryByText(kerberosAuthName as string)).to.not.exist;
  });
});
