import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SSHConnectionOptions } from '../../../utils/connection-ssh-handler';

import SSHTunnelIdentity from './ssh-tunnel-identity';
import type { ConnectionFormError } from '../../../utils/validation';
import { errorMessageByFieldName } from '../../../utils/validation';

const formFields = [
  {
    key: 'host',
    value: 'host',
  },
  {
    key: 'port',
    value: '2222',
  },
  {
    key: 'username',
    value: 'username',
  },
  {
    key: 'identityKeyFile',
    value: 'file',
  },
  {
    key: 'identityKeyPassphrase',
    value: 'passphrase',
  },
];

const sshTunnelOptions: SSHConnectionOptions = {
  host: 'old host',
  port: 22,
  username: 'old username',
  identityKeyFile: 'passphrase file',
  identityKeyPassphrase: 'old passphrase',
};

describe('SSHTunnelIdentity', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;

  beforeEach(function () {
    updateConnectionFormFieldSpy = sinon.spy();

    render(
      <SSHTunnelIdentity
        errors={[]}
        sshTunnelOptions={sshTunnelOptions}
        updateConnectionFormField={updateConnectionFormFieldSpy}
      />
    );
  });

  it('renders form fields and their values', function () {
    formFields.forEach(function ({ key }) {
      const el = screen.getByTestId(key);
      expect(el, `renders ${key} field`).to.exist;

      if (key !== 'identityKeyFile') {
        expect(el.getAttribute('value'), `renders ${key} value`).to.equal(
          sshTunnelOptions[key].toString()
        );
      }
    });
  });

  it('calls update handler when field on form changes', function () {
    formFields.forEach(function ({ key, value }, index: number) {
      const target =
        key === 'identityKeyFile'
          ? {
              files: [
                {
                  path: value,
                },
              ],
            }
          : { value };
      fireEvent.change(screen.getByTestId(key), { target });
      expect(
        updateConnectionFormFieldSpy.args[index][0],
        `calls updateConnectionFormField when ${key} field changes`
      ).to.deep.equal({ key, value, type: 'update-ssh-options' });
    });
  });

  it('renders form field error on form when passed', function () {
    const errors: ConnectionFormError[] = [
      {
        fieldName: 'sshHostname',
        message: 'Invalid host',
      },
      {
        fieldName: 'sshUsername',
        message: 'Invalid username',
      },
      {
        fieldName: 'sshIdentityKeyFile',
        message: 'Invalid file',
      },
    ];

    render(
      <SSHTunnelIdentity
        errors={errors}
        sshTunnelOptions={{} as SSHConnectionOptions}
        updateConnectionFormField={updateConnectionFormFieldSpy}
      />
    );

    expect(
      screen.getByText(errorMessageByFieldName(errors, 'sshHostname')),
      'renders sshHostname field error'
    ).to.exist;

    expect(
      screen.getByText(errorMessageByFieldName(errors, 'sshUsername')),
      'renders sshUsername field error'
    ).to.exist;

    expect(
      screen.getByText(errorMessageByFieldName(errors, 'sshIdentityKeyFile')),
      'renders sshIdentityKeyFile field error'
    ).to.exist;
  });
});
