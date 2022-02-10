import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import AuthenticationDefault from './authentication-default';
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
    <AuthenticationDefault
      errors={errors}
      connectionStringUrl={connectionStringUrl}
      updateConnectionFormField={updateConnectionFormField}
    />
  );
}

describe('AuthenticationDefault Component', function () {
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

  describe('when the password input is changed', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: '1234' },
      });
    });

    it('calls to update the form field', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-password',
        password: '1234',
      });
    });
  });

  describe('when the auth database input is changed', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.change(screen.getAllByRole('textbox')[1], {
        target: { value: 'wave' },
      });
    });

    it('calls to update the search param on the connection', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-search-param',
        currentKey: 'authSource',
        value: 'wave',
      });
    });
  });

  describe('when the auth database input is changed to an empty value', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
        connectionStringUrl: new ConnectionStringUrl(
          'mongodb://localhost:27017?authSource=testers'
        ),
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.change(screen.getAllByRole('textbox')[1], {
        target: { value: '' },
      });
    });

    it('calls to delete the search param on the connection', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'delete-search-param',
        key: 'authSource',
      });
    });
  });

  describe('when a new auth mechanism is clicked', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.click(screen.getAllByRole('radio')[2]);
    });

    it('calls to update the auth mechanism', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-search-param',
        currentKey: 'authMechanism',
        value: 'SCRAM-SHA-256',
      });
    });
  });

  it('decodes the username as a uri component before rendering', function () {
    renderComponent({
      connectionStringUrl: new ConnectionStringUrl(
        'mongodb://C%3BIb86n5b8%7BAnExew%5BTU%25XZy%2C)E6G!dk:password@outerspace:12345'
      ),
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    expect(screen.getByLabelText('Username').getAttribute('value')).to.equal(
      'C;Ib86n5b8{AnExew[TU%XZy,)E6G!dk'
    );
  });

  it('decodes the password as a uri component before rendering', function () {
    renderComponent({
      connectionStringUrl: new ConnectionStringUrl(
        'mongodb://username:C%3BIb86n5b8%7BAnExew%5BTU%25XZy%2C)E6G!dk@outerspace:12345'
      ),
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    expect(screen.getByLabelText('Password').getAttribute('value')).to.equal(
      'C;Ib86n5b8{AnExew[TU%XZy,)E6G!dk'
    );
  });

  it('renders a username error when there is a username error', function () {
    renderComponent({
      errors: [
        {
          fieldName: 'username',
          message: 'username error',
        },
      ],
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    expect(screen.getByText('username error')).to.be.visible;
  });

  it('renders a password error when there is a password error', function () {
    renderComponent({
      errors: [
        {
          fieldName: 'password',
          message: 'password error',
        },
      ],
      updateConnectionFormField: updateConnectionFormFieldSpy,
    });

    expect(screen.getByText('password error')).to.be.visible;
  });
});
