import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import AuthenticationAws, {
  AWS_ACCESS_KEY_ID_LABEL,
  AWS_SECRET_ACCESS_KEY_LABEL,
  AWS_SESSION_TOKEN_LABEL,
} from './authentication-aws';
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
    <AuthenticationAws
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

  describe('when the Aws Access Key Id input is changed', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.change(screen.getByLabelText(AWS_ACCESS_KEY_ID_LABEL), {
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

  describe('when the Aws Secret Access Key input is changed', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.change(screen.getByLabelText(AWS_SECRET_ACCESS_KEY_LABEL), {
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

  describe('when the Aws Session Token input is changed', function () {
    beforeEach(function () {
      renderComponent({
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);

      fireEvent.change(screen.getByLabelText(AWS_SESSION_TOKEN_LABEL), {
        target: { value: 'good sandwich' },
      });
    });

    it('calls to update the form field', function () {
      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
        key: 'AWS_SESSION_TOKEN',
        type: 'update-auth-mechanism-property',
        value: 'good sandwich',
      });
    });
  });
});
