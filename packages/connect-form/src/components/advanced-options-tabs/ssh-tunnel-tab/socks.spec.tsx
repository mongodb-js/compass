import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import SSHTunnelSocks from './socks';

const formFields = [
  {
    key: 'proxyHost',
    value: 'host',
  },
  {
    key: 'proxyHost',
    value: '2222',
  },
  {
    key: 'proxyUsername',
    value: 'username',
  },
  {
    key: 'proxyPassword',
    value: 'password',
  },
];

const proxyParams = {
  proxyHost: 'hello-world.com',
  proxyPort: 1080,
  proxyUsername: 'cosmo',
  proxyPassword: 'kramer',
};
const connectionStringUrl = new ConnectionStringUrl(
  'mongodb+srv://0ranges:p!neapp1es@localhost/'
);

for (const key in proxyParams) {
  connectionStringUrl.searchParams.set(key, proxyParams[key]);
}

describe('TunnelSocks', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;

  beforeEach(function () {
    updateConnectionFormFieldSpy = sinon.spy();

    render(
      <SSHTunnelSocks
        errors={[]}
        updateConnectionFormField={updateConnectionFormFieldSpy}
        connectionStringUrl={connectionStringUrl}
      />
    );
  });

  it('renders form fields and their values', function () {
    formFields.forEach(function ({ key }) {
      const el = screen.getByTestId(key);
      expect(el, `renders ${key} field`).to.exist;
      expect(el.getAttribute('value'), `renders ${key} value`).to.equal(
        proxyParams[key]
      );
    });
  });

  it('calls update handler when field on form changes - update', function () {
    formFields.forEach(function ({ key, value }, index: number) {
      fireEvent.change(screen.getByTestId(key), { target: { value } });
      expect(
        updateConnectionFormFieldSpy.args[index][0],
        `calls updateConnectionFormField when ${key} field changes`
      ).to.deep.equal({ currentKey: key, value, type: 'update-search-param' });
    });
  });

  it('calls update handler when field on form changes - delete', function () {
    formFields.forEach(function ({ key }, index: number) {
      fireEvent.change(screen.getByTestId(key), { target: { value: '' } });
      expect(
        updateConnectionFormFieldSpy.args[index][0],
        `calls updateConnectionFormField when ${key} field changes`
      ).to.deep.equal({ key, type: 'delete-search-param' });
    });
  });
});
