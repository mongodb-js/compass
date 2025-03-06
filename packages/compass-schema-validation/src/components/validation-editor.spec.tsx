import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { ValidationEditor } from './validation-editor';

function renderValidationEditor(
  props: Partial<React.ComponentProps<typeof ValidationEditor>>
) {
  const validation = {
    validator: '',
    validationAction: 'warn',
    validationLevel: 'moderate',
    isChanged: false,
    syntaxError: null,
    error: null,
  } as const;

  return render(
    <ValidationEditor
      namespace="test.test"
      validatorChanged={() => {}}
      validationActionChanged={() => {}}
      validationLevelChanged={() => {}}
      cancelValidation={() => {}}
      saveValidation={() => {}}
      clearSampleDocuments={() => {}}
      serverVersion="8.0.5"
      onClickEnableEditRules={() => {}}
      validation={validation}
      isEditable
      isEditingEnabled
      {...props}
    />
  );
}

describe('ValidationEditor [Component]', function () {
  context(
    'when it is an editable mode but editing is not yet enabled',
    function () {
      let onClickEnableEditRulesSpy: sinon.SinonSpy;
      beforeEach(function () {
        onClickEnableEditRulesSpy = sinon.spy();
        renderValidationEditor({
          onClickEnableEditRules: onClickEnableEditRulesSpy,
          isEditingEnabled: false,
          isEditable: true,
        });
      });

      it('does not allow to edit the editor', function () {
        expect(screen.getByTestId('validation-editor')).to.exist;
        expect(screen.getByRole('textbox').ariaReadOnly).to.eq('true');
        expect(screen.getByTestId('enable-edit-validation-button')).to.be
          .visible;
        expect(onClickEnableEditRulesSpy).to.not.have.been.called;
        userEvent.click(screen.getByTestId('enable-edit-validation-button'));
        expect(onClickEnableEditRulesSpy).to.have.been.calledOnce;
      });
    }
  );

  context('when it is an editable mode and editing is enabled', function () {
    beforeEach(function () {
      renderValidationEditor({
        isEditable: true,
        isEditingEnabled: true,
      });
    });

    it('allows to edit the editor', function () {
      expect(screen.getByRole('textbox').ariaReadOnly).to.eq(null);
      expect(
        screen.queryByTestId('enable-edit-validation-button')
      ).to.not.exist;
    });
  });

  context('when it is a not editable mode', function () {
    beforeEach(function () {
      renderValidationEditor({
        isEditable: false,
      });
    });

    it('sets editor into readonly mode', function () {
      expect(screen.getByRole('textbox').ariaReadOnly).to.eq('true');
      expect(
        screen.queryByTestId('enable-edit-validation-button')
      ).to.not.exist;
    });
  });
});
