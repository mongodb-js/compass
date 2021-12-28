import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { SSHConnectionOptions } from '../../../utils/connection-options-handler';

import SSHTunnelIdentity from './ssh-tunnel-identity';
import { SSHFormErrors } from '../../../utils/connect-form-errors';

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

const errors: SSHFormErrors = {
  host: 'Invalid host',
  port: 'Invalid port',
  username: 'Invalid username',
  identityKeyFile: 'Invalid file',
  identityKeyPassphrase: 'Invalid passphrase',
};

describe('SSHTunnelIdentity', function () {
  let onConnectionOptionChangedSpy: sinon.SinonSpy;

  beforeEach(function () {
    onConnectionOptionChangedSpy = sinon.spy();

    render(
      <SSHTunnelIdentity
        errors={{} as SSHFormErrors}
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
    const target = key === 'identityKeyFile' ? {
      files: [
        {
          path: value,
        },
      ],
    } : {value};
    it(`calls onConnectionOptionChanged when ${key} field on form changes`, function () {
      fireEvent.change(screen.getByTestId(key), { target });
      expect(onConnectionOptionChangedSpy.args[0]).to.deep.equal([
        key,
        value,
      ]);
    });
  });

  it('renders form field error on form when passed', function () {
    render(
      <SSHTunnelIdentity
        errors={errors}
        sshTunnelOptions={{} as SSHConnectionOptions}
        onConnectionOptionChanged={onConnectionOptionChangedSpy}
      />
    );

    formFields.forEach(function ({ key }) {
      expect(
        screen.getByText(errors[key]),
        `renders ${key} field error`
      ).to.exist;
    });
  });
});
