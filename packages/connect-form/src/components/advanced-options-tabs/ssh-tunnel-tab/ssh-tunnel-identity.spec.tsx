import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { SSHConnectionOptions } from '../../../utils/connection-ssh-handler';

import SSHTunnelIdentity from './ssh-tunnel-identity';
import { ConnectionFormError, errorMessageByFieldName } from '../../../utils/validation';

const formFields = [
  {
    key: 'host',
    value: 'host',
  },
  {
    key: 'port',
    value: 2222,
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
  let onConnectionOptionChangedSpy: sinon.SinonSpy;

  beforeEach(function () {
    onConnectionOptionChangedSpy = sinon.spy();

    render(
      <SSHTunnelIdentity
        errors={[]}
        sshTunnelOptions={sshTunnelOptions}
        onConnectionOptionChanged={onConnectionOptionChangedSpy}
      />
    );
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  formFields.forEach(function ({ key }) {
    it(`renders ${key} field`, function () {
      const el = screen.getByTestId(key);
      expect(el).to.exist;
    });
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  formFields.forEach(function ({ key }) {
    // not setting value on file input
    if (key !== 'identityKeyFile') {
      it(`renders ${key} field value`, function () {
        const el = screen.getByTestId(key);
        expect(el.getAttribute('value')).to.equal(
          sshTunnelOptions[key].toString()
        );
      });
    }
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  formFields.forEach(function ({ key, value }) {
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
    it(`calls onConnectionOptionChanged when ${key} field on form changes`, function () {
      fireEvent.change(screen.getByTestId(key), { target });
      expect(onConnectionOptionChangedSpy.args[0]).to.deep.equal([key, value]);
    });
  });

  it('renders form field error on form when passed', function () {
    const errors: ConnectionFormError[] = [{
      fieldName: 'sshHostname',
      message: 'Invalid host',
    },
    {
      fieldName: 'sshUsername',
      message: 'Invalid username'
    },
    {
      fieldName: 'sshIdentityKeyFile',
      message: 'Invalid file'
    }];

    render(
      <SSHTunnelIdentity
        errors={errors}
        sshTunnelOptions={{} as SSHConnectionOptions}
        onConnectionOptionChanged={onConnectionOptionChangedSpy}
      />
    );

    expect(
      screen.getByText(errorMessageByFieldName(errors, 'sshHostname')),
      `renders sshHostname field error`
    ).to.exist;

    expect(
      screen.getByText(errorMessageByFieldName(errors, 'sshUsername')),
      `renders sshUsername field error`
    ).to.exist;

    expect(
      screen.getByText(errorMessageByFieldName(errors, 'sshIdentityKeyFile')),
      `renders sshIdentityKeyFile field error`
    ).to.exist;
  });
});
