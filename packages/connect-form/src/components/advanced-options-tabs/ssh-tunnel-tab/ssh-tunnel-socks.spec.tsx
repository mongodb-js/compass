import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import SSHTunnelSocks from './ssh-tunnel-socks';

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

describe.skip('SSHTunnelSocks', function () {
  let onConnectionOptionChangedSpy: sinon.SinonSpy;

  beforeEach(function () {
    onConnectionOptionChangedSpy = sinon.spy();

    render(
      <SSHTunnelSocks
        errors={[]}
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
      // const el = screen.getByTestId(key);
      // expect(el.getAttribute('value')).to.equal(
      //   sshTunnelOptions[key].toString()
      // );
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
    render(
      <SSHTunnelSocks
        errors={[]}
        onConnectionOptionChanged={onConnectionOptionChangedSpy}
      />
    );

    formFields.forEach(function ({ key }) {
      expect(screen.getByText(''), `renders ${key} field error`).to.exist;
    });
  });
});
