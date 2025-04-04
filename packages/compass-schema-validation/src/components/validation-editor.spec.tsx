import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { ValidationEditor } from './validation-editor';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

async function renderValidationEditor(
  props: Partial<React.ComponentProps<typeof ValidationEditor>>
) {
  const validation = {
    validator: '{}',
    validationAction: 'warn',
    validationLevel: 'moderate',
    isChanged: false,
    syntaxError: null,
    error: null,
  } as const;

  const preferences = await createSandboxFromDefaultPreferences();
  await preferences.savePreferences({ enableExportSchema: true });

  return render(
    <PreferencesProvider value={preferences}>
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
        generateValidationRules={() => {}}
        isRulesGenerationInProgress={false}
        isSavingInProgress={false}
        isEditable
        isEditingEnabled
        {...props}
      />
    </PreferencesProvider>
  );
}

const updateValidationTestId = 'update-validation-button';

describe('ValidationEditor [Component]', function () {
  context(
    'when it is an editable mode but editing is not yet enabled',
    function () {
      let onClickEnableEditRulesSpy: sinon.SinonSpy;
      beforeEach(async function () {
        onClickEnableEditRulesSpy = sinon.spy();
        await renderValidationEditor({
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
    beforeEach(async function () {
      await renderValidationEditor({
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
    beforeEach(async function () {
      await renderValidationEditor({
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

  context('when the validator is empty', function () {
    let onGenerateRulesSpy: sinon.SinonSpy;
    beforeEach(async function () {
      onGenerateRulesSpy = sinon.spy();
      await renderValidationEditor({
        generateValidationRules: onGenerateRulesSpy,
        isEditable: true,
        validation: {
          validator: '',
          validationAction: 'error',
          validationLevel: 'moderate',
          isChanged: false,
          syntaxError: null,
          error: null,
        },
      });
    });

    it('allows to generate rules', function () {
      const generateBtn = screen.getByRole('button', {
        name: 'Generate rules',
      });
      expect(generateBtn).to.be.visible;
      userEvent.click(generateBtn);
      expect(onGenerateRulesSpy).to.have.been.calledOnce;
    });
  });

  context('when the validator is empty object', function () {
    let onGenerateRulesSpy: sinon.SinonSpy;
    beforeEach(async function () {
      onGenerateRulesSpy = sinon.spy();
      await renderValidationEditor({
        generateValidationRules: onGenerateRulesSpy,
        isEditable: true,
        validation: {
          validator: '{}',
          validationAction: 'error',
          validationLevel: 'moderate',
          isChanged: false,
          syntaxError: null,
          error: null,
        },
      });
    });

    it('allows to generate rules', function () {
      const generateBtn = screen.getByRole('button', {
        name: 'Generate rules',
      });
      expect(generateBtn).to.be.visible;
      userEvent.click(generateBtn);
      expect(onGenerateRulesSpy).to.have.been.calledOnce;
    });
  });

  context('when rules generation is in progress', function () {
    beforeEach(async function () {
      await renderValidationEditor({
        isEditable: true,
        isRulesGenerationInProgress: true,
        validation: {
          validator: '{}',
          validationAction: 'error',
          validationLevel: 'moderate',
          isChanged: false,
          syntaxError: null,
          error: null,
        },
      });
    });

    it('disables the ability to generate rules', function () {
      const generateBtn = screen.getByTestId('generate-rules-button');
      expect(generateBtn).to.be.visible;
      expect(generateBtn).to.have.attribute('aria-disabled', 'true');
    });
  });

  context('when the validator is not changed', function () {
    beforeEach(async function () {
      await renderValidationEditor({
        validation: {
          validator: '{}',
          validationAction: 'error',
          validationLevel: 'moderate',
          isChanged: false,
          syntaxError: null,
          error: null,
        },
      });
    });

    it('does not allow applying the rules', function () {
      const applyBtn = screen.queryByTestId(updateValidationTestId);
      expect(applyBtn).to.not.exist;
    });
  });

  context('when the validator is changed', function () {
    beforeEach(async function () {
      await renderValidationEditor({
        validation: {
          validator: '{}',
          validationAction: 'error',
          validationLevel: 'moderate',
          isChanged: true,
          syntaxError: null,
          error: null,
        },
      });
    });

    it('allows to apply changes', function () {
      const applyBtn = screen.getByTestId(updateValidationTestId);
      expect(applyBtn).to.be.visible;
      expect(applyBtn).to.have.attribute('aria-disabled', 'false');
    });
  });

  context('when the validation saving is in progress', function () {
    beforeEach(async function () {
      await renderValidationEditor({
        validation: {
          validator: '{}',
          validationAction: 'error',
          validationLevel: 'moderate',
          isChanged: true,
          syntaxError: null,
          error: null,
        },
        isSavingInProgress: true,
      });
    });

    it('disables the apply button and shows a spin loader', function () {
      const applyBtn = screen.queryByTestId(updateValidationTestId);
      expect(applyBtn).to.be.visible;
      expect(applyBtn).to.have.attribute('aria-disabled', 'true');
    });
  });

  context('with errorAndLog', function () {
    it('should be hidden for server version <8.1', async function () {
      await renderValidationEditor({
        serverVersion: '6.0.0',
      });

      expect(
        screen.queryByTestId('validation-action-error-and-log-option')
      ).is.null;

      userEvent.click(screen.getByTestId('validation-action-selector'));

      expect(
        screen.queryByTestId('validation-action-option-error-and-log')
      ).is.null;
    });

    it('should be visible for server version >=8.1', async function () {
      await renderValidationEditor({
        serverVersion: '8.1.0',
      });

      expect(
        screen.queryByTestId('validation-action-error-and-log-option')
      ).is.null;

      userEvent.click(screen.getByTestId('validation-action-selector'));

      expect(
        screen.queryByTestId('validation-action-option-error-and-log')
      ).is.not.null;
    });
  });
});
