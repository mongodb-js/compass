import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import ValidationEditor from '.';

describe('ValidationEditor [Component]', function () {
  context('when it is an editable mode', function () {
    const setValidatorChangedSpy = sinon.spy();
    const setValidationActionChangedSpy = sinon.spy();
    const setValidationLevelChangedSpy = sinon.spy();
    const setCancelValidationSpy = sinon.spy();
    const saveValidationSpy = sinon.spy();
    const clearSampleDocumentsSpy = sinon.spy();
    const serverVersion = '3.6.0';
    const validation = {
      validator: '',
      validationAction: 'warn',
      validationLevel: 'moderate',
      isChanged: false,
      syntaxError: null,
      error: null,
    } as const;
    const isEditable = true;

    beforeEach(function () {
      render(
        <ValidationEditor
          namespace="test.test"
          validatorChanged={setValidatorChangedSpy}
          validationActionChanged={setValidationActionChangedSpy}
          validationLevelChanged={setValidationLevelChangedSpy}
          cancelValidation={setCancelValidationSpy}
          saveValidation={saveValidationSpy}
          clearSampleDocuments={clearSampleDocumentsSpy}
          serverVersion={serverVersion}
          validation={validation}
          isEditable={isEditable}
        />
      );
    });

    it('allows to edit the editor', function () {
      expect(screen.getByTestId('validation-editor')).to.exist;
      expect(screen.getByRole('textbox').ariaReadOnly).to.eq(null);
    });
  });

  context('when it is a not editable mode', function () {
    const setValidatorChangedSpy = sinon.spy();
    const setValidationActionChangedSpy = sinon.spy();
    const setValidationLevelChangedSpy = sinon.spy();
    const setCancelValidationSpy = sinon.spy();
    const saveValidationSpy = sinon.spy();
    const clearSampleDocumentsSpy = sinon.spy();
    const serverVersion = '3.6.0';
    const validation = {
      validator: '',
      validationAction: 'warn',
      validationLevel: 'moderate',
      isChanged: false,
      syntaxError: null,
      error: null,
    } as const;
    const isEditable = false;

    beforeEach(function () {
      render(
        <ValidationEditor
          namespace="test.test"
          validatorChanged={setValidatorChangedSpy}
          validationActionChanged={setValidationActionChangedSpy}
          validationLevelChanged={setValidationLevelChangedSpy}
          cancelValidation={setCancelValidationSpy}
          saveValidation={saveValidationSpy}
          clearSampleDocuments={clearSampleDocumentsSpy}
          serverVersion={serverVersion}
          validation={validation}
          isEditable={isEditable}
        />
      );
    });

    it('sets editor into readonly mode', function () {
      expect(screen.getByRole('textbox').ariaReadOnly).to.eq('true');
    });
  });
});
