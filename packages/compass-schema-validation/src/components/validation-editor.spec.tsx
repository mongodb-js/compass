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
        isEditable
        isEditingEnabled
        {...props}
      />
    </PreferencesProvider>
  );
}

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

    it('allows to generate rules', function () {
      const generateBtn = screen.getByTestId('generate-rules-button');
      expect(generateBtn).to.be.visible;
      expect(generateBtn).to.have.attribute('aria-disabled', 'true');
    });
  });
});
