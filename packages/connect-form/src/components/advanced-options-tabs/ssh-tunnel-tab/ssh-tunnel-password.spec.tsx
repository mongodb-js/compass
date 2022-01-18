import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { SSHConnectionOptions } from '../../../utils/connection-ssh-handler';

import SSHTunnelPassword from './ssh-tunnel-password';
import {
  ConnectionFormError,
  errorMessageByFieldName,
} from '../../../utils/validation';

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
    key: 'password',
    value: 'password',
  },
];

const sshTunnelOptions: SSHConnectionOptions = {
  host: 'old host',
  port: 22,
  username: 'old username',
  password: 'old password',
};

describe('SSHTunnelPassword', function () {
  let onConnectionOptionChangedSpy: sinon.SinonSpy;

  beforeEach(function () {
    onConnectionOptionChangedSpy = sinon.spy();

    render(
      <SSHTunnelPassword
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
    it(`renders ${key} field value`, function () {
      const el = screen.getByTestId(key);
      expect(el.getAttribute('value')).to.equal(
        sshTunnelOptions[key].toString()
      );
    });
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  formFields.forEach(function ({ key, value }) {
    it(`calls onConnectionOptionChanged when ${key} field on form changes`, function () {
      fireEvent.change(screen.getByTestId(key), { target: { value } });
      expect(onConnectionOptionChangedSpy.args[0]).to.deep.equal([key, value]);
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
        fieldName: 'sshPassword',
        message: 'Invalid password',
      },
    ];

    render(
      <SSHTunnelPassword
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
      screen.getByText(errorMessageByFieldName(errors, 'sshPassword')),
      `renders sshPassword field error`
    ).to.exist;
  });
});
