import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import AuthenticationPlain, {
  PLAIN_USERNAME_LABEL,
  PLAIN_PASSWORD_LABEL,
} from './authentication-plain';
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
    <AuthenticationPlain
      errors={errors}
      connectionStringUrl={connectionStringUrl}
      updateConnectionFormField={updateConnectionFormField}
    />
  );
}

describe('AuthenticationAws Component', function () {
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

      fireEvent.change(screen.getByLabelText(PLAIN_USERNAME_LABEL), {
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

      fireEvent.change(screen.getByLabelText(PLAIN_PASSWORD_LABEL), {
        target: { value: 'good sandwich' },
      });
    });

    it('calls to update the form field', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        type: 'update-password',
        password: 'good sandwich',
      });
    });
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
