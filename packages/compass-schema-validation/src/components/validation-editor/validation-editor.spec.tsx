import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import ValidationEditor from '.';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

describe('ValidationEditor [Component]', function () {
  context('when it is an editable mode', function () {
    let component: ReturnType<typeof mount> | null;
    const setValidatorChangedSpy = sinon.spy();
    const setValidationActionChangedSpy = sinon.spy();
    const setValidationLevelChangedSpy = sinon.spy();
    const setCancelValidationSpy = sinon.spy();
    const saveValidationSpy = sinon.spy();
    const clearSampleDocumentsSpy = sinon.spy();
    const serverVersion = '3.6.0';
    const fields: any[] = [];
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
      component = mount(
        <ValidationEditor
          validatorChanged={setValidatorChangedSpy}
          validationActionChanged={setValidationActionChangedSpy}
          validationLevelChanged={setValidationLevelChangedSpy}
          cancelValidation={setCancelValidationSpy}
          saveValidation={saveValidationSpy}
          clearSampleDocuments={clearSampleDocumentsSpy}
          serverVersion={serverVersion}
          fields={fields}
          validation={validation}
          isEditable={isEditable}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the wrapper div', function () {
      expect(component!.find('ValidationEditor')).to.exist;
      expect(
        component!.find(CodemirrorMultilineEditor).props().readOnly
      ).to.be.equal(false);
    });
  });

  context('when it is a not editable mode', function () {
    let component: ReturnType<typeof mount> | null;
    const setValidatorChangedSpy = sinon.spy();
    const setValidationActionChangedSpy = sinon.spy();
    const setValidationLevelChangedSpy = sinon.spy();
    const setCancelValidationSpy = sinon.spy();
    const saveValidationSpy = sinon.spy();
    const clearSampleDocumentsSpy = sinon.spy();
    const serverVersion = '3.6.0';
    const fields: any[] = [];
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
      component = mount(
        <ValidationEditor
          validatorChanged={setValidatorChangedSpy}
          validationActionChanged={setValidationActionChangedSpy}
          validationLevelChanged={setValidationLevelChangedSpy}
          cancelValidation={setCancelValidationSpy}
          saveValidation={saveValidationSpy}
          clearSampleDocuments={clearSampleDocumentsSpy}
          serverVersion={serverVersion}
          fields={fields}
          validation={validation}
          isEditable={isEditable}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the wrapper div', function () {
      expect(
        component!.find(CodemirrorMultilineEditor).props().readOnly
      ).to.be.equal(true);
    });
  });
});
